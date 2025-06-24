import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { promises as fs } from 'fs'
import path from 'path'

const PROMPTS_FILE = path.join(process.cwd(), 'prompts.json')

// API Route 타임아웃 설정 (60초)
export const maxDuration = 60

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface Winner {
  name: string
  id: string
  contact: string
}

interface DrawResult {
  winners: Winner[]
  totalParticipants: number
  requestedCount: number
  validParticipants: number
  finalSelectedCount: number
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const condition = formData.get('condition') as string
    const count = parseInt(formData.get('count') as string)
    const file = formData.get('file') as File

    if (!condition || !count || !file) {
      return NextResponse.json(
        { error: '모든 필수 항목을 입력해주세요.' },
        { status: 400 }
      )
    }

    // 파일 읽기
    const buffer = await file.arrayBuffer()
    let participantData: any[] = []

    if (file.name.endsWith('.xlsx')) {
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      participantData = XLSX.utils.sheet_to_json(worksheet)
    } else if (file.name.endsWith('.csv')) {
      const text = new TextDecoder('utf-8').decode(buffer)
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true })
      participantData = parsed.data as any[]
    } else {
      return NextResponse.json(
        { error: '지원하지 않는 파일 형식입니다.' },
        { status: 400 }
      )
    }

    if (participantData.length === 0) {
      return NextResponse.json(
        { error: '참여자 데이터가 없습니다.' },
        { status: 400 }
      )
    }

    // 저장된 프롬프트 불러오기
    let systemPrompt = "당신은 이벤트 당첨자를 공정하게 선정하는 전문가입니다."
    let userPromptTemplate = "조건: {condition}\n인원: {count}명\n데이터: {participantData}"
    
    try {
      const promptsData = await fs.readFile(PROMPTS_FILE, 'utf8')
      const prompts = JSON.parse(promptsData)
      systemPrompt = prompts.systemPrompt
      userPromptTemplate = prompts.userPromptTemplate
    } catch (error) {
      console.log('프롬프트 파일을 읽을 수 없어 기본값을 사용합니다.')
    }

    // 프롬프트 템플릿에 변수 치환
    const prompt = userPromptTemplate
      .replace('{condition}', condition)
      .replace('{count}', count.toString())
      .replace('{participantData}', JSON.stringify(participantData, null, 2))

    // OpenAI API 호출 (타임아웃 60초)
    const completion = await Promise.race([
      openai.chat.completions.create({
        model: 'o4-mini-2025-04-16', // 최신 o4-mini 모델 사용
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_completion_tokens: 4000,
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OpenAI API 요청이 60초를 초과했습니다.')), 60000)
      )
    ]) as any

    const response = completion.choices[0]?.message?.content
    if (!response) {
      return NextResponse.json(
        { error: 'OpenAI API 응답을 받을 수 없습니다.' },
        { status: 500 }
      )
    }

    // JSON 파싱
    let result: DrawResult
    try {
      // ```json으로 감싸진 경우 제거
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/)
      const jsonString = jsonMatch ? jsonMatch[1] : response
      result = JSON.parse(jsonString)
      
      // 한글 텍스트 검증 및 복구
      if (result.winners) {
        result.winners = result.winners.map((winner, index) => {
          // 이름이 깨진 경우 원본 데이터에서 복구 시도
          if (!winner.name || winner.name.includes('�') || winner.name.includes('◇')) {
            console.warn(`당첨자 ${index + 1}의 이름이 깨짐: ${winner.name}`)
            // 원본 데이터에서 매칭되는 항목 찾기
            const originalEntry = participantData.find(p => 
              p.id === winner.id || 
              p.contact === winner.contact ||
              (p.name && p.name.length > 0)
            )
            if (originalEntry && originalEntry.name) {
              winner.name = originalEntry.name
            } else {
              winner.name = `참여자 ${index + 1}`
            }
          }
          return winner
        })
      }
    } catch (parseError) {
      console.error('JSON 파싱 오류:', response)
      return NextResponse.json(
        { error: 'OpenAI 응답을 파싱할 수 없습니다.' },
        { status: 500 }
      )
    }

    // 결과 검증
    if (!result.winners || !Array.isArray(result.winners)) {
      return NextResponse.json(
        { error: '올바르지 않은 응답 형식입니다.' },
        { status: 500 }
      )
    }

    // 필수 필드 검증
    if (typeof result.totalParticipants !== 'number' ||
        typeof result.requestedCount !== 'number' ||
        typeof result.validParticipants !== 'number' ||
        typeof result.finalSelectedCount !== 'number') {
      return NextResponse.json(
        { error: '응답 데이터 형식이 올바르지 않습니다.' },
        { status: 500 }
      )
    }

    if (result.winners.length === 0) {
      return NextResponse.json(
        { error: '선정 조건에 맞는 참여자가 없습니다.' },
        { status: 400 }
      )
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 
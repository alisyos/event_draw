import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const PROMPTS_FILE = path.join(process.cwd(), 'prompts.json')

interface PromptData {
  systemPrompt: string
  userPromptTemplate: string
}

// 기본 프롬프트 불러오기
export async function GET() {
  try {
    const data = await fs.readFile(PROMPTS_FILE, 'utf8')
    const prompts: PromptData = JSON.parse(data)
    return NextResponse.json(prompts)
  } catch (error) {
    console.error('프롬프트 파일 읽기 실패:', error)
    
    // 파일이 없으면 기본값 반환
    const defaultPrompts: PromptData = {
      systemPrompt: "당신은 이벤트 당첨자를 공정하게 선정하는 전문가입니다.",
      userPromptTemplate: "조건: {condition}\n인원: {count}명\n데이터: {participantData}"
    }
    
    return NextResponse.json(defaultPrompts)
  }
}

// 프롬프트 저장하기
export async function POST(request: NextRequest) {
  try {
    const prompts: PromptData = await request.json()
    
    // 유효성 검사
    if (!prompts.systemPrompt || !prompts.userPromptTemplate) {
      return NextResponse.json(
        { error: '시스템 프롬프트와 사용자 프롬프트 템플릿은 필수입니다.' },
        { status: 400 }
      )
    }

    // 파일에 저장
    await fs.writeFile(PROMPTS_FILE, JSON.stringify(prompts, null, 2), 'utf8')
    
    return NextResponse.json({ success: true, message: '프롬프트가 저장되었습니다.' })
  } catch (error) {
    console.error('프롬프트 저장 실패:', error)
    return NextResponse.json(
      { error: '프롬프트 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 
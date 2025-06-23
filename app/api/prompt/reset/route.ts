import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const PROMPTS_FILE = path.join(process.cwd(), 'prompts.json')

interface PromptData {
  systemPrompt: string
  userPromptTemplate: string
}

const DEFAULT_PROMPTS: PromptData = {
  systemPrompt: "당신은 이벤트 당첨자를 공정하게 선정하는 전문가입니다. 주어진 조건에 따라 정확하게 필터링하고 중복을 제거한 후 무작위로 당첨자를 선정합니다. **중요**: 참여자의 이름, ID, 연락처 등 모든 개인정보는 원본 데이터에서 한 글자도 변경하지 말고 정확히 그대로 사용해야 합니다. 절대로 데이터를 수정, 변형, 번역하지 마세요. 반드시 요청된 JSON 형식으로만 응답하세요.",
  userPromptTemplate: `###지시사항
업로드된 **이벤트 참여자 정보**를 기반으로  
1) **필터 조건**을 충족하고  
2) **중복을 제거**한 뒤
3) **무작위(Random) 로직**으로 N명을 추첨하여  
4) **당첨자 리스트(winners)** 를 산출하십시오.  

###작성절차
1. **필터 적용(filteredData)**  
   - 선정 조건(\`filterCondition\`)을 만족하는 행만 남김 → **filteredData**
2. **중복 제거(dedupData)**
   - \`filteredData\`에서 **모든 열 값**이 완전히 동일한 행은 하나만 유지 → **dedupData**
   - 값이 목록이면 그 열 조합으로만 중복을 판단.
3. **랜덤 시드 설정**  
   - 현재 시간(밀리초)을 시드로 사용한다.
4. 무작위 선정(winners)
  - dedupData를 무작위로 한 번 섞고(shuffle) 상위 selectCount개를 그대로 추출한다.
  - 만약 dedupData의 크기가 selectCount보다 작으면, 가능한 모든 데이터를 반환한다.
  - 섞은 직후 재정렬·재배치 금지.
5. 출력 JSON 생성
   - name, id, contact 등의 컬럼이 실제 파일에 없으면 "-" 기입
   - **중요**: 모든 개인정보(이름, ID, 연락처 등)는 원본 데이터에서 한 글자도 변경하지 말고 정확히 그대로 복사하여 사용
   - 절대로 이름이나 데이터를 수정, 변형, 번역, 재구성하지 말것
   - 오로지 아래 **스키마 형태의 JSON 코드만** 출력  

###출력형식
\\\`\\\`\\\`json
{
  "winners": [
    { "name": "<원본데이터의정확한이름>", "id": "<원본데이터의정확한ID>", "contact": "<원본데이터의정확한연락처>" },
    ...
  ],
  "totalParticipants": 0, // 전체 참여자 수
  "requestedCount": 0, // 요청된 선정 인원 수
  "validParticipants": 0, // 조건을 만족하는 중복 제거된 유효 참여자 수
  "finalSelectedCount": 0 // 실제로 선정된 당첨자 수
}
\\\`\\\`\\\`

###데이터무결성규칙
- 참여자 이름: 원본 파일의 name 컬럼 값을 정확히 그대로 사용
- 참여자 ID: 원본 파일의 id 컬럼 값을 정확히 그대로 사용  
- 연락처: 원본 파일의 contact 컬럼 값을 정확히 그대로 사용
- 예시: 파일에 "김도훈"이라고 되어 있으면 반드시 "김도훈"으로, "이도현"이라고 되어 있으면 반드시 "이도현"으로 출력

###선정조건
{condition}
###선정인원
{count}명
###참여자목록
{participantData}`
}

export async function POST() {
  try {
    // 기본 프롬프트로 복원
    await fs.writeFile(PROMPTS_FILE, JSON.stringify(DEFAULT_PROMPTS, null, 2), 'utf8')
    
    return NextResponse.json(DEFAULT_PROMPTS)
  } catch (error) {
    console.error('기본 프롬프트 복원 실패:', error)
    return NextResponse.json(
      { error: '기본 프롬프트 복원 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 
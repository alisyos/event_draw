# 이벤트 당첨자 선정 시스템

OpenAI API를 활용한 공정한 이벤트 당첨자 무작위 선정 시스템입니다.

## 기능

- 사용자 정의 선정 조건을 통한 필터링
- 중복 데이터 자동 제거
- GPT-4 모델을 활용한 지능형 선정
- XLSX, CSV 파일 업로드 지원
- 무작위 추첨 알고리즘

## 설치 및 실행

1. 의존성 설치
```bash
npm install
```

2. 환경변수 설정
`.env.local` 파일을 생성하고 OpenAI API 키를 설정합니다:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

3. 개발 서버 실행
```bash
npm run dev
```

4. 프로덕션 빌드
```bash
npm run build
npm start
```

## 사용법

1. **선정 조건 입력**: 당첨자 선정 조건을 자연어로 입력합니다.
   - 예: "댓글 길이가 30자 이상이고 좋아요를 누른 사람"

2. **선정 인원 수 입력**: 선정할 당첨자 수를 입력합니다.

3. **참여자 목록 업로드**: XLSX 또는 CSV 파일을 업로드합니다.
   - 파일에는 참여자 정보가 포함되어야 합니다.
   - 일반적인 컬럼: name, id, contact 등

4. **당첨자 선정**: 버튼을 클릭하여 AI가 조건에 맞는 당첨자를 선정합니다.

## 배포

이 프로젝트는 Vercel에서 배포하도록 최적화되어 있습니다.

### Vercel 배포 방법

1. Vercel 계정에 로그인
2. GitHub 레포지토리를 Vercel에 연결
3. 환경변수 `OPENAI_API_KEY` 설정
4. 자동 배포 완료

## 기술 스택

- **Frontend**: Next.js 14, React, TypeScript
- **Backend**: Next.js API Routes
- **AI**: OpenAI GPT-4 API
- **File Processing**: xlsx, papaparse
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## API 명세

### POST /api/draw

이벤트 당첨자를 선정합니다.

**Request (FormData)**
- `condition`: 선정 조건 (string)
- `count`: 선정 인원 수 (number)
- `file`: 참여자 목록 파일 (xlsx/csv)

**Response**
```json
{
  "winners": [
    {
      "name": "당첨자 이름",
      "id": "서비스 ID",
      "contact": "연락처"
    }
  ],
  "dedupDataCount": 100
}
```

## 라이선스

MIT License 
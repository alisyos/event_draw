'use client'

import { useState, useEffect } from 'react'

interface PromptData {
  systemPrompt: string
  userPromptTemplate: string
}

export default function AdminPage() {
  const [prompts, setPrompts] = useState<PromptData>({
    systemPrompt: '',
    userPromptTemplate: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  // 현재 프롬프트 불러오기
  useEffect(() => {
    fetchPrompts()
  }, [])

  const fetchPrompts = async () => {
    try {
      const response = await fetch('/api/prompt')
      if (response.ok) {
        const data = await response.json()
        setPrompts(data)
      }
    } catch (error) {
      console.error('프롬프트 불러오기 실패:', error)
    }
  }

  const savePrompts = async () => {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(prompts),
      })

      if (response.ok) {
        setMessage('프롬프트가 성공적으로 저장되었습니다.')
        setMessageType('success')
      } else {
        throw new Error('저장 실패')
      }
    } catch (error) {
      setMessage('프롬프트 저장 중 오류가 발생했습니다.')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const resetToDefault = async () => {
    if (confirm('기본 프롬프트로 복원하시겠습니까?')) {
      setLoading(true)
      try {
        const response = await fetch('/api/prompt/reset', {
          method: 'POST',
        })

        if (response.ok) {
          const data = await response.json()
          setPrompts(data)
          setMessage('기본 프롬프트로 복원되었습니다.')
          setMessageType('success')
        } else {
          throw new Error('복원 실패')
        }
      } catch (error) {
        setMessage('프롬프트 복원 중 오류가 발생했습니다.')
        setMessageType('error')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>🛠️ 시스템 프롬프트 관리</h1>
        <a href="/" className="back-link">← 메인으로 돌아가기</a>
      </div>

      {message && (
        <div className={`admin-message ${messageType}`}>
          {message}
        </div>
      )}

      <div className="admin-section">
        <h2>시스템 프롬프트</h2>
        <p className="admin-description">
          OpenAI API 호출 시 사용되는 시스템 메시지입니다. AI의 역할과 동작 방식을 정의합니다.
        </p>
        <textarea
          className="admin-textarea"
          value={prompts.systemPrompt}
          onChange={(e) => setPrompts({...prompts, systemPrompt: e.target.value})}
          placeholder="시스템 프롬프트를 입력하세요..."
          rows={8}
        />
      </div>

      <div className="admin-section">
        <h2>사용자 프롬프트 템플릿</h2>
        <p className="admin-description">
          사용자 입력을 기반으로 생성되는 프롬프트 템플릿입니다. 
          {'{'}condition{'}'}, {'{'}count{'}'}, {'{'}participantData{'}'} 변수를 사용할 수 있습니다.
        </p>
        <textarea
          className="admin-textarea large"
          value={prompts.userPromptTemplate}
          onChange={(e) => setPrompts({...prompts, userPromptTemplate: e.target.value})}
          placeholder="사용자 프롬프트 템플릿을 입력하세요..."
          rows={20}
        />
      </div>

      <div className="admin-actions">
        <button 
          onClick={savePrompts} 
          disabled={loading}
          className="admin-button primary"
        >
          {loading ? '저장 중...' : '💾 저장하기'}
        </button>
        
        <button 
          onClick={resetToDefault} 
          disabled={loading}
          className="admin-button secondary"
        >
          🔄 기본값 복원
        </button>
      </div>

      <div className="admin-info">
        <h3>💡 사용 팁</h3>
        <ul>
          <li><strong>시스템 프롬프트</strong>: AI의 역할, 성격, 응답 방식을 정의합니다.</li>
          <li><strong>사용자 프롬프트</strong>: 실제 작업 지시사항과 데이터를 포함합니다.</li>
          <li><strong>변수 사용</strong>: {'{'}condition{'}'}, {'{'}count{'}'}, {'{'}participantData{'}'}를 템플릿에서 활용하세요.</li>
          <li><strong>데이터 무결성</strong>: 참여자 데이터 변형 방지를 위한 지시사항을 포함하세요.</li>
        </ul>
      </div>
    </div>
  )
} 
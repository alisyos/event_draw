'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'

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

export default function Home() {
  const [condition, setCondition] = useState('')
  const [count, setCount] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<DrawResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!condition.trim()) {
      setError('선정 조건을 입력해주세요.')
      return
    }
    
    if (!count || parseInt(count) <= 0) {
      setError('올바른 선정 인원 수를 입력해주세요.')
      return
    }
    
    if (!file) {
      setError('참여자 목록 파일을 업로드해주세요.')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('condition', condition)
      formData.append('count', count)
      formData.append('file', file)

      const response = await fetch('/api/draw', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '처리 중 오류가 발생했습니다.')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase()
      if (fileExtension === 'xlsx' || fileExtension === 'csv') {
        setFile(selectedFile)
      } else {
        setError('xlsx 또는 csv 파일만 업로드 가능합니다.')
        e.target.value = ''
      }
    }
  }

  const downloadExcel = () => {
    if (!result) return

    // 통계 정보 시트 데이터
    const statsData = [
      ['항목', '값'],
      ['전체 참여자', `${result.totalParticipants}명`],
      ['선정 요청', `${result.requestedCount}명`],
      ['유효 참여자', `${result.validParticipants}명`],
      ['최종 선정', `${result.finalSelectedCount}명`],
      [''], // 빈 행
      ['당첨자 목록', ''],
      ['순위', '이름', 'ID', '연락처']
    ]

    // 당첨자 데이터 추가
    result.winners.forEach((winner, index) => {
      statsData.push([
        `${index + 1}`,
        winner.name,
        winner.id,
        winner.contact
      ])
    })

    // 워크북 생성
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(statsData)

    // 열 너비 설정
    ws['!cols'] = [
      { width: 10 }, // 순위/항목
      { width: 20 }, // 이름/값
      { width: 20 }, // ID
      { width: 25 }  // 연락처
    ]

    // 스타일링을 위한 범위 설정
    ws['!ref'] = XLSX.utils.encode_range({
      s: { c: 0, r: 0 },
      e: { c: 3, r: statsData.length - 1 }
    })

    // 시트를 워크북에 추가
    XLSX.utils.book_append_sheet(wb, ws, '당첨자 결과')

    // 파일명 생성 (현재 날짜 포함)
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '')
    const filename = `이벤트_당첨자_${dateStr}_${timeStr}.xlsx`

    // 파일 다운로드
    XLSX.writeFile(wb, filename)
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
          이벤트 당첨자 선정 시스템
        </h1>
        <a 
          href="/admin" 
          className="admin-link"
          title="시스템 프롬프트 관리"
        >
          ⚙️ 관리자
        </a>
      </div>

      <div className="main-layout">
        {/* 좌측 입력 영역 (40%) */}
        <div className="input-section">
          <form onSubmit={handleSubmit} className="form-section">
            <div className="input-group">
              <label className="label">
                선정 조건 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                className="textarea"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                placeholder="당첨자 선정 조건을 입력해 주세요. ex) 댓글 길이가 30자 이상이고 좋아요를 누른 사람"
                required
              />
            </div>

            <div className="input-group">
              <label className="label">
                선정 인원 수 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="number"
                className="input"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                placeholder="선정할 인원 수를 입력해주세요"
                min="1"
                required
              />
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                {count && `${count}명 선정`}
              </div>
            </div>

            <div className="input-group">
              <label className="label">
                참여자 목록 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="file"
                className="file-input"
                onChange={handleFileChange}
                accept=".xlsx,.csv"
                required
              />
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                xlsx 또는 csv 파일을 업로드해주세요.
                {file && ` (선택된 파일: ${file.name})`}
              </div>
            </div>

            {error && <div className="error">{error}</div>}

            <button type="submit" className="button" disabled={loading}>
              {loading ? (
                <div className="loading">
                  <div className="spinner"></div>
                  처리 중...
                </div>
              ) : (
                '당첨자 선정하기'
              )}
            </button>
          </form>
        </div>

        {/* 우측 결과 영역 (60%) */}
        <div className="result-section">
          {result ? (
            <div className="results-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                  🎉 당첨자 결과
                </h2>
                <button 
                  onClick={downloadExcel}
                  className="download-button"
                  title="엑셀 파일로 다운로드"
                >
                  <span className="download-icon">📊</span>
                  엑셀 다운로드
                </button>
              </div>
              
              <div className="stats-container">
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-content">
                    <div className="stat-label">전체 참여</div>
                    <div className="stat-value">{result.totalParticipants}명</div>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">🎯</div>
                  <div className="stat-content">
                    <div className="stat-label">선정 요청</div>
                    <div className="stat-value">{result.requestedCount}명</div>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">✅</div>
                  <div className="stat-content">
                    <div className="stat-label">유효참여</div>
                    <div className="stat-value">{result.validParticipants}명</div>
                  </div>
                </div>
                
                <div className="stat-card highlight">
                  <div className="stat-icon">🏆</div>
                  <div className="stat-content">
                    <div className="stat-label">최종 선정</div>
                    <div className="stat-value">{result.finalSelectedCount}명</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {result.winners.map((winner, index) => (
                  <div key={index} className="winner-card">
                    <div className="winner-info">
                      <div>
                        <div className="winner-name">{index + 1}. {winner.name}</div>
                        <div className="winner-detail">
                          ID: {winner.id} | 연락처: {winner.contact}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="results-placeholder">
              <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '1.125rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
                <p>당첨자 선정 결과가 여기에 표시됩니다.</p>
                <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  좌측에서 조건을 입력하고 당첨자를 선정해주세요.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
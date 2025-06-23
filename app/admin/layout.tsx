import '../admin.css'

export const metadata = {
  title: '관리자 - 이벤트 당첨자 선정 시스템',
  description: '시스템 프롬프트 관리 페이지',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
} 
export const dynamic = 'force-dynamic'
import AdminPage from '../page'

export const metadata = {
  title: 'Admin Toestellen',
}

export default function ToestellenPage() {
  return AdminPage({ searchParams: { tab: 'toestellen' } })
}

export const dynamic = 'force-dynamic'
import AdminPage from '../page'

export const metadata = {
  title: 'Admin Reparaties',
}

export default function ReparatiesPage() {
  return AdminPage({ searchParams: { tab: 'reparaties' } })
}

export const dynamic = 'force-dynamic'
import AdminPage from '../page'

export const metadata = {
  title: 'Admin Merken',
}

export default function MerkenPage() {
  return AdminPage({ searchParams: { tab: 'merken' } })
}

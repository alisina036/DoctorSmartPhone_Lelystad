export const dynamic = "force-dynamic"

import { unstable_noStore as noStore } from "next/cache"
import HeroCarouselAdminPage from "@/components/admin/hero-carousel-admin-page"

export const metadata = {
  title: "Admin Carousel",
}

export default async function Page() {
  noStore()
  return <HeroCarouselAdminPage />
}

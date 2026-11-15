import { Header } from '@/components/header'
import { IncidentDashboard } from '@/components/incident-dashboard'
import { NotificationBanner } from '@/components/notification-banner'

export default function HomePage() {
   return (
      <>
         <Header />
         <NotificationBanner />
         <main className="flex-1 px-6 py-6">
            <IncidentDashboard />
         </main>
      </>
   )
}

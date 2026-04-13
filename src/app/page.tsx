import { Header } from "@/components/header";
import { NotificationBanner } from "@/components/notification-banner";
import { IncidentDashboard } from "@/components/incident-dashboard";

export default function HomePage() {
  return (
    <>
      <Header />
      <NotificationBanner />
      <main className="container mx-auto flex-1 px-4 py-6">
        <IncidentDashboard />
      </main>
    </>
  );
}

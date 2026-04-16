import { Header } from "@/components/header";
import { NotificationBanner } from "@/components/notification-banner";
import { IncidentDashboard } from "@/components/incident-dashboard";

export default function HomePage() {
  return (
    <>
      <Header />
      <NotificationBanner />
      <main className="mx-auto flex-1 px-6 py-6 max-w-[1600px]">
        <IncidentDashboard />
      </main>
    </>
  );
}

import { DashboardSideNav } from "@/components/dashboard-side-nav";
import { DashboardTopBar } from "@/components/dashboard-top-bar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1">
      {/* Sidebar */}
      <DashboardSideNav />

      {/* Main area */}
      <div className="flex flex-1 flex-col border-l border-[var(--stitch-outline-variant)]/20">
        <DashboardTopBar />
        <main className="flex-1 bg-[var(--stitch-surface-container)] p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

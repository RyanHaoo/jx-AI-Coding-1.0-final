import { DashboardSideNav } from "@/components/dashboard-side-nav";
import { DashboardTopBar } from "@/components/dashboard-top-bar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <DashboardTopBar />
      <div className="flex flex-1">
        <DashboardSideNav />
        <main className="flex-1 bg-zinc-50 p-6">{children}</main>
      </div>
    </div>
  );
}

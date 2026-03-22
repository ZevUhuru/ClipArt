import { AppSidebar } from "@/components/AppSidebar";
import { AppBottomNav } from "@/components/AppBottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppSidebar />
      <main className="min-h-screen pb-20 md:ml-60 md:pb-0">{children}</main>
      <AppBottomNav />
    </div>
  );
}

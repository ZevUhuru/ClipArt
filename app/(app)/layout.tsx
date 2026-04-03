import { AppSidebar } from "@/components/AppSidebar";
import { AppBottomNav } from "@/components/AppBottomNav";
import { AppMain } from "@/components/AppMain";
import { ImageDetailDrawer } from "@/components/ImageDetailDrawer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <AppSidebar />
      <AppMain>{children}</AppMain>
      <AppBottomNav />
      <ImageDetailDrawer />
    </div>
  );
}

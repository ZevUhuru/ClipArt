import { LearnNav } from "@/components/learn/LearnNav";
import { MarketingFooter } from "@/components/MarketingFooter";

export default async function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <LearnNav />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}

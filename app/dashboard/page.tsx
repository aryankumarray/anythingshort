import { auth } from "@/lib/auth";
import { getUserStats, listLinks } from "@/lib/services/links";
import { HeroShortener } from "@/components/dashboard/hero-shortener";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { LinksTable } from "@/components/dashboard/links-table";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [stats, { links }] = await Promise.all([
    getUserStats(userId),
    listLinks(userId),
  ]);

  const serializedLinks = links.map((link) => ({
    id: link.id,
    slug: link.slug,
    longUrl: link.longUrl,
    clickCount: link.clickCount,
    isActive: link.isActive,
    createdAt: link.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-8">
      <HeroShortener />
      <KpiStrip stats={stats} />
      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">Your Links</h2>
        <LinksTable links={serializedLinks} />
      </div>
    </div>
  );
}
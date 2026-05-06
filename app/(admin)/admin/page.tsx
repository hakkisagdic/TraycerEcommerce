import { prisma } from "../../../lib/prisma";
import StatCard from "../../../components/admin/StatCard";

export default async function AdminDashboardPage() {
  const [postsCount, commentsCount, mediaCount] = await Promise.all([
    prisma.post.count(),
    prisma.comment.count(),
    prisma.media.count(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Toplam Yazı" value={postsCount} />
        <StatCard title="Toplam Yorum" value={commentsCount} />
        <StatCard title="Toplam Medya" value={mediaCount} />
      </div>
    </div>
  );
}

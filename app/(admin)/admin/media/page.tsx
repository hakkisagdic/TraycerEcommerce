import { prisma } from "../../../../lib/prisma";
import MediaGrid from "../../../../components/admin/MediaGrid";

export default async function AdminMediaPage() {
  const items = await prisma.media.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Medya</h1>
      <MediaGrid items={items} />
    </div>
  );
}

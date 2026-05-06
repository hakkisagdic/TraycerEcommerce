import AdminSidebar from "../../components/admin/AdminSidebar";
import ToasterWrapper from "../../components/admin/ToasterWrapper";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-muted/40">
      <AdminSidebar />
      <main className="flex-1 p-6">{children}</main>
      <ToasterWrapper />
    </div>
  );
}

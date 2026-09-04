import { requireAdmin } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import AdminTabs from "@/components/AdminTabs";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="mb-6">
          <p className="section-label mb-2">Yönetim</p>
          <h1 className="page-title">Ekip ve roller</h1>
          <p className="page-subtitle">
            Kullanıcı ekleyin, onlara rol atayın veya ekibinize özel yeni roller oluşturun.
          </p>
        </div>
        <AdminTabs canManageUsers={user.appRole.canManageUsers} canManageRoles={user.appRole.canManageRoles} />
        {children}
      </div>
    </div>
  );
}

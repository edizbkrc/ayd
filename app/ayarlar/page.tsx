import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Avatar from "@/components/Avatar";
import { saveNotificationSettings } from "./actions";

const NOTIF_SETTINGS = [
  { key: "emailOnAssigned", label: "İş atandığında",             desc: "Yönetici size bir iş atadığında e-posta alın.", onlyMember: true },
  { key: "emailOnApproved", label: "İşiniz onaylandığında",      desc: "Gönderdiğiniz iş yönetici tarafından onaylandığında.", onlyMember: true },
  { key: "emailOnRejected", label: "İşiniz geri gönderildiğinde",desc: "Yönetici işi düzeltme için geri gönderdiğinde.", onlyMember: true },
  { key: "emailOnReopened", label: "İş yeniden açıldığında",     desc: "Tamamlanan iş yönetici tarafından tekrar açıldığında.", onlyMember: true },
  { key: "emailOnReview",   label: "Onay talebi geldiğinde",     desc: "Bir üye işi incelemenize gönderdiğinde.", onlyManager: true },
  { key: "emailOnComment",  label: "Yeni yorum yapıldığında",    desc: "Takip ettiğiniz işe yorum geldiğinde." },
];

export default async function AyarlarPage() {
  const user = await requireUser();
  const isManager = user.appRole.canManageUsers || user.appRole.canManageRoles;

  const settings = await prisma.userSettings.findUnique({ where: { userId: user.id } }) ?? {
    emailOnAssigned: true,
    emailOnApproved: true,
    emailOnRejected: true,
    emailOnReopened: true,
    emailOnReview: true,
    emailOnComment: false,
  };

  const visibleSettings = NOTIF_SETTINGS.filter((s) => {
    if (s.onlyMember && isManager) return false;
    if (s.onlyManager && !isManager) return false;
    return true;
  });

  return (
    <div className="min-h-screen page-bg">
      <Navbar user={user} />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Profil */}
        <div className="card-surface p-5 flex items-center gap-4">
          <Avatar name={user.name} size="lg" />
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">{user.name}</p>
            <p className="text-sm text-muted">{user.email}</p>
            <span className="mt-1 inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300">
              {user.appRole.name}
            </span>
          </div>
        </div>

        {/* E-posta bildirimleri */}
        <div className="card-surface overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-white">E-posta Bildirimleri</h2>
            <p className="text-xs text-muted mt-0.5">Hangi olaylarda e-posta almak istediğinizi seçin.</p>
          </div>
          <form action={saveNotificationSettings}>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {visibleSettings.map((s) => (
                <label key={s.key} className="flex items-start justify-between gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{s.label}</p>
                    <p className="text-xs text-muted mt-0.5">{s.desc}</p>
                  </div>
                  <div className="shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      name={s.key}
                      defaultChecked={settings[s.key as keyof typeof settings] as boolean}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                  </div>
                </label>
              ))}
            </div>
            <div className="px-5 py-4 bg-slate-50/60 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800">
              <button type="submit" className="btn">Kaydet</button>
            </div>
          </form>
        </div>

      </main>
    </div>
  );
}

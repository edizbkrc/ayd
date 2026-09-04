import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { loginAction } from "@/app/actions/auth";
import Image from "next/image";
import { AlertIcon, MailIcon, LockIcon } from "@/components/icons";
import ThemeToggle from "@/components/ThemeToggle";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const user = await getCurrentUser();
  if (user) redirect("/isler");

  return (
    <div className="min-h-screen flex">
      {/* Sol panel — marka */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative flex-col items-center justify-center bg-brand-800 overflow-hidden">
        {/* Arka plan desen */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 30%, #4f6fb0 0%, transparent 50%),
                              radial-gradient(circle at 80% 70%, #2d5096 0%, transparent 50%)`,
          }}
        />
        <div className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(255,255,255,0.015) 40px, rgba(255,255,255,0.015) 80px)`,
          }}
        />

        <div className="relative z-10 flex flex-col items-center text-center px-12">
          <Image
            src="/logo.png"
            alt="Aydın Yatırım Grup"
            width={260}
            height={104}
            className="h-20 w-auto object-contain mb-10"
            priority
          />
          <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">
            İş Yönetim Platformu
          </h2>
          <p className="text-brand-200 text-sm leading-relaxed max-w-xs">
            Projelerinizi, görevlerinizi ve ekip üyelerinizi tek bir yerden yönetin.
          </p>

          <div className="mt-12 grid grid-cols-3 gap-6 w-full max-w-xs">
            {[
              { label: "Proje", sub: "Takibi" },
              { label: "Ekip", sub: "Yönetimi" },
              { label: "Anlık", sub: "Bildirim" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-white/5 ring-1 ring-white/10">
                <p className="text-white font-bold text-sm">{item.label}</p>
                <p className="text-brand-300 text-xs">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Alt köşe */}
        <p className="absolute bottom-6 text-brand-400 text-xs">
          © {new Date().getFullYear()} Aydın Yatırım Grup
        </p>
      </div>

      {/* Sağ panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative bg-white dark:bg-brand-950">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        {/* Mobil logo */}
        <div className="lg:hidden mb-8 flex justify-center">
          <div className="bg-brand-800 rounded-2xl px-6 py-3">
            <Image
              src="/logo.png"
              alt="Aydın Yatırım Grup"
              width={180}
              height={72}
              className="h-12 w-auto object-contain"
              priority
            />
          </div>
        </div>

        <div className="w-full max-w-[380px] animate-fade-in">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Giriş yap</h1>
            <p className="text-sm text-muted mt-1.5">
              Hesabınızla devam edin
            </p>
          </div>

          {searchParams.error && (
            <div className="error-box mb-6">
              <AlertIcon className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{searchParams.error}</span>
            </div>
          )}

          <form action={loginAction} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">E-posta</label>
              <div className="relative">
                <MailIcon className="h-4 w-4 text-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  className="input pl-10"
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="ornek@sirket.com"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="password">Şifre</label>
              <div className="relative">
                <LockIcon className="h-4 w-4 text-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  className="input pl-10"
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn w-full py-3 mt-2 text-base">
              Giriş yap
            </button>
          </form>

          <p className="text-xs text-muted mt-8 text-center leading-relaxed">
            Hesabınız yoksa yöneticinizden sizin için bir hesap açmasını isteyin.
          </p>
        </div>
      </div>
    </div>
  );
}

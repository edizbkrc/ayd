import Link from "next/link";
import Image from "next/image";
import { logoutAction } from "@/app/actions/auth";
import type { AuthUser } from "@/lib/auth";
import ThemeToggle from "./ThemeToggle";
import Avatar from "./Avatar";
import NavLinks from "./NavLinks";
import ConfirmSubmitButton from "./ConfirmSubmitButton";
import NotificationCenter from "./NotificationCenter";
import ThemeSwitcher from "./ThemeSwitcher";
import { LogOutIcon, SettingsIcon } from "./icons";

export default function Navbar({ user }: { user: AuthUser }) {
  return (
    <header className="sticky top-0 z-20 glass-nav">
      {/* Tam genişlik, logo sol kenarda border ile ayrılmış */}
      <div className="relative flex items-center h-16">

        {/* Logo — sol kenara yapışık */}
        <Link
          href="/isler"
          className="flex items-center shrink-0 pl-5 pr-6 h-full border-r border-white/10"
        >
          <Image
            src="/logo.png"
            alt="Aydın Yatırım Grup"
            width={148}
            height={44}
            className="h-8 w-auto object-contain"
            priority
          />
        </Link>

        {/* Nav linkleri — tam ortada (absolute) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto">
            <NavLinks user={user} />
          </div>
        </div>

        {/* Sağ araçlar */}
        <div className="ml-auto flex items-center gap-1 pr-4">
          <NotificationCenter userId={user.id} />
          <Link
            href="/ayarlar"
            title="Ayarlar"
            className="flex items-center justify-center h-8 w-8 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <SettingsIcon className="h-4 w-4" />
          </Link>
          <ThemeSwitcher />
          <ThemeToggle />

          <div className="hidden sm:flex items-center gap-2 rounded-full bg-white/10 ring-1 ring-white/20 pl-1 pr-3 py-1 ml-1">
            <Avatar name={user.name} size="sm" />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-white">{user.name}</p>
              <p className="text-[11px] text-brand-200">{user.appRole.name}</p>
            </div>
          </div>

          <div className="sm:hidden ml-1">
            <Avatar name={user.name} size="sm" />
          </div>

          <form action={logoutAction}>
            <ConfirmSubmitButton
              confirmTitle="Emin misiniz?"
              confirmMessage="Hesabınızdan çıkış yapılacak. Tekrar girmek için e-posta ve şifreniz gerekir."
              confirmLabel="Çıkış yap"
              cancelLabel="Vazgeç"
              tone="brand"
              title="Çıkış yap"
              className="icon-btn !text-white/50 hover:!text-red-400 hover:!bg-white/10"
            >
              <LogOutIcon />
            </ConfirmSubmitButton>
          </form>
        </div>

      </div>
    </header>
  );
}

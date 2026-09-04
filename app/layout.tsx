import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "İşler | Görev takip",
  description: "Görevlerinizi tek yerde görün, geciken işleri kaçırmayın",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning className={jakarta.variable}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
  /* Koyu/açık mod */
  var t=localStorage.getItem('theme');
  var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;
  if(d)document.documentElement.classList.add('dark');
  /* Renk teması */
  var THEMES={
    navy:{"--brand-50":"#f2f5fb","--brand-100":"#dde5f4","--brand-200":"#bccae8","--brand-300":"#90a8d4","--brand-400":"#6685bc","--brand-500":"#4466a3","--brand-600":"#2f508a","--brand-700":"#1e3870","--brand-800":"#142554","--brand-900":"#0e193c","--brand-950":"#090f24","--nav-bg":"rgba(22,37,84,0.94)","--nav-border":"rgba(46,80,138,0.35)","--page-bg":"#f5f7fc","--page-grad1":"rgba(70,102,163,0.06)","--page-grad2":"rgba(30,56,112,0.03)","--page-bg-dark":"#111827","--page-grad1-dark":"rgba(30,56,112,0.25)","--page-grad2-dark":"rgba(70,102,163,0.12)","--card-bg":"rgba(255,255,255,0.92)","--card-ring":"rgba(210,218,232,0.8)","--card-bg-dark":"rgba(24,32,52,0.82)","--card-ring-dark":"rgba(46,64,100,0.5)","--btn-shadow":"rgba(30,56,112,0.28)"},
    slate:{"--brand-50":"#f9fafb","--brand-100":"#f3f4f6","--brand-200":"#e5e7eb","--brand-300":"#9ca3af","--brand-400":"#6b7280","--brand-500":"#4b5563","--brand-600":"#374151","--brand-700":"#1f2937","--brand-800":"#111827","--brand-900":"#0a0f1a","--brand-950":"#060a12","--nav-bg":"rgba(31,41,55,0.95)","--nav-border":"rgba(55,65,81,0.5)","--page-bg":"#f4f5f7","--page-grad1":"rgba(75,85,99,0.05)","--page-grad2":"rgba(31,41,55,0.03)","--page-bg-dark":"#0f1117","--page-grad1-dark":"rgba(31,41,55,0.5)","--page-grad2-dark":"rgba(55,65,81,0.2)","--card-bg":"rgba(255,255,255,0.92)","--card-ring":"rgba(209,213,219,0.8)","--card-bg-dark":"rgba(17,24,39,0.85)","--card-ring-dark":"rgba(55,65,81,0.55)","--btn-shadow":"rgba(31,41,55,0.32)"},
    teal:{"--brand-50":"#f0fdfa","--brand-100":"#ccfbf1","--brand-200":"#99f6e4","--brand-300":"#5eead4","--brand-400":"#2dd4bf","--brand-500":"#14b8a6","--brand-600":"#0d9488","--brand-700":"#0f766e","--brand-800":"#115e59","--brand-900":"#134e4a","--brand-950":"#0a2e2b","--nav-bg":"rgba(15,118,110,0.94)","--nav-border":"rgba(13,148,136,0.3)","--page-bg":"#f4fbfa","--page-grad1":"rgba(20,184,166,0.06)","--page-grad2":"rgba(15,118,110,0.03)","--page-bg-dark":"#0e1a19","--page-grad1-dark":"rgba(15,118,110,0.28)","--page-grad2-dark":"rgba(20,184,166,0.12)","--card-bg":"rgba(255,255,255,0.92)","--card-ring":"rgba(153,246,228,0.5)","--card-bg-dark":"rgba(14,26,25,0.85)","--card-ring-dark":"rgba(13,148,136,0.3)","--btn-shadow":"rgba(15,118,110,0.3)"},
    rose:{"--brand-50":"#fff5f7","--brand-100":"#fde8ec","--brand-200":"#fbc5cf","--brand-300":"#f79aaa","--brand-400":"#f06d83","--brand-500":"#e5485f","--brand-600":"#cc3049","--brand-700":"#a8203a","--brand-800":"#871530","--brand-900":"#6b0f27","--brand-950":"#3d0716","--nav-bg":"rgba(134,21,48,0.93)","--nav-border":"rgba(204,48,73,0.32)","--page-bg":"#fdf5f7","--page-grad1":"rgba(229,72,95,0.05)","--page-grad2":"rgba(134,21,48,0.03)","--page-bg-dark":"#180b0f","--page-grad1-dark":"rgba(134,21,48,0.32)","--page-grad2-dark":"rgba(204,48,73,0.14)","--card-bg":"rgba(255,255,255,0.92)","--card-ring":"rgba(251,197,207,0.6)","--card-bg-dark":"rgba(24,11,15,0.85)","--card-ring-dark":"rgba(168,32,58,0.3)","--btn-shadow":"rgba(134,21,48,0.28)"},
    violet:{"--brand-50":"#f8f5ff","--brand-100":"#ede9fe","--brand-200":"#ddd6fe","--brand-300":"#c4b5fd","--brand-400":"#a78bfa","--brand-500":"#8b5cf6","--brand-600":"#7c3aed","--brand-700":"#6d28d9","--brand-800":"#5b21b6","--brand-900":"#4c1d95","--brand-950":"#2e1065","--nav-bg":"rgba(91,33,182,0.93)","--nav-border":"rgba(124,58,237,0.32)","--page-bg":"#f8f6ff","--page-grad1":"rgba(139,92,246,0.06)","--page-grad2":"rgba(91,33,182,0.03)","--page-bg-dark":"#120d1f","--page-grad1-dark":"rgba(91,33,182,0.3)","--page-grad2-dark":"rgba(139,92,246,0.13)","--card-bg":"rgba(255,255,255,0.92)","--card-ring":"rgba(221,214,254,0.65)","--card-bg-dark":"rgba(18,13,31,0.85)","--card-ring-dark":"rgba(109,40,217,0.28)","--btn-shadow":"rgba(91,33,182,0.3)"},
    amber:{"--brand-50":"#fefce8","--brand-100":"#fef9c3","--brand-200":"#fef08a","--brand-300":"#fde047","--brand-400":"#facc15","--brand-500":"#eab308","--brand-600":"#ca8a04","--brand-700":"#a16207","--brand-800":"#92400e","--brand-900":"#78350f","--brand-950":"#431407","--nav-bg":"rgba(120,53,15,0.94)","--nav-border":"rgba(161,98,7,0.35)","--page-bg":"#fefdf5","--page-grad1":"rgba(234,179,8,0.06)","--page-grad2":"rgba(120,53,15,0.03)","--page-bg-dark":"#161005","--page-grad1-dark":"rgba(120,53,15,0.3)","--page-grad2-dark":"rgba(202,138,4,0.12)","--card-bg":"rgba(255,255,255,0.92)","--card-ring":"rgba(254,240,138,0.6)","--card-bg-dark":"rgba(22,16,5,0.85)","--card-ring-dark":"rgba(161,98,7,0.3)","--btn-shadow":"rgba(120,53,15,0.28)"}
  };
  var ct=localStorage.getItem('color-theme')||'navy';
  var cv=THEMES[ct]||THEMES.navy;
  var r=document.documentElement;
  Object.entries(cv).forEach(function(e){r.style.setProperty(e[0],e[1]);});
  r.setAttribute('data-theme',ct);
}catch(e){}})();`,
          }}
        />
      </head>
      <body className="font-sans min-h-screen">{children}</body>
    </html>
  );
}

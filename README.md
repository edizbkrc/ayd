# Panom — Basit Trello Benzeri İş Takip Uygulaması

Next.js (App Router) + Prisma + SQLite ile yazılmış, sade bir pano / görev takip uygulaması.

## Özellikler

- Kayıt olma / giriş yapma (oturumlar imzalı çerezle tutulur, ek kütüphane gerektirmez)
- Site geneli roller: **Yönetici (ADMIN)** ve **Üye (MEMBER)**
  - Sisteme ilk kayıt olan kullanıcı otomatik olarak Yönetici olur
  - Yöneticiler `/admin/users` sayfasından kullanıcı ekleyip rollerini yönetebilir
- Panolar (Board) → Listeler (List, ör. "Yapılacak / Devam Ediyor / Tamamlandı" — pipeline aşamaları) → Kartlar (Card, ör. görevler)
- Kart detayında: açıklama, atanan kişi, bitiş tarihi, silme
- Kartları listeler arasında taşıma (basit "Taşı" seçimi ile, sürükle-bırak yerine)
- Pano bazlı roller: Sahip (Owner) / Yönetici (Admin) / Üye (Member), pano üyesi ekleme/çıkarma

Kasıtlı olarak sade tutuldu: sürükle-bırak kütüphanesi, gerçek zamanlı senkronizasyon gibi ek karmaşıklıklar eklenmedi. Tüm etkileşimler standart HTML formları + Next.js Server Actions ile çalışır, ekstra client-side JavaScript bağımlılığı yoktur.

## Kurulum

> Not: Bu proje bu ortamda `npm install` çalıştırılamadığı için (ağ erişimi kısıtlı) test edilememiştir — kendi bilgisayarınızda aşağıdaki adımları izleyin.

```bash
cd trelloapp
npm install
cp .env.example .env
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Uygulama `http://localhost:3000` adresinde açılır.

### Örnek giriş bilgileri (seed sonrası)

| Rol | E-posta | Şifre |
|---|---|---|
| Yönetici | admin@example.com | admin123 |
| Üye | uye@example.com | member123 |

## Veritabanı

Varsayılan olarak SQLite kullanılır (`prisma/dev.db` dosyası, `.env` içindeki `DATABASE_URL`). Postgres/MySQL gibi başka bir veritabanına geçmek isterseniz:

1. `prisma/schema.prisma` içindeki `datasource db` bloğunda `provider`'ı değiştirin (`postgresql`, `mysql` vb.)
2. `.env` içindeki `DATABASE_URL`'i yeni veritabanınızın bağlantı adresiyle güncelleyin
3. `npx prisma migrate dev` komutunu tekrar çalıştırın

## Proje Yapısı

```
app/
  login/, register/         -> Kimlik doğrulama sayfaları
  actions/auth.ts           -> Giriş/kayıt/çıkış server action'ları
  boards/                   -> Panolar listesi + pano oluşturma
  boards/[boardId]/         -> Kanban pano görünümü (listeler + kartlar)
  boards/[boardId]/cards/[cardId]/  -> Kart detay/düzenleme sayfası
  boards/[boardId]/members/ -> Pano üyeleri yönetimi
  admin/users/               -> Site geneli kullanıcı yönetimi (sadece Yönetici)
lib/
  prisma.ts   -> Prisma client
  session.ts  -> HMAC imzalı oturum çerezi (JWT kütüphanesi kullanılmaz)
  auth.ts     -> Şifre hash'leme, oturum/rol kontrol yardımcıları
prisma/
  schema.prisma -> Veritabanı şeması
  seed.ts        -> Örnek veri
```

## Üretime alma notları

- `.env` içindeki `SESSION_SECRET` değerini üretimde mutlaka uzun, rastgele bir değerle değiştirin.
- SQLite tek dosyalı ve basittir; çoklu sunucu / yüksek trafik için Postgres gibi bir veritabanına geçmeniz önerilir (yukarıya bakın).
- Vercel gibi platformlarda dağıtım yaparken build adımına `prisma generate` otomatik çalışır (`postinstall` script'i bunu sağlar); veritabanı migration'larını dağıtım öncesi `npx prisma migrate deploy` ile uygulayın.

import nodemailer from "nodemailer";
import { prisma } from "./prisma";

const APP_URL = (process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");

function getGmailAuth() {
  const user = (process.env.GMAIL_USER ?? "").trim();
  const pass = (process.env.GMAIL_APP_PASSWORD ?? "").replace(/\s/g, "");
  if (!user || !pass || pass === "your_app_password") return null;
  return { user, pass };
}

async function getUserSettings(userId: string) {
  try {
    const settings = await prisma.userSettings.findUnique({ where: { userId } });
    if (settings) return settings;
  } catch (e) {
    console.error("[email] userSettings okunamadı", e);
  }
  return {
    emailOnAssigned: true,
    emailOnApproved: true,
    emailOnRejected: true,
    emailOnReopened: true,
    emailOnReview: true,
    emailOnComment: false,
  };
}

async function sendMail(to: string, subject: string, html: string) {
  const auth = getGmailAuth();
  if (!auth) {
    console.error("[email] GMAIL_USER / GMAIL_APP_PASSWORD tanımlı değil — mail gönderilmedi:", { to, subject });
    return;
  }
  if (!to) {
    console.error("[email] alıcı e-posta boş:", subject);
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth,
    });
    const info = await transporter.sendMail({
      from: `Görev Takip <${auth.user}>`,
      to,
      subject,
      html,
    });
    console.log("[email] gönderildi:", { to, subject, id: info.messageId });
  } catch (e) {
    console.error("[email] gönderim hatası", e);
  }
}

function cardLink(boardId: string, cardId: string) {
  return `${APP_URL}/boards/${boardId}/cards/${cardId}`;
}

function template(title: string, body: string, btnText: string, btnUrl: string) {
  return `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f7fc;font-family:system-ui,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
    <div style="background:#1e3870;padding:24px 32px">
      <p style="margin:0;color:#fff;font-size:18px;font-weight:700">Görev Takip</p>
    </div>
    <div style="padding:32px">
      <h2 style="margin:0 0 12px;font-size:20px;color:#0f172a">${title}</h2>
      <div style="color:#475569;font-size:15px;line-height:1.6">${body}</div>
      <a href="${btnUrl}" style="display:inline-block;margin-top:24px;padding:12px 24px;background:#1e3870;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px">${btnText}</a>
      <p style="margin:20px 0 0;font-size:13px;color:#64748b;line-height:1.5;word-break:break-all">
        İlgili işe git: <a href="${btnUrl}" style="color:#1e3870">${btnUrl}</a>
      </p>
    </div>
    <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0">
      <p style="margin:0;color:#94a3b8;font-size:12px">Bu e-posta otomatik olarak gönderilmiştir. Bildirim tercihlerinizi ayarlar sayfasından değiştirebilirsiniz.</p>
    </div>
  </div>
</body>
</html>`;
}

export async function notifyAssigned(opts: {
  toEmail: string; toUserId: string; toName: string;
  cardTitle: string; boardId: string; cardId: string;
  managerName: string;
}) {
  const s = await getUserSettings(opts.toUserId);
  if (!s.emailOnAssigned) return;
  await sendMail(
    opts.toEmail,
    `Size yeni bir iş atandı: ${opts.cardTitle}`,
    template(
      "Yeni bir iş atandı",
      `<p>Merhaba <strong>${opts.toName}</strong>,</p>
       <p><strong>${opts.managerName}</strong> size <a href="${cardLink(opts.boardId, opts.cardId)}" style="color:#1e3870;font-weight:700">"${opts.cardTitle}"</a> adlı işi atadı.</p>`,
      "İşi görüntüle",
      cardLink(opts.boardId, opts.cardId)
    )
  );
}

export async function notifyApproved(opts: {
  toEmail: string; toUserId: string; toName: string;
  cardTitle: string; boardId: string; cardId: string;
  managerName: string;
}) {
  const s = await getUserSettings(opts.toUserId);
  if (!s.emailOnApproved) return;
  await sendMail(
    opts.toEmail,
    `İşiniz onaylandı: ${opts.cardTitle}`,
    template(
      "İşiniz onaylandı",
      `<p>Merhaba <strong>${opts.toName}</strong>,</p>
       <p><a href="${cardLink(opts.boardId, opts.cardId)}" style="color:#1e3870;font-weight:700">"${opts.cardTitle}"</a> adlı işiniz <strong>${opts.managerName}</strong> tarafından onaylandı.</p>`,
      "İşi görüntüle",
      cardLink(opts.boardId, opts.cardId)
    )
  );
}

export async function notifyRejected(opts: {
  toEmail: string; toUserId: string; toName: string;
  cardTitle: string; boardId: string; cardId: string;
  managerName: string; note?: string;
}) {
  const s = await getUserSettings(opts.toUserId);
  if (!s.emailOnRejected) return;
  await sendMail(
    opts.toEmail,
    `İşiniz geri gönderildi: ${opts.cardTitle}`,
    template(
      "İşiniz geri gönderildi",
      `<p>Merhaba <strong>${opts.toName}</strong>,</p>
       <p><a href="${cardLink(opts.boardId, opts.cardId)}" style="color:#1e3870;font-weight:700">"${opts.cardTitle}"</a> adlı işiniz <strong>${opts.managerName}</strong> tarafından geri gönderildi.</p>
       ${opts.note ? `<p style="background:#fef2f2;border-left:3px solid #ef4444;padding:12px 16px;border-radius:8px;margin-top:16px"><strong>Not:</strong> ${opts.note}</p>` : ""}`,
      "İşi görüntüle",
      cardLink(opts.boardId, opts.cardId)
    )
  );
}

export async function notifyReopened(opts: {
  toEmail: string; toUserId: string; toName: string;
  cardTitle: string; boardId: string; cardId: string;
  managerName: string;
}) {
  const s = await getUserSettings(opts.toUserId);
  if (!s.emailOnReopened) return;
  await sendMail(
    opts.toEmail,
    `İş yeniden açıldı: ${opts.cardTitle}`,
    template(
      "Yönetici işi yeniden açtı",
      `<p>Merhaba <strong>${opts.toName}</strong>,</p>
       <p><a href="${cardLink(opts.boardId, opts.cardId)}" style="color:#1e3870;font-weight:700">"${opts.cardTitle}"</a> adlı iş <strong>${opts.managerName}</strong> tarafından yeniden açıldı.</p>`,
      "İşi görüntüle",
      cardLink(opts.boardId, opts.cardId)
    )
  );
}

export async function notifyReview(opts: {
  toEmail: string; toUserId: string; toName: string;
  cardTitle: string; boardId: string; cardId: string;
  memberName: string;
}) {
  const s = await getUserSettings(opts.toUserId);
  if (!s.emailOnReview) return;
  await sendMail(
    opts.toEmail,
    `Onay bekliyor: ${opts.cardTitle}`,
    template(
      "Yeni onay talebi",
      `<p>Merhaba <strong>${opts.toName}</strong>,</p>
       <p><strong>${opts.memberName}</strong>, <a href="${cardLink(opts.boardId, opts.cardId)}" style="color:#1e3870;font-weight:700">"${opts.cardTitle}"</a> adlı işi incelemenize gönderdi.</p>`,
      "İşi incele",
      cardLink(opts.boardId, opts.cardId)
    )
  );
}

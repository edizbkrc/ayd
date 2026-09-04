import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToR2 } from "@/lib/r2";

export const dynamic = "force-dynamic";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const cardId = String(formData.get("cardId") || "");
  const files = formData.getAll("files") as File[];

  if (!cardId || files.length === 0) {
    return NextResponse.json({ error: "Eksik veri" }, { status: 400 });
  }

  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: { list: { select: { board: { select: { id: true } } } } },
  });
  if (!card) return NextResponse.json({ error: "Kart bulunamadı" }, { status: 404 });

  // DONE kartına yönetici dışında kimse dosya yükleyemez
  if (card.status === "DONE") {
    const { getBoardRole } = await import("@/lib/auth");
    const boardRole = await getBoardRole(user.id, card.list.board.id);
    const isManager = boardRole === "OWNER" || boardRole === "ADMIN";
    if (!isManager) return NextResponse.json({ error: "Bu iş tamamlandı, değişiklik yapılamaz" }, { status: 403 });
  }

  const created = [];

  for (const file of files) {
    if (file.size > MAX_SIZE) continue;
    if (!ALLOWED_TYPES.includes(file.type)) continue;

    const ext = file.name.split(".").pop() ?? "bin";
    const key = `uploads/${cardId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const fileUrl = await uploadToR2(key, buffer, file.type);

    const record = await prisma.cardAttachment.create({
      data: {
        cardId,
        userId: user.id,
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        mimeType: file.type,
      },
    });
    created.push(record);
  }

  return NextResponse.json({ ok: true, count: created.length });
}

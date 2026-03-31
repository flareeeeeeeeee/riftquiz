import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const password = req.headers.get("x-admin-password");
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const data = await req.json();
  const question = await prisma.question.update({
    where: { id },
    data: {
      text: data.text,
      mediaUrl: data.mediaUrl,
      mediaType: data.mediaType,
      answerType: data.answerType,
      options: data.options ? JSON.stringify(data.options) : null,
      correctAnswer: data.correctAnswer,
      explanation: data.explanation,
      relatedImages: data.relatedImages ? JSON.stringify(data.relatedImages) : null,
      order: data.order,
      active: data.active,
    },
  });
  return NextResponse.json(question);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const password = req.headers.get("x-admin-password");
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.question.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const questions = await prisma.question.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(questions);
}

export async function POST(req: NextRequest) {
  const password = req.headers.get("x-admin-password");
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();
  const question = await prisma.question.create({
    data: {
      text: data.text,
      mediaUrl: data.mediaUrl || null,
      mediaType: data.mediaType || "IMAGE",
      answerType: data.answerType,
      options: data.options ? JSON.stringify(data.options) : null,
      correctAnswer: data.correctAnswer,
      explanation: data.explanation || null,
      relatedImages: data.relatedImages ? JSON.stringify(data.relatedImages) : null,
      order: data.order || 0,
    },
  });
  return NextResponse.json(question);
}

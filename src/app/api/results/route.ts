import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const password = req.headers.get("x-admin-password");
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const questions = await prisma.question.findMany({
    orderBy: { order: "asc" },
    select: { id: true, text: true },
  });

  const users = await prisma.quizUser.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, phone: true },
  });

  const answers = await prisma.quizAnswer.findMany({
    include: { attempt: { select: { userId: true } } },
  });

  // Build lookup: userId -> questionId -> isCorrect
  const answerMap: Record<string, Record<string, boolean>> = {};
  for (const a of answers) {
    const uid = a.attempt.userId;
    if (!answerMap[uid]) answerMap[uid] = {};
    // Keep first answer only (shouldn't have duplicates but just in case)
    if (!(a.questionId in answerMap[uid])) {
      answerMap[uid][a.questionId] = a.isCorrect;
    }
  }

  return NextResponse.json({ questions, users, answerMap });
}

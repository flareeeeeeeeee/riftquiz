import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { attemptId } = await req.json();

  const answers = await prisma.quizAnswer.findMany({
    where: { attemptId },
  });

  const score = answers.filter((a) => a.isCorrect).length;

  const attempt = await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: {
      score,
      completedAt: new Date(),
    },
  });

  return NextResponse.json(attempt);
}

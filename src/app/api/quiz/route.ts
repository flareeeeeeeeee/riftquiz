import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Start a quiz attempt
export async function POST(req: NextRequest) {
  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  // Find question IDs this user has already answered
  const answeredIds = await prisma.quizAnswer.findMany({
    where: {
      attempt: { userId },
    },
    select: { questionId: true },
    distinct: ["questionId"],
  });

  const answeredSet = new Set(answeredIds.map((a) => a.questionId));

  const questions = await prisma.question.findMany({
    where: {
      active: true,
      id: { notIn: [...answeredSet] },
    },
    orderBy: { order: "asc" },
  });

  if (questions.length === 0) {
    return NextResponse.json({ attempt: null, questions: [] });
  }

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId,
      totalQ: questions.length,
    },
  });

  return NextResponse.json({ attempt, questions });
}

// Submit an answer
export async function PUT(req: NextRequest) {
  const { attemptId, questionId, answer } = await req.json();

  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const isCorrect = checkAnswer(question.correctAnswer, answer, question.answerType);

  const quizAnswer = await prisma.quizAnswer.upsert({
    where: { attemptId_questionId: { attemptId, questionId } },
    update: { answer: String(answer), isCorrect },
    create: {
      attemptId,
      questionId,
      answer: String(answer),
      isCorrect,
    },
  });

  return NextResponse.json({ ...quizAnswer, explanation: question.explanation });
}

function checkAnswer(correct: string, given: string, type: string): boolean {
  const c = correct.trim().toLowerCase();
  const g = String(given).trim().toLowerCase();

  if (type === "NUMBER") {
    return parseFloat(c) === parseFloat(g);
  }
  return c === g;
}

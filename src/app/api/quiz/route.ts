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

  const now = new Date();
  const questions = await prisma.question.findMany({
    where: {
      active: true,
      id: { notIn: [...answeredSet] },
      OR: [
        { expiresAt: null },
        { expiresAt: { gte: now } },
      ],
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

  // Parse JSON string fields so the client receives clean arrays
  const parsed = questions.map((q) => ({
    ...q,
    options: q.options ? JSON.parse(q.options) : null,
    relatedImages: q.relatedImages ? JSON.parse(q.relatedImages) : null,
  }));

  return NextResponse.json({ attempt, questions: parsed });
}

// Submit an answer
export async function PUT(req: NextRequest) {
  const { attemptId, questionId, answer } = await req.json();

  // Get the attempt to know the userId
  const attempt = await prisma.quizAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }

  // Check if this user already answered this question in ANY attempt
  const existing = await prisma.quizAnswer.findFirst({
    where: {
      questionId,
      attempt: { userId: attempt.userId },
    },
  });

  if (existing) {
    return NextResponse.json({
      id: existing.id,
      isCorrect: existing.isCorrect,
      explanation: null,
      alreadyAnswered: true,
    });
  }

  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const isCorrect = checkAnswer(question.correctAnswer, answer, question.answerType);

  const quizAnswer = await prisma.quizAnswer.create({
    data: {
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

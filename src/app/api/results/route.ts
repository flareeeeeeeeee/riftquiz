import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const password = req.headers.get("x-admin-password");
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const attempts = await prisma.quizAttempt.findMany({
    where: { completedAt: { not: null } },
    include: {
      user: true,
      answers: {
        include: { question: true },
      },
    },
    orderBy: { completedAt: "desc" },
  });

  return NextResponse.json(attempts);
}

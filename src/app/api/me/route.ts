import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
             req.headers.get("x-real-ip") ||
             "unknown";

  const user = await prisma.quizUser.findFirst({ where: { ip } });

  if (user) {
    return NextResponse.json(user);
  }

  return NextResponse.json(null);
}

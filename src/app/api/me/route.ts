import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  // 1. Check cookie first (survives IP changes)
  const cookieId = req.cookies.get("quizUserId")?.value;
  if (cookieId) {
    const user = await prisma.quizUser.findUnique({ where: { id: cookieId } });
    if (user) return NextResponse.json(user);
  }

  // 2. Fallback to IP lookup
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
             req.headers.get("x-real-ip") ||
             "unknown";

  const user = await prisma.quizUser.findFirst({ where: { ip } });

  if (user) {
    const res = NextResponse.json(user);
    res.cookies.set("quizUserId", user.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return res;
  }

  return NextResponse.json(null);
}

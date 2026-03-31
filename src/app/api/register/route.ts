import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { phone, name } = await req.json();

  if (!phone || !name) {
    return NextResponse.json({ error: "Phone and name required" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
             req.headers.get("x-real-ip") ||
             "unknown";

  // Find existing user by phone (might be on a new device/IP)
  let user = await prisma.quizUser.findFirst({ where: { phone } });

  if (user) {
    // Update IP and name if they changed devices
    user = await prisma.quizUser.update({
      where: { id: user.id },
      data: { ip, name },
    });
  } else {
    user = await prisma.quizUser.create({
      data: { phone, name, ip },
    });
  }

  const res = NextResponse.json(user);
  res.cookies.set("quizUserId", user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}

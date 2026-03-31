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

  const user = await prisma.quizUser.upsert({
    where: { phone_ip: { phone, ip } },
    update: { name },
    create: { phone, name, ip },
  });

  return NextResponse.json(user);
}

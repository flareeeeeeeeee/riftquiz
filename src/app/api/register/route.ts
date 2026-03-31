import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { riotId } = await req.json();

  if (!riotId) {
    return NextResponse.json({ error: "Riot ID requerido" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
             req.headers.get("x-real-ip") ||
             "unknown";

  // Check if this IP already has a user
  const existingIp = await prisma.quizUser.findFirst({ where: { ip } });
  if (existingIp) {
    // Update name if same IP
    const user = await prisma.quizUser.update({
      where: { id: existingIp.id },
      data: { name: riotId },
    });
    return NextResponse.json(user);
  }

  // Check if this Riot ID already exists
  const existingName = await prisma.quizUser.findFirst({
    where: { name: riotId },
  });

  if (existingName) {
    // Update IP
    const user = await prisma.quizUser.update({
      where: { id: existingName.id },
      data: { ip },
    });
    return NextResponse.json(user);
  }

  // Create new user
  const user = await prisma.quizUser.create({
    data: { name: riotId, phone: ip, ip },
  });

  return NextResponse.json(user);
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma as db } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const link = await db.link.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!link) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ clickCount: link.clickCount });
}
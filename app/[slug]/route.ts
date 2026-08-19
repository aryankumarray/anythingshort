import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const link = await db.link.findUnique({
    where: { slug },
  });

  if (!link || !link.isActive) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  await db.link.update({
    where: { id: link.id },
    data: { clickCount: { increment: 1 } },
  });

  return NextResponse.redirect(link.longUrl);
}

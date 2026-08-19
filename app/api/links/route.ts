import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listLinks } from "@/lib/services/links";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || undefined;
  const page = Number(searchParams.get("page")) || 1;

  const result = await listLinks(session.user.id, { search, page });
  return NextResponse.json(result);
}
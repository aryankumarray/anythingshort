import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";

const FREE_PLAN_LINK_LIMIT = 15;

export async function enforceLinkLimit(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  if (user.plan === "PRO") {
    return;
  }

  const linkCount = await prisma.link.count({ where: { userId } });

  if (linkCount >= FREE_PLAN_LINK_LIMIT) {
    throw new ApiError(
      403,
      `Free plan limit reached (${FREE_PLAN_LINK_LIMIT} links). Upgrade to Pro for unlimited links.`
    );
  }
}
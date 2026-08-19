import { prisma as db } from "@/lib/prisma";

export interface UserStats {
  totalLinks: number;
  totalClicks: number;
  avgCtr: number;
  activeRedirects: number;
}

export interface ListLinksOptions {
  search?: string;
  page?: number;
  limit?: number;
}

export async function getUserStats(userId: string): Promise<UserStats> {
  try {
    const totalLinks = await db.link.count({ where: { userId } });
    const activeRedirects = await db.link.count({ where: { userId, isActive: true } });
    const aggregateClicks = await db.link.aggregate({
      where: { userId },
      _sum: { clickCount: true },
    });

    const totalClicks = aggregateClicks._sum.clickCount || 0;
    const avgCtr = totalLinks > 0 ? Number((totalClicks / totalLinks).toFixed(2)) : 0;

    return { totalLinks, totalClicks, avgCtr, activeRedirects };
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return { totalLinks: 0, totalClicks: 0, avgCtr: 0, activeRedirects: 0 };
  }
}

export async function listLinks(userId: string, options?: ListLinksOptions) {
  try {
    const search = options?.search;
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const whereClause: any = { userId };
    if (search) {
      whereClause.OR = [
        { slug: { contains: search, mode: "insensitive" } },
        { longUrl: { contains: search, mode: "insensitive" } },
      ];
    }

    const [links, total] = await Promise.all([
      db.link.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.link.count({ where: whereClause }),
    ]);

    return { links, total, page, totalPages: Math.ceil(total / limit) };
  } catch (error) {
    console.error("Error listing links:", error);
    return { links: [], total: 0, page: 1, totalPages: 0 };
  }
}
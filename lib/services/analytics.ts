import { createHash } from "node:crypto";
import { UAParser } from "ua-parser-js";
import type { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

type GeoResult = {
  country: string | null;
  city: string | null;
};

function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  return request.headers.get("x-real-ip");
}

function hashIp(ip: string): string {
  return createHash("sha256")
    .update(`${ip}${env.IP_HASH_SALT}`)
    .digest("hex");
}

function normalizeDeviceType(deviceType: string | undefined): string | null {
  if (!deviceType) {
    return "desktop";
  }

  if (deviceType === "mobile" || deviceType === "tablet") {
    return deviceType;
  }

  return "desktop";
}

async function lookupGeo(ip: string): Promise<GeoResult> {
  try {
    const ipgeolocationResponse = await fetch(
      `https://api.ipgeolocation.io/ipgeo?apiKey=${env.IPGEOLOCATION_API_KEY}&ip=${encodeURIComponent(ip)}`,
      { signal: AbortSignal.timeout(3000) },
    );

    if (ipgeolocationResponse.ok) {
      const data = (await ipgeolocationResponse.json()) as {
        country_name?: string;
        city?: string;
      };

      return {
        country: data.country_name ?? null,
        city: data.city ?? null,
      };
    }
  } catch {
    // Fall through to ip-api.com.
  }

  try {
    const ipApiResponse = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=country,city`,
      { signal: AbortSignal.timeout(3000) },
    );

    if (ipApiResponse.ok) {
      const data = (await ipApiResponse.json()) as {
        country?: string;
        city?: string;
      };

      return {
        country: data.country ?? null,
        city: data.city ?? null,
      };
    }
  } catch {
    // Geo lookup failure must never break click tracking.
  }

  return { country: null, city: null };
}

export async function trackClick(linkId: string, request: NextRequest): Promise<void> {
  try {
    const ip = getClientIp(request);
    if (!ip) {
      return;
    }

    const ipHash = hashIp(ip);
    const userAgent = request.headers.get("user-agent");
    const referrer = request.headers.get("referer");

    const parser = new UAParser(userAgent ?? undefined);
    const browser = parser.getBrowser();
    const os = parser.getOS();
    const device = parser.getDevice();

    const geo = await lookupGeo(ip);

    await prisma.$transaction([
      prisma.click.create({
        data: {
          linkId,
          ipHash,
          country: geo.country,
          city: geo.city,
          referrer,
          userAgent,
          deviceType: normalizeDeviceType(device.type),
          browser: browser.name ?? null,
          os: os.name ?? null,
        },
      }),
      prisma.link.update({
        where: { id: linkId },
        data: { clickCount: { increment: 1 } },
      }),
    ]);
  } catch {
    // Analytics must never throw to the redirect handler.
  }
}

import { z } from "zod";

const RESERVED_SLUGS = [
  "api", "login", "dashboard", "admin", "links", "analytics",
  "settings", "upgrade", "verify", "about", "pricing",
];

export const createLinkSchema = z.object({
  longUrl: z
    .string()
    .url()
    .refine(
      (url) => !url.startsWith("javascript:") && !url.startsWith("data:"),
      "Invalid URL scheme."
    ),
  customSlug: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9-]+$/, "Only letters, numbers, and hyphens allowed.")
    .refine((slug) => !RESERVED_SLUGS.includes(slug.toLowerCase()), "This slug is reserved.")
    .optional(),
  title: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  expiresAt: z.coerce.date().min(new Date()).optional(),
  password: z.string().min(6).optional(),
});

export const updateLinkSchema = createLinkSchema.partial().omit({ customSlug: true });

export type CreateLinkInput = z.infer<typeof createLinkSchema>;
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>;
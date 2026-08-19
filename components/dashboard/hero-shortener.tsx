"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import { Link2, Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type SlugStatus = "idle" | "checking" | "available" | "taken";

export function HeroShortener() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

 
  const router = useRouter();
  const [longUrl, setLongUrl] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [loading, setLoading] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        urlInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  
  useEffect(() => {
    if (!customSlug || customSlug.length < 3) {
      setSlugStatus("idle");
      return;
    }
    setSlugStatus("checking");
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/links/check-slug?slug=${encodeURIComponent(customSlug)}`);
        const data = await res.json();
        setSlugStatus(data.available ? "available" : "taken");
      } catch {
        setSlugStatus("idle");
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [customSlug]);

  const previewSlug = customSlug || "••••••";
  const previewUrl = `anythingshort.link/${previewSlug}`;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!longUrl) return;
    setLoading(true);
    setCreatedLink(null);

    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          longUrl,
          ...(customSlug ? { customSlug } : {}),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong.");
        return;
      }

      const shortUrl = `${window.location.origin}/${data.link.slug}`;
      setCreatedLink(shortUrl);
      setLongUrl("");
      setCustomSlug("");
      toast.success("Link created!");
      router.refresh();
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!createdLink) return;
    await navigator.clipboard.writeText(createdLink);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!mounted) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-6 shadow-2xl sm:p-8">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative">
        <h2 className="mb-1 text-xl font-semibold text-white">Shorten a new link</h2>
        <p className="mb-6 text-sm text-zinc-500">
          Press{" "}
          <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-xs text-zinc-400">
            ⌘K
          </kbd>{" "}
          to jump here anytime
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Link2 className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              ref={urlInputRef}
              type="url"
              required
              placeholder="https://example.com/your-long-url"
              value={longUrl}
              onChange={(e) => setLongUrl(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-violet-500/50 focus:bg-white/[0.05] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)]"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="custom-alias (optional)"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value.replace(/[^a-zA-Z0-9-]/g, ""))}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-4 pr-9 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-violet-500/50"
              />
              {slugStatus === "checking" && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-zinc-500" />
              )}
              {slugStatus === "available" && (
                <span className="absolute right-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-emerald-400" />
              )}
              {slugStatus === "taken" && (
                <span className="absolute right-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-red-400" />
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !longUrl}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-600/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Shorten URL
            </button>
          </div>
        </form>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-4 py-3">
          <span className="font-mono text-sm text-zinc-400">
            {createdLink ? createdLink.replace(/^https?:\/\//, "") : previewUrl}
          </span>
          {createdLink && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1 text-xs font-medium text-zinc-300 transition hover:bg-white/10"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
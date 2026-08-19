"use client";

import { useState } from "react";
import { ExternalLink, Trash2, Copy, Check, QrCode } from "lucide-react";
import { QrModal } from "@/components/dashboard/qr-modal";
import { toast } from "sonner";

export interface LinkRow {
  id: string;
  slug: string;
  longUrl: string;
  clickCount: number;
  isActive: boolean;
  createdAt: string;
}

interface LinksTableProps {
  links: LinkRow[];
}

export function LinksTable({ links }: LinksTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrLink, setQrLink] = useState<{ slug: string } | null>(null);
  const [linkList, setLinkList] = useState<LinkRow[]>(links);

  const handleCopy = (slug: string, id: string) => {
    const fullUrl = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    toast.success("Short URL copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/links/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete link");
      
      setLinkList((prev) => prev.filter((item) => item.id !== id));
      toast.success("Link deleted successfully!");
    } catch (error) {
      toast.error("Could not delete link. Please try again.");
    }
  };

  if (linkList.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-8 text-center backdrop-blur-md">
        <p className="text-zinc-400 text-sm">No links created yet. Paste a long URL above to get started!</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-zinc-900/50 backdrop-blur-md">
        <table className="w-full text-left text-sm text-zinc-300">
          <thead className="border-b border-white/10 bg-zinc-950/50 text-xs uppercase text-zinc-400">
            <tr>
              <th scope="col" className="px-6 py-4 font-medium">Short Link</th>
              <th scope="col" className="px-6 py-4 font-medium">Destination URL</th>
              <th scope="col" className="px-6 py-4 font-medium">Clicks</th>
              <th scope="col" className="px-6 py-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {linkList.map((link) => (
              <tr key={link.id} className="transition-colors hover:bg-white/[0.02]">
                <td className="whitespace-nowrap px-6 py-4 font-medium text-emerald-400">
                  <div className="flex items-center gap-2">
                    <span>/{link.slug}</span>
                    <button
                      onClick={() => handleCopy(link.slug, link.id)}
                      className="rounded p-1 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
                      title="Copy Short Link"
                    >
                      {copiedId === link.id ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </td>
                <td className="max-w-xs truncate px-6 py-4 text-zinc-400" title={link.longUrl}>
                  {link.longUrl}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className="inline-flex items-center rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
                    {link.clickCount}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setQrLink({ slug: link.slug })}
                      className="rounded-lg border border-white/10 bg-zinc-800/50 p-2 text-zinc-300 hover:bg-zinc-700/50 transition-colors"
                      title="Generate QR Code"
                    >
                      <QrCode className="h-4 w-4" />
                    </button>
                    <a
                      href={link.longUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-white/10 bg-zinc-800/50 p-2 text-zinc-300 hover:bg-zinc-700/50 transition-colors"
                      title="Visit Original Link"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <button
                      onClick={() => handleDelete(link.id)}
                      className="rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20 transition-colors"
                      title="Delete Link"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {qrLink && (
        <QrModal
          slug={qrLink.slug}
          onClose={() => setQrLink(null)}
        />
      )}
    </>
  );
}
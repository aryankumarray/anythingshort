"use client";

import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { X, Download } from "lucide-react";

interface QrModalProps {
  slug: string;
  onClose: () => void;
}

export function QrModal({ slug, onClose }: QrModalProps) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(`${window.location.origin}/${slug}`);
  }, [slug]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleDownload = () => {
    const canvas = document.getElementById("qr-canvas") as HTMLCanvasElement | null;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slug}-qrcode.png`;
    link.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-200"
        >
          <X className="h-4 w-4" />
        </button>

        <h3 className="mb-1 text-lg font-semibold text-white">QR Code</h3>
        <p className="mb-6 font-mono text-xs text-zinc-500">/{slug}</p>

        <div className="flex justify-center rounded-xl bg-white p-6">
          {url && <QRCodeCanvas id="qr-canvas" value={url} size={200} level="H" />}
        </div>

        <button
          onClick={handleDownload}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-600/20 transition hover:opacity-90"
        >
          <Download className="h-4 w-4" />
          Download PNG
        </button>
      </div>
    </div>
  );
}
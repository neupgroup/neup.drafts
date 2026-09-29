"use client";

import { useState } from "react";

interface ShareButtonProps {
  title?: string;
  url?: string;
}

export function ShareButton({ title, url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const handleShare = async () => {
    setError("");
    setCopied(false);

    const shareUrl = url ?? window.location.href;
    const shareTitle = title ?? document.title;

    try {
      // Use the native share sheet when supported.
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          url: shareUrl,
        });

        return;
      }

      // Fallback for browsers without the Web Share API.
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);

        setTimeout(() => {
          setCopied(false);
        }, 2500);

        return;
      }

      setError("Sharing is not supported in this browser.");
    } catch (err: unknown) {
      // Ignore when the user closes/cancels the native share sheet.
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }

      setError("Could not share this article.");
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex h-11 items-center justify-center border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
        aria-label="Share this article"
      >
        {copied ? "Link Copied! ✓" : "Share 🔗"}
      </button>

      {error && (
        <p className="mt-2 text-xs font-medium text-rose-600">{error}</p>
      )}
    </div>
  );
}

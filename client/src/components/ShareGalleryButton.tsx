import { useState, type Dispatch, type SetStateAction } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Check, Copy, Link2, Loader2, Share2, X } from "lucide-react";
import api from "../lib/api";
import { formatDate } from "../lib/format";
import { useLang, withLang } from "../lib/localePath";
import { shareDaysLeft as daysLeft, type GalleryShare as Share } from "../hooks/useGalleryShares";

interface ShareGalleryButtonProps {
  album: string | null;
  className: string;
  shares: Share[];
  setShares: Dispatch<SetStateAction<Share[]>>;
}

// Galerim: "Paylaş" — kapsam başına (tüm galeri / seçili albüm) TEK aktif link.
// Link açıksa buton "Paylaşım açık" der ve başlığın altında hangi linklerin açık olduğu görünür.
const ShareGalleryButton = ({ album, className, shares, setShares }: ShareGalleryButtonProps) => {
  const { t } = useTranslation();
  const lang = useLang();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = shares.find((s) => s.album === album) ?? null;
  const urlOf = (s: Share) => `${window.location.origin}${withLang(`/paylasim/${s.token}`, lang)}`;
  const scopeLabel = (a: string | null) => (a ? t("pages.share.scopeAlbum", { album: a }) : t("pages.share.scopeAll"));

  const openModal = () => {
    setError(null);
    setCopied(false);
    setConfirmRevoke(false);
    setOpen(true);
  };

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const { data } = await api.post("/api/gallery/my/shares", { album });
      setShares((prev) => [data.share, ...prev.filter((s) => s.id !== data.share.id)]);
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || t("pages.share.error"));
    } finally {
      setBusy(false);
    }
  };

  const revoke = async () => {
    if (!current) return;
    setBusy(true);
    setError(null);
    try {
      await api.delete(`/api/gallery/my/shares/${current.id}`);
      setShares((prev) => prev.filter((s) => s.id !== current.id));
      setConfirmRevoke(false);
    } catch {
      setError(t("pages.share.error"));
    } finally {
      setBusy(false);
    }
  };

  const copy = async (s: Share) => {
    const url = urlOf(s);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt(t("pages.share.copy"), url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const nativeShare = (s: Share) =>
    navigator.share?.({ title: t("pages.share.sharedTitle"), url: urlOf(s) }).catch(() => {});

  return (
    <>
      <button onClick={openModal} className={className}>
        {current ? <Link2 className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
        {current ? t("pages.share.buttonActive") : t("pages.share.button")}
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-black/80 flex items-end sm:items-center justify-center p-4" onClick={() => setOpen(false)}>
            <div
              role="dialog"
              aria-modal="true"
              className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 mb-1">
                <h2 className="text-lg font-bold text-white">{t("pages.share.title")}</h2>
                <button onClick={() => setOpen(false)} aria-label={t("pages.share.close")} className="text-zinc-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-emerald-400 mb-3">{scopeLabel(album)}</p>
              <p className="text-sm text-zinc-400 mb-5">{t("pages.share.intro")}</p>

              {current ? (
                <>
                  <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 mb-2">
                    <span className="flex-1 text-xs text-zinc-300 truncate">{urlOf(current)}</span>
                  </div>
                  <p className="text-xs text-zinc-500 mb-4">
                    {t("pages.share.validUntil", { date: formatDate(current.expiresAt, { day: "numeric", month: "long" }) })} ·{" "}
                    {t("pages.share.daysLeft", { count: daysLeft(current.expiresAt) })}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                    <button
                      onClick={() => copy(current)}
                      className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? t("pages.share.copied") : t("pages.share.copy")}
                    </button>
                    {typeof navigator.share === "function" ? (
                      <button
                        onClick={() => nativeShare(current)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium"
                      >
                        <Share2 className="w-4 h-4" />
                        {t("pages.share.shareNative")}
                      </button>
                    ) : (
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(t("pages.share.whatsappText", { url: urlOf(current) }))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium"
                      >
                        {t("pages.share.whatsapp")}
                      </a>
                    )}
                  </div>

                  {confirmRevoke ? (
                    <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3">
                      <p className="text-sm text-zinc-200 mb-3">{t("pages.share.revokeConfirm")}</p>
                      <div className="flex gap-2">
                        <button onClick={() => setConfirmRevoke(false)} className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 text-zinc-200 text-sm">
                          {t("pages.share.cancel")}
                        </button>
                        <button
                          onClick={revoke}
                          disabled={busy}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold disabled:opacity-50"
                        >
                          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                          {t("pages.share.revokeYes")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmRevoke(true)} className="w-full text-sm text-red-400 hover:text-red-300 py-2">
                      {t("pages.share.revoke")}
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={create}
                  disabled={busy}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                  {t("pages.share.create")}
                </button>
              )}

              {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

// Başlığın altında: açık olan tüm paylaşımlar ("Paylaşım açık: Tüm galeri · 29 gün kaldı")
export const ActiveSharesLine = ({ shares }: { shares: Share[] }) => {
  const { t } = useTranslation();
  if (shares.length === 0) return null;
  return (
    <p className="text-xs text-emerald-400/90 mb-4 flex items-center gap-1.5">
      <Link2 className="w-3.5 h-3.5" />
      {shares
        .map((s) => `${s.album ?? t("pages.share.scopeAll")} · ${t("pages.share.daysLeft", { count: daysLeft(s.expiresAt) })}`)
        .join("  |  ")}
    </p>
  );
};

export default ShareGalleryButton;

import { useState, type Dispatch, type SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import { Check, Copy, Link2, Share2 } from "lucide-react";
import Modal from "./ui/Modal";
import WhatsAppIcon from "./ui/WhatsAppIcon";
import { Alert, Button } from "./ui/kit";
import { buttonClass } from "../lib/siteUi";
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
      <button type="button" onClick={openModal} className={className}>
        {current ? <Link2 className="w-4 h-4 text-emerald-400" aria-hidden /> : <Share2 className="w-4 h-4" aria-hidden />}
        {current ? t("pages.share.buttonActive") : t("pages.share.button")}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={t("pages.share.title")} size="sm">
        <p className="font-medium text-emerald-400 mb-2">{scopeLabel(album)}</p>
        <p className="text-zinc-400 mb-5">{t("pages.share.intro")}</p>

        {current ? (
          <>
            <p className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-300 break-all mb-2">
              {urlOf(current)}
            </p>
            <p className="text-sm text-zinc-400 mb-4">
              {t("pages.share.validUntil", { date: formatDate(current.expiresAt, { day: "numeric", month: "long" }) })} ·{" "}
              {t("pages.share.daysLeft", { count: daysLeft(current.expiresAt) })}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              <Button icon={copied ? Check : Copy} onClick={() => copy(current)}>
                {copied ? t("pages.share.copied") : t("pages.share.copy")}
              </Button>
              {typeof navigator.share === "function" ? (
                <Button variant="secondary" icon={Share2} onClick={() => nativeShare(current)}>
                  {t("pages.share.shareNative")}
                </Button>
              ) : (
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(t("pages.share.whatsappText", { url: urlOf(current) }))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClass("secondary")}
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  {t("pages.share.whatsapp")}
                </a>
              )}
            </div>

            {confirmRevoke ? (
              <Alert tone="danger">
                <p className="mb-3">{t("pages.share.revokeConfirm")}</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setConfirmRevoke(false)}>
                    {t("pages.share.cancel")}
                  </Button>
                  <Button variant="danger" size="sm" loading={busy} onClick={revoke}>
                    {t("pages.share.revokeYes")}
                  </Button>
                </div>
              </Alert>
            ) : (
              <Button variant="danger" className="w-full" onClick={() => setConfirmRevoke(true)}>
                {t("pages.share.revoke")}
              </Button>
            )}
          </>
        ) : (
          <Button icon={Link2} loading={busy} onClick={create} className="w-full">
            {t("pages.share.create")}
          </Button>
        )}

        {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
      </Modal>
    </>
  );
};

// Başlığın altında: açık olan tüm paylaşımlar ("Paylaşım açık: Tüm galeri · 29 gün kaldı")
export const ActiveSharesLine = ({ shares }: { shares: Share[] }) => {
  const { t } = useTranslation();
  if (shares.length === 0) return null;
  return (
    <p className="text-sm text-emerald-400 mb-4 flex items-center gap-1.5">
      <Link2 className="w-4 h-4 shrink-0" aria-hidden />
      {shares
        .map((s) => `${s.album ?? t("pages.share.scopeAll")} · ${t("pages.share.daysLeft", { count: daysLeft(s.expiresAt) })}`)
        .join("  |  ")}
    </p>
  );
};

export default ShareGalleryButton;

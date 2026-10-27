import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Loader2, MessageSquareHeart, Star } from "lucide-react";
import api from "../lib/api";

const MAX_LENGTH = 1000;

// Galerim'in en altındaki "Görüşlerinizi bildirin" formu (girişli müşteri).
// Admin görüşleri /admin/feedback'te okur.
const FeedbackForm = ({ page }: { page: "galerim" }) => {
  const { t } = useTranslation();
  const [rating, setRating] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 3 || sending) return;
    setSending(true);
    setError(null);
    try {
      await api.post("/api/feedback", { message: message.trim(), rating, page });
      setSent(true);
      setMessage("");
      setRating(null);
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(msg || t("pages.feedback.error"));
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="mt-16 max-w-2xl mx-auto bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 sm:p-8">
      {sent ? (
        <div className="text-center py-4">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-white">{t("pages.feedback.thanks")}</h2>
          <p className="text-sm text-zinc-400 mt-1">{t("pages.feedback.thanksText")}</p>
          <button onClick={() => setSent(false)} className="mt-4 text-sm text-emerald-400 hover:text-emerald-300 underline underline-offset-4">
            {t("pages.feedback.another")}
          </button>
        </div>
      ) : (
        <form onSubmit={submit}>
          <div className="flex items-center gap-2 mb-1">
            <MessageSquareHeart className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">{t("pages.feedback.title")}</h2>
          </div>
          <p className="text-sm text-zinc-400 mb-5">{t("pages.feedback.subtitle")}</p>

          <p className="text-xs text-zinc-500 mb-2">{t("pages.feedback.ratingLabel")}</p>
          <div className="flex gap-1 mb-4" onMouseLeave={() => setHover(null)}>
            {[1, 2, 3, 4, 5].map((n) => {
              const active = (hover ?? rating ?? 0) >= n;
              return (
                <button
                  key={n}
                  type="button"
                  aria-label={t("pages.feedback.star", { count: n })}
                  aria-pressed={rating === n}
                  onMouseEnter={() => setHover(n)}
                  onClick={() => setRating(rating === n ? null : n)}
                  className="p-1"
                >
                  <Star className={`w-7 h-7 transition-colors ${active ? "text-amber-400 fill-amber-400" : "text-zinc-600"}`} />
                </button>
              );
            })}
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MAX_LENGTH))}
            rows={4}
            placeholder={t("pages.feedback.placeholder")}
            className="w-full bg-zinc-950/60 border border-zinc-700 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none resize-y"
          />
          <div className="flex items-center justify-between mt-3 gap-3">
            <span className="text-xs text-zinc-600">
              {message.length}/{MAX_LENGTH}
            </span>
            <button
              type="submit"
              disabled={message.trim().length < 3 || sending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white text-sm font-semibold"
            >
              {sending && <Loader2 className="w-4 h-4 animate-spin" />}
              {sending ? t("pages.feedback.sending") : t("pages.feedback.send")}
            </button>
          </div>
          {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
        </form>
      )}
    </section>
  );
};

export default FeedbackForm;

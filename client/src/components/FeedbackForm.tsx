import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Star } from "lucide-react";
import { Button, Card, Textarea } from "./ui/kit";
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
    <Card padding="lg" className="mt-16 max-w-2xl mx-auto">
      {sent ? (
        <div className="text-center py-4">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" aria-hidden />
          <h2 className="text-lg font-semibold text-white">{t("pages.feedback.thanks")}</h2>
          <p className="text-sm text-zinc-400 mt-1">{t("pages.feedback.thanksText")}</p>
          <Button variant="ghost" className="mt-3 underline underline-offset-4" onClick={() => setSent(false)}>
            {t("pages.feedback.another")}
          </Button>
        </div>
      ) : (
        <form onSubmit={submit}>
          <h2 className="text-lg font-semibold text-white">{t("pages.feedback.title")}</h2>
          <p className="text-sm text-zinc-400 mt-1 mb-5">{t("pages.feedback.subtitle")}</p>

          <p id="feedback-rating" className="text-sm font-medium text-zinc-300 mb-1">{t("pages.feedback.ratingLabel")}</p>
          <div role="group" aria-labelledby="feedback-rating" className="flex mb-4 -ml-2" onMouseLeave={() => setHover(null)}>
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
                  className="inline-flex items-center justify-center w-11 h-11 rounded-xl"
                >
                  <Star className={`w-7 h-7 transition-colors ${active ? "text-amber-400 fill-amber-400" : "text-zinc-500"}`} aria-hidden />
                </button>
              );
            })}
          </div>

          <label htmlFor="feedback-message" className="sr-only">
            {t("pages.feedback.title")}
          </label>
          <Textarea
            id="feedback-message"
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MAX_LENGTH))}
            rows={4}
            placeholder={t("pages.feedback.placeholder")}
          />
          <div className="flex items-center justify-between mt-3 gap-3">
            <span className="text-sm text-zinc-400">
              {message.length}/{MAX_LENGTH}
            </span>
            <Button type="submit" loading={sending} disabled={message.trim().length < 3}>
              {sending ? t("pages.feedback.sending") : t("pages.feedback.send")}
            </Button>
          </div>
          {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
        </form>
      )}
    </Card>
  );
};

export default FeedbackForm;

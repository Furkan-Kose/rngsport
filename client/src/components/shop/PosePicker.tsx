import { useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, Check, Maximize2, X } from "lucide-react";
import type { ShopPoseOptions } from "../../lib/shop";
import { backdropClass, useDialog } from "../ui/Modal";
import { Button } from "../ui/kit";
import { cardTone, cx, iconButtonClass } from "../../lib/siteUi";

// Sipariş adımları: 1 Alet · 2 Poz · 3 Bilgiler. Tamamlanan adıma tıklanıp geri dönülebilir.
export const StepIndicator = ({ step, maxStep, onStep }: { step: number; maxStep: number; onStep: (s: 1 | 2 | 3) => void }) => {
  const { t } = useTranslation();
  const steps = [t("pages.shop.checkout.steps.apparatus"), t("pages.shop.checkout.steps.pose"), t("pages.shop.checkout.steps.details")];
  return (
    <ol className="flex items-center gap-2 sm:gap-4 mb-8 flex-wrap">
      {steps.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const done = n < step;
        const active = n === step;
        const reachable = n <= maxStep && !active;
        return (
          <li key={label} className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              disabled={!reachable}
              onClick={() => onStep(n)}
              aria-current={active ? "step" : undefined}
              className={`flex items-center gap-2 min-h-10 text-sm font-medium ${
                active ? "text-white" : done ? "text-emerald-400 hover:text-emerald-300" : "text-zinc-400"
              } disabled:cursor-default`}
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center border text-xs ${
                  active
                    ? "bg-emerald-500 border-emerald-400 text-zinc-950"
                    : done
                      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                      : "bg-zinc-800 border-zinc-700 text-zinc-400"
                }`}
              >
                {done ? <Check className="w-4 h-4" /> : n}
              </span>
              {label}
            </button>
            {i < steps.length - 1 && <span aria-hidden className="w-6 sm:w-10 h-px bg-zinc-700" />}
          </li>
        );
      })}
    </ol>
  );
};

interface PosePickerProps {
  options: ShopPoseOptions;
  step: 1 | 2;
  apparatus: string | null;
  poseNo: number | null;
  onApparatus: (slug: string) => void;
  onPose: (no: number) => void;
  onBack: () => void;
  onNext: () => void;
}

// Adım 1: alet kartları (kapak = o aletin ilk poz fotoğrafı). Adım 2: seçilen aletin pozları.
const PosePicker = ({ options, step, apparatus, poseNo, onApparatus, onPose, onBack, onNext }: PosePickerProps) => {
  const { t } = useTranslation();
  const [zoom, setZoom] = useState<string | null>(null);
  const current = options.apparatuses.find((a) => a.slug === apparatus);

  const zoomRef = useDialog(zoom !== null, () => setZoom(null));

  if (step === 1) {
    return (
      <section>
        <h2 className="text-xl font-semibold text-white mb-1">{t("pages.shop.checkout.steps.apparatusTitle")}</h2>
        <p className="text-sm text-zinc-400 mb-6">{t("pages.shop.checkout.steps.apparatusHint")}</p>
        {/* Resimsiz: alet adı + poz sayısı; fotoğraflar yalnızca poz adımında */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {options.apparatuses.map((a) => {
            const selected = apparatus === a.slug;
            return (
              <button
                key={a.slug}
                type="button"
                onClick={() => onApparatus(a.slug)}
                aria-pressed={selected}
                className={cx(
                  cardTone(selected ? "accent" : "default"),
                  "flex items-center justify-between gap-3 text-left px-5 py-5 transition-colors",
                  selected ? "bg-emerald-500/10" : "hover:border-zinc-600",
                )}
              >
                <span>
                  <span className="block text-lg font-semibold text-white">{t(`common.apparatus.${a.slug}`)}</span>
                  <span className="block text-sm text-zinc-400 mt-0.5">
                    {t("pages.shop.checkout.steps.poseCount", { count: a.poses.length })}
                  </span>
                </span>
                {selected ? (
                  <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <ArrowRight className="w-5 h-5 text-zinc-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-xl font-semibold text-white mb-1">
        {t("pages.shop.checkout.steps.poseTitle", { apparatus: apparatus ? t(`common.apparatus.${apparatus}`) : "" })}
      </h2>
      <p className="text-sm text-zinc-400 mb-6">{t("pages.shop.checkout.steps.poseHint")}</p>
      {/* Pozlar yan yana, ölçülü boyda (mobilde 2, büyük ekranda 3 sütun) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 max-w-2xl">
        {current?.poses.map((pose) => {
          const selected = poseNo === pose.no;
          return (
            <div
              key={pose.no}
              className={cx(
                cardTone(selected ? "accent" : "default"),
                "relative overflow-hidden transition-colors",
                selected ? "ring-2 ring-emerald-500/50" : "hover:border-zinc-600",
              )}
            >
              <button type="button" aria-pressed={selected} onClick={() => onPose(pose.no)} className="block w-full text-left rounded-2xl">
                <div className="aspect-3/4 bg-zinc-800">
                  <img src={pose.image} alt={pose.label ?? ""} loading="lazy" className="w-full h-full object-cover" />
                </div>
                <div className="p-2.5 sm:p-3 flex items-center justify-between gap-2">
                  <span className="font-semibold text-white text-sm sm:text-base">
                    {t("pages.shop.checkout.steps.poseN", { n: pose.no })}
                    {pose.label && <span className="text-zinc-400 font-normal"> · {pose.label}</span>}
                  </span>
                  <span
                    className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                      selected ? "bg-emerald-500 border-emerald-400 text-zinc-950" : "border-zinc-600"
                    }`}
                  >
                    {selected && <Check className="w-4 h-4" />}
                  </span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setZoom(pose.image)}
                className="absolute top-2 right-2 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-black/70 text-white hover:bg-black"
                aria-label={t("pages.shop.checkout.steps.zoom")}
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3 mt-8">
        <Button variant="secondary" size="lg" icon={ArrowLeft} onClick={onBack}>
          {t("pages.shop.checkout.steps.back")}
        </Button>
        <Button size="lg" onClick={onNext} disabled={!poseNo}>
          {t("pages.shop.checkout.steps.next")}
          <ArrowRight className="w-4 h-4" aria-hidden />
        </Button>
      </div>

      {zoom &&
        createPortal(
          <div
            ref={zoomRef}
            role="dialog"
            aria-modal="true"
            aria-label={t("pages.shop.checkout.steps.zoom")}
            tabIndex={-1}
            className={cx(backdropClass, "bg-black/90 flex items-center justify-center p-4 outline-none")}
            onClick={() => setZoom(null)}
          >
            <button type="button" className={iconButtonClass("secondary", "absolute top-4 right-4")} aria-label={t("common.close")}>
              <X className="w-6 h-6" aria-hidden />
            </button>
            <img src={zoom} alt="" className="max-w-full max-h-[90vh] object-contain rounded-xl" />
          </div>,
          document.body
        )}
    </section>
  );
};

export default PosePicker;

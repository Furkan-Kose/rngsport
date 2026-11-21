import { MapPin, Calendar, ArrowRight, CalendarCheck, CheckCircle2, Clock } from "lucide-react";
import SectionHeader from "./ui/SectionHeader";
import Reveal from "./ui/Reveal";
import { Pill } from "./ui/kit";
import { useTranslation } from "react-i18next";
import LocalizedLink from "./LocalizedLink";
import { useTournaments, type Tournament } from "../lib/tournaments";
import { buttonClass, cardTone, cx } from "../lib/siteUi";

const isBookable = (t: Tournament) => t.bookingOpen && t.status !== "finished";

/** Rezervasyona açık olanlar en üstte, sonra devam eden / yaklaşanlar, en altta tamamlananlar
    (en yenisi önce). Hepsi gösterilir. */
const orderForCalendar = (list: Tournament[]) => {
  const bookable = list.filter(isBookable);
  const active = list.filter((t) => !isBookable(t) && t.status !== "finished");
  const finished = list.filter((t) => t.status === "finished").reverse();
  return [...bookable, ...active, ...finished];
};

const StatusPill = ({ tournament }: { tournament: Tournament }) => {
  const { t } = useTranslation();
  if (isBookable(tournament)) {
    return (
      <Pill tone="success" icon={CalendarCheck}>
        {t("home.tournaments.bookingOpen")}
      </Pill>
    );
  }
  if (tournament.status === "ongoing") return <Pill tone="success">{t("home.tournaments.active")}</Pill>;
  if (tournament.status === "upcoming") {
    return (
      <Pill tone="warning" icon={Clock}>
        {t("home.tournaments.soon")}
      </Pill>
    );
  }
  return <Pill icon={CheckCircle2}>{t("home.tournaments.finished")}</Pill>;
};

const Tournaments = () => {
  const { tournaments } = useTournaments();
  const { t } = useTranslation();

  // Yüklenene kadar / hiç turnuva yoksa bölümü tamamen gizle
  if (tournaments.length === 0) return null;

  return (
    <section id="tournament" className="py-24 bg-black scroll-mt-20">
      <div className="container mx-auto px-4">
        <SectionHeader title={t("home.tournaments.title")} description={t("home.tournaments.description")} />

        <ul className="max-w-4xl mx-auto space-y-3">
          {orderForCalendar(tournaments).map((tournament, index) => {
            const bookable = isBookable(tournament);
            const finished = tournament.status === "finished";
            return (
              <Reveal key={tournament.id} delay={index * 0.05}>
                <li
                  className={cx(
                    cardTone(bookable ? "soft" : "default"),
                    "p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4",
                    finished && "opacity-60",
                  )}
                >
                  <div className="flex items-start gap-4 min-w-0">
                    {tournament.flag && (
                      <img
                        src={tournament.flag}
                        alt={tournament.flagAlt || tournament.location}
                        className="w-10 h-7 rounded-sm object-cover ring-1 ring-white/15 shrink-0 mt-0.5"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-1.5">
                        <h3 className="text-base md:text-lg font-semibold text-zinc-100">{tournament.name}</h3>
                        <StatusPill tournament={tournament} />
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-zinc-400 text-sm">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" aria-hidden />
                          {tournament.date}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" aria-hidden />
                          {tournament.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  {bookable && (
                    <LocalizedLink to="/rezervasyon" className={buttonClass("primary", "md", "shrink-0")}>
                      {t("home.tournaments.reserve")}
                      <ArrowRight className="w-4 h-4" aria-hidden />
                    </LocalizedLink>
                  )}
                </li>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
};

export default Tournaments;

import { useEffect, useState } from "react";
import {
  MapPin,
  Calendar,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Clock,
} from "lucide-react";
import SectionHeader from "./ui/SectionHeader";
import Reveal from "./ui/Reveal";
import api from "../lib/api";

type TournamentStatus = "finished" | "ongoing" | "upcoming";

interface Tournament {
  id: string;
  name: string;
  date: string;
  location: string;
  flag: string | null; // /flags/*.svg yolu (null = bayrak gösterilmez)
  flagAlt: string | null;
  status: TournamentStatus;
}

const StatusBadge = ({ status }: { status: TournamentStatus }) => {
  if (status === "ongoing") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] font-semibold uppercase tracking-wider">
        <span className="relative flex w-1.5 h-1.5">
          <span className="animate-ping absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </span>
        Aktif
      </span>
    );
  }

  if (status === "upcoming") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] font-semibold uppercase tracking-wider">
        <Clock className="w-3 h-3" />
        Yakında
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-700/40 border border-zinc-600/50 text-zinc-400 text-[10px] font-semibold uppercase tracking-wider">
      <CheckCircle2 className="w-3 h-3" />
      Tamamlandı
    </span>
  );
};

const Tournaments = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const { data } = await api.get("/api/tournaments");
        setTournaments(data);
      } catch (error) {
        console.error("Turnuvalar yüklenemedi:", error);
      }
    };
    fetchTournaments();
  }, []);

  // Yüklenene kadar / hiç turnuva yoksa bölümü tamamen gizle
  if (tournaments.length === 0) return null;

  return (
    <section id="tournament" className="relative py-24 bg-zinc-950">
      <div className="container mx-auto px-4">
        <SectionHeader
          eyebrow="Yaklaşan Etkinlikler"
          icon={CalendarCheck}
          title="Turnuva Takvimi"
          description="Katılacağımız yaklaşan turnuvalarda fotoğraf ve video çekimi için şimdiden yerinizi ayırtın."
          className="mb-16"
        />

        <div className="max-w-4xl mx-auto space-y-4">
          {tournaments.map((tournament, index) => {
            const isActive = tournament.status === "ongoing";
            return (
            <Reveal key={tournament.id} delay={index * 0.1}>
              <div
                className={`group relative rounded-2xl p-px bg-linear-to-r transition-all duration-500 ${
                  isActive
                    ? "from-emerald-500/70 via-emerald-400/50 to-emerald-500/70"
                    : "from-emerald-500/30 via-zinc-700/20 to-emerald-500/30 hover:from-emerald-500/60 hover:via-emerald-400/40 hover:to-emerald-500/60"
                }`}
              >
                <div
                  className={`relative bg-zinc-900/80 backdrop-blur-xl rounded-2xl p-5 md:p-6 shadow-lg overflow-hidden ${
                    isActive ? "ring-1 ring-emerald-400/40" : ""
                  }`}
                >
                  {/* glow — aktif turnuvada her zaman açık, diğerlerinde hover'da */}
                  <div
                    className={`absolute -inset-px rounded-2xl transition-opacity duration-500 pointer-events-none ${
                      isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl" />
                  </div>

                  <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3 md:gap-4">
                      {tournament.flag && (
                        <img
                          src={tournament.flag}
                          alt={tournament.flagAlt || tournament.location}
                          className="w-9 h-6 md:w-10 md:h-7 rounded-[3px] object-cover shadow-md ring-1 ring-white/15 shrink-0 mt-1"
                        />
                      )}
                      <div className="min-w-0">
                        <div className="flex flex-col-reverse items-start gap-1.5 mb-2 md:flex-row md:items-center md:gap-2">
                          <h3
                            className={`text-base md:text-lg font-bold leading-snug transition-colors ${
                              isActive
                                ? "text-emerald-400"
                                : "text-gray-100 group-hover:text-emerald-400"
                            }`}
                          >
                            {tournament.name}
                          </h3>
                          <StatusBadge status={tournament.status} />
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-gray-400 text-sm">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-emerald-500/70" />
                            {tournament.date}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-emerald-500/70" />
                            {tournament.location}
                          </div>
                        </div>
                      </div>
                    </div>

                    {tournament.status === "ongoing" && (
                      <a
                        href="/rezervasyon"
                        className="flex items-center justify-center md:justify-start gap-2 text-emerald-400 font-semibold hover:gap-4 transition-all whitespace-nowrap"
                      >
                        Rezervasyon Yap
                        <ArrowRight className="w-4 h-4" />
                      </a>
                    )}

                    {tournament.status === "upcoming" && (
                      <span className="flex items-center justify-center md:justify-start gap-2 text-amber-400/80 font-medium whitespace-nowrap">
                        <Clock className="w-4 h-4" />
                        Yakında
                      </span>
                    )}

                    {tournament.status === "finished" && (
                      <span className="flex items-center justify-center md:justify-start gap-2 text-zinc-500 font-medium whitespace-nowrap">
                        <CheckCircle2 className="w-4 h-4" />
                        Tamamlandı
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Tournaments;

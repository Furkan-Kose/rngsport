import { MapPin, Calendar, ArrowRight } from "lucide-react";

const tournaments = [
  {
    name: "International Ritmika Cup 2026",
    date: "27-28 Şubat - 1-2 Mart 2026",
    location: "İstanbul, Türkiye",
    flag: "🇹🇷",
    active: false,
  },
  {
    name: "IV. International Golden Ribbon Cup 2026",
    date: "18-21 Haziran 2026",
    location: "Lefkoşa, KKTC",
    flag: "🇹🇷",
    active: true,
  }
];

const Tournaments = () => {
  return (
    <section id="tournament" className="py-24 bg-black/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-emerald-500 font-semibold uppercase tracking-wider text-sm">
            Yaklaşan Etkinlikler
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold text-gray-200 mt-4 mb-6">
            Turnuva Takvimi
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Katılacağımız yaklaşan turnuvalarda fotoğraf ve video çekimi için
            şimdiden yerinizi ayırtın.
          </p>
        </div>

        {/* Tournaments List */}
        <div className="max-w-4xl mx-auto space-y-4">
          {tournaments.map((tournament, index) => (
            <div
              key={index}
              className="group bg-black/30 backdrop-blur-xl border border-white/10 shadow-lg rounded-2xl p-6 cursor-pointer"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left: Event Info */}
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{tournament.flag}</span>
                  <div>
                    <h3 className="text-lg font-bold text-gray-200 group-hover:text-emerald-500 transition-colors">
                      {tournament.name}
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-gray-400 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {tournament.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {tournament.location}
                      </div>
                    </div>
                  </div>
                </div>

                {tournament.active && (
                  <a
                    href="#packages"
                    className="flex items-center justify-center md:justify-start gap-2 text-emerald-500 font-semibold hover:gap-4 transition-all whitespace-nowrap"
                  >
                    Rezervasyon Yap
                    <ArrowRight className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Tournaments;

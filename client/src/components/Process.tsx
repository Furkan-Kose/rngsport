import SectionHeader from "./ui/SectionHeader";
import Reveal from "./ui/Reveal";

const steps = [
  {
    number: "01",
    title: "Rezervasyon ve Hesap",
    description:
      "Paketini seçip rezervasyonunu oluştur. E-posta adresin ve belirlediğin şifreyle hesabını aynı adımda kolayca aç.",
  },
  {
    number: "02",
    title: "Ödeme",
    description:
      "Ödemeni online olarak tamamlayabilir veya yarışma alanındaki ödeme seçeneklerinden yararlanabilirsin.",
  },
  {
    number: "03",
    title: "Performans ve Çekim",
    description:
      "Sıra sana geldiğinde ekibimiz hazır olur. Performansının en özel anlarını fotoğraf ve videolarla kaydederiz.",
  },
  {
    number: "04",
    title: "Düzenleme ve Hazırlık",
    description:
      "Çekimlerin ekibimiz tarafından seçilir, düzenlenir ve satın aldığın pakete göre hazırlanır.",
  },
  {
    number: "05",
    title: "Kişisel Galerin Hazır",
    description:
      "İçeriklerin hazır olduğunda sana e-posta ile haber veririz. Hesabına giriş yaparak kişisel galerindeki fotoğraf ve videolarına ulaşabilirsin.",
  },
];

const Process = () => {
  return (
    <section id="surec" className="relative py-24 bg-black overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <SectionHeader
          eyebrow="Süreç"
          title="Sipariş ve Teslimat Süreci"
          description="Online kayıttan dijital teslimata uzanan kesintisiz akış."
          className="mb-16"
        />

        {/* Desktop: zigzag timeline */}
        <div className="hidden md:block relative max-w-4xl mx-auto">
          {/* Central vertical guide line */}
          <div
            aria-hidden
            className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-px bg-linear-to-b from-transparent via-emerald-500/30 to-transparent"
          />

          <div className="space-y-12">
            {steps.map((step, index) => {
              const isLeft = index % 2 === 0;
              return (
                <Reveal key={index} delay={index * 0.08}>
                  <div
                    className={`relative flex items-center ${
                      isLeft ? "justify-start" : "justify-end"
                    }`}
                  >
                    {/* Central circle */}
                    <div className="absolute left-1/2 -translate-x-1/2 z-10">
                      <div className="relative w-20 h-20 group cursor-default">
                        {/* Rotating conic ring */}
                        <div className="absolute inset-0 rounded-full ring-conic animate-spin-slow opacity-70" />
                        {/* Inner solid */}
                        <div className="absolute inset-1 rounded-full bg-zinc-950 border-2 border-emerald-500/60 flex items-center justify-center group-hover:scale-110 group-hover:border-emerald-400 transition-all duration-300 shadow-[0_0_24px_-6px_rgba(16,185,129,0.6)]">
                          <span className="text-xl font-bold text-emerald-400">
                            {step.number}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card */}
                    <div
                      className={`w-[calc(50%-3rem)] ${
                        isLeft ? "pr-12 text-right" : "pl-12 text-left"
                      }`}
                    >
                      <div className="bg-zinc-900/60 backdrop-blur border border-zinc-800 hover:border-emerald-500/40 rounded-2xl p-5 transition-colors">
                        <h3 className="text-lg font-bold text-gray-100 mb-2">
                          {step.title}
                        </h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>

        {/* Mobile: stacked timeline */}
        <div className="md:hidden space-y-6 max-w-md mx-auto">
          {steps.map((step, index) => (
            <Reveal key={index} delay={index * 0.05}>
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="relative w-14 h-14 shrink-0">
                    <div className="absolute inset-0 rounded-full ring-conic animate-spin-slow opacity-60" />
                    <div className="absolute inset-0.5 rounded-full bg-zinc-950 border-2 border-emerald-500/60 flex items-center justify-center">
                      <span className="text-sm font-bold text-emerald-400">
                        {step.number}
                      </span>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-px flex-1 my-2 bg-linear-to-b from-emerald-500/40 to-transparent" />
                  )}
                </div>
                <div className="flex-1 pb-6">
                  <h3 className="text-base font-bold text-gray-100 mb-1.5">
                    {step.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Process;

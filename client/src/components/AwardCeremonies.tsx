import { Link } from "react-router";
import { ArrowRight, Award, Download, Images } from "lucide-react";
import SectionHeader from "./ui/SectionHeader";
import Reveal from "./ui/Reveal";

// Ana sayfadaki kısa tanıtım — galeriler /odul-torenleri sayfasında
const AwardCeremonies = () => (
  <section id="odul-torenleri" className="relative py-24 bg-black">
    <div className="container mx-auto px-4">
      <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
        <Reveal>
          <Link to="/odul-torenleri" className="group relative block">
            <div className="absolute -inset-4 bg-emerald-500/10 rounded-3xl blur-2xl" />
            <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
              <img
                src="/odul-torenleri.jpeg"
                alt="Baby Games ödül töreni"
                loading="lazy"
                className="w-full aspect-4/3 object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
            </div>
          </Link>
        </Reveal>

        <div>
          <SectionHeader
            eyebrow="Ödül Törenleri"
            icon={Award}
            title="Baby Games Ödül Töreni Fotoğrafları"
            align="left"
            className="mb-6"
          />
          <Reveal delay={0.1}>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Minik yıldızların kürsü heyecanına ortak olun! Baby Games ödül töreni
              fotoğrafları yarışma günü içerisinde yüklenecektir. Çocuğunuzun bu özel
              anlarına ait fotoğraflara ücretsiz olarak ulaşabilirsiniz.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <ul className="space-y-2 mb-8 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <Images className="w-4 h-4 text-emerald-400" />
                Her tören için ayrı galeri
              </li>
              <li className="flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-400" />
                Tek tek veya hepsini birden indirin
              </li>
            </ul>
          </Reveal>
          <Reveal delay={0.2}>
            <Link
              to="/odul-torenleri"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold transition-all duration-300 hover:gap-3"
            >
              Fotoğraflara Göz At
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Reveal>
        </div>
      </div>
    </div>
  </section>
);

export default AwardCeremonies;

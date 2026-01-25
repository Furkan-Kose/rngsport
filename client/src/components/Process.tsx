const steps = [
  {
    number: "01",
    title: "Online Ön Kayıt",
    description: "Fotoğraf veya video paketinizi seçin, rezervasyon formunu doldurarak talebinizi oluşturun.",
  },
  {
    number: "02",
    title: "Ödeme ve Çekim",
    description: "Yarışma günü standımıza gelerek ödemenizi tamamlayın. Siz sahnedeyken ekibimiz performansınızı kayıt altına alsın.",
  },
  {
    number: "03",
    title: "Düzenleme ve Kurgu",
    description: "Çekilen görüntüler teknik ekibimizce işlenir; fotoğraflar düzenlenir, videolar kurgu aşamasından geçer.",
  },
  {
    number: "04",
    title: "Dijital Teslimat",
    description: "Hazırlanan tüm dosyalar, yüksek kalitede ve dijital bağlantı (link) ile tarafınıza iletilir.",
  }
];

const Process = () => {
  return (
    <section id="process" className="py-24">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-fuchsia-500 font-semibold uppercase tracking-wider text-sm">Süreç</span>
          <h2 className="text-3xl sm:text-5xl font-bold text-gray-200 mt-4 mb-6">
            Sipariş ve Teslimat Süreci
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="relative text-center group">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-linear-to-r from-fuchsia-500/50 to-transparent" />
              )}
              
              {/* Number */}
              <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-linear-to-br from-fuchsia-500 to-fuchsia-700 mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-3xl font-bold text-white">{step.number}</span>
              </div>
              
              <h3 className="text-xl font-bold text-gray-200 mb-3">{step.title}</h3>
              <p className="text-gray-400">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Process;
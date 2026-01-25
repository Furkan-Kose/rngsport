import { useState, useEffect } from "react";
import { Calendar, ArrowLeft, User, Phone, Building, CalendarDays, MessageSquare, Loader2, Check, Trash2, Plus, Package as PackageIcon, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router";
import api from "../lib/api";
import { toast } from "react-toastify";

interface Package {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  features: string[];
  discounts: {
    2: number;
    3: number;
  };
  // Rezervasyon fiyatları (elden nakit için)
  reservationPrice: number;
  reservationDiscounts: {
    2: number;
    3: number;
  };
}

interface SelectedPackage {
  id: string;
  packageId: string;
  packageName: string;
  seriesCount: 1 | 2 | 3;
  quantity: number;
  price: number;
}

const ReservationPage = () => {
  const navigate = useNavigate();
  
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<SelectedPackage[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    athleteName: "",
    clubName: "",
    birthYear: "",
    customerPhone: "",
    customerEmail: "",
    notes: "",
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const { data } = await api.get('/api/packages');
      setPackages(data);
    } catch (error) {
      console.error('Failed to fetch packages:', error);
    } finally {
      setIsLoadingPackages(false);
    }
  };

  const addNewPackageRow = () => {
    const newId = `temp-${Date.now()}`;
    setSelectedPackages([...selectedPackages, {
      id: newId,
      packageId: "",
      packageName: "",
      seriesCount: 1,
      quantity: 1,
      price: 0,
    }]);
  };

  const removePackageRow = (id: string) => {
    setSelectedPackages(selectedPackages.filter(sp => sp.id !== id));
  };

  const updatePackageRow = (id: string, field: string, value: any) => {
    setSelectedPackages(selectedPackages.map(sp => {
      if (sp.id === id) {
        if (field === 'packageId') {
          const pkg = packages.find(p => p.id === value);
          if (pkg) {
            return {
              ...sp,
              packageId: value,
              packageName: pkg.name,
              price: pkg.reservationPrice, // Rezervasyon fiyatı kullan
            };
          }
        }
        if (field === 'seriesCount') {
          const pkg = packages.find(p => p.id === sp.packageId);
          if (pkg) {
            // Rezervasyon fiyatlarını kullan
            const price = value === 1 ? pkg.reservationPrice : pkg.reservationDiscounts[value as 2 | 3];
            return { ...sp, seriesCount: value, price };
          }
        }
        return { ...sp, [field]: value };
      }
      return sp;
    }));
  };

  const calculateTotal = () => {
    return selectedPackages.reduce((total, sp) => {
      return total + (sp.price * sp.quantity);
    }, 0);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    toast.dismiss();

    if (!form.athleteName.trim() || !form.clubName.trim() || !form.birthYear.trim() || !form.customerPhone.trim() || !form.customerEmail.trim()) {
      setError("Lütfen tüm zorunlu alanları doldurun");
      return;
    }

    if (!selectedPackages || selectedPackages.length === 0) {
      setError("Lütfen en az bir paket seçin");
      return;
    }

    // Paket seçimi kontrolü
    const invalidPackages = selectedPackages.filter(sp => !sp.packageId);
    if (invalidPackages.length > 0) {
      setError("Lütfen tüm satırlarda paket seçimi yapın");
      return;
    }
    
    setIsSubmitting(true);

    try {
      const { } = await api.post('/api/reservations', {
        ...form,
        items: selectedPackages.map((sp) => {
          const pkg = packages.find(p => p.id === sp.packageId);
          if (!pkg) {
            throw new Error(`Paket bulunamadı: ${sp.packageId}`);
          }
          return {
            package: {
              id: pkg.id,
              name: pkg.name,
              category: pkg.category,
              // Rezervasyon fiyatlarını gönder
              reservationPrice: pkg.reservationPrice,
              reservationDiscounts: pkg.reservationDiscounts,
            },
            seriesCount: sp.seriesCount,
            quantity: sp.quantity,
          };
        }),
        totalPrice: calculateTotal(),
      });

      // Başarılı
      setSuccess(true);
      toast.success("Rezervasyon başarıyla oluşturuldu!");
      
      // 5 saniye sonra ana sayfaya yönlendir
      setTimeout(() => {
        navigate('/');
      }, 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Bir hata oluştu");
      toast.error(err.response?.data?.message || "Bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Rezervasyon Başarılı!</h2>
          <p className="text-zinc-400 mb-4">
            Rezervasyonunuz alınmıştır. En kısa sürede sizinle iletişime geçeceğiz.
          </p>
          <p className="text-sm text-zinc-500">Ana sayfaya yönlendiriliyorsunuz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-28 pb-16">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-fuchsia-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10 max-w-6xl">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/" className="flex items-center gap-2 text-zinc-400 hover:text-violet-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Ana Sayfa</span>
          </Link>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center">
            <Calendar className="w-7 h-7 text-zinc-300" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Rezervasyon Formu</h1>
            <p className="text-zinc-500 text-sm">Paketleri seçin ve bilgilerinizi girin</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Paket Seçimi */}
          <div className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Paket Seçimi</h2>
              <button
                type="button"
                onClick={addNewPackageRow}
                className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Paket Ekle
              </button>
            </div>
            
            {isLoadingPackages ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {selectedPackages.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500">
                    <PackageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Henüz paket eklenmedi. "Paket Ekle" butonuna tıklayın.</p>
                  </div>
                ) : (
                  selectedPackages.map((sp) => {
                    const selectedPkg = packages.find(p => p.id === sp.packageId);
                    return (
                      <div key={sp.id} className="grid md:grid-cols-12 gap-3 p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                        {/* Paket Seçimi */}
                        <div className="md:col-span-4">
                          <label className="text-xs text-zinc-500 mb-1 block">Paket</label>
                          <select
                            value={sp.packageId}
                            onChange={(e) => updatePackageRow(sp.id, 'packageId', e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500 transition-colors"
                          >
                            <option value="">Paket Seçin</option>
                            {packages.map((pkg) => (
                              <option key={pkg.id} value={pkg.id}>
                                {pkg.name} - ₺{pkg.reservationPrice.toLocaleString("tr-TR")}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Seri Sayısı */}
                        <div className="md:col-span-3">
                          <label className="text-xs text-zinc-500 mb-1 block">Seri Sayısı</label>
                          <select
                            value={sp.seriesCount}
                            onChange={(e) => updatePackageRow(sp.id, 'seriesCount', Number(e.target.value))}
                            disabled={!sp.packageId}
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value={1}>1 Seri - ₺{(selectedPkg?.reservationPrice || 0).toLocaleString("tr-TR")}</option>
                            <option value={2}>2 Seri - ₺{(selectedPkg?.reservationDiscounts?.[2] || 0).toLocaleString("tr-TR")}</option>
                            <option value={3}>3 Seri - ₺{(selectedPkg?.reservationDiscounts?.[3] || 0).toLocaleString("tr-TR")}</option>
                          </select>
                        </div>

                        {/* Adet */}
                        <div className="md:col-span-2">
                          <label className="text-xs text-zinc-500 mb-1 block">Adet</label>
                          <input
                            type="number"
                            min="1"
                            value={sp.quantity}
                            onChange={(e) => updatePackageRow(sp.id, 'quantity', Number(e.target.value))}
                            disabled={!sp.packageId}
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>

                        {/* Toplam */}
                        <div className="md:col-span-2 flex flex-col justify-end">
                          <label className="text-xs text-zinc-500 mb-1 block">Toplam</label>
                          <div className="text-base font-bold text-violet-400">
                            ₺{(sp.price * sp.quantity).toLocaleString("tr-TR")}
                          </div>
                        </div>

                        {/* Sil */}
                        <div className="md:col-span-1 flex items-end justify-end">
                          <button
                            type="button"
                            onClick={() => removePackageRow(sp.id)}
                            className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Sporcu Bilgileri */}
          <div className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Sporcu Bilgileri</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                  <User className="w-4 h-4" />
                  Sporcu Adı Soyadı <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="athleteName"
                  value={form.athleteName}
                  onChange={handleChange}
                  placeholder="Sporcu adı soyadı"
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                  <Building className="w-4 h-4" />
                  Kulüp / Şube <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="clubName"
                  value={form.clubName}
                  onChange={handleChange}
                  placeholder="Kulüp veya şube adı"
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                  <CalendarDays className="w-4 h-4" />
                  Sporcu Doğum Yılı <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="birthYear"
                  value={form.birthYear}
                  onChange={handleChange}
                  placeholder="Örn: 2015"
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                  <Phone className="w-4 h-4" />
                  İletişim için Telefon <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  name="customerPhone"
                  value={form.customerPhone}
                  onChange={handleChange}
                  placeholder="0532 123 45 67"
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                  <Mail className="w-4 h-4" />
                  E-posta Adresi <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  name="customerEmail"
                  value={form.customerEmail}
                  onChange={handleChange}
                  placeholder="ornek@gmail.com"
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                  <MessageSquare className="w-4 h-4" />
                  Çekim istenen Seri/Alet: <span className="text-zinc-600"></span>
                </label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Serbest seri, Kurdele, Labut vb."
                  rows={3}
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* Özet ve Gönder */}
          <div className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Toplam Tutar</h3>
                <p className="text-sm text-zinc-500">{selectedPackages.length} paket seçildi</p>
              </div>
              <div className="text-3xl font-bold bg-linear-to-r from-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
                ₺{calculateTotal().toLocaleString("tr-TR")}
              </div>
            </div>

            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-xs text-amber-400 text-center">
                💡 Rezervasyonunuzu şimdi tamamlayın; ödeme işlemini yarışma günü alandaki standımızda gerçekleştirin."
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || selectedPackages.length === 0}
              className="w-full py-4 px-6 bg-linear-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  İşleniyor...
                </>
              ) : (
                <>
                  <Calendar className="w-5 h-5" />
                  Rezervasyonu Onayla
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReservationPage;

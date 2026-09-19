import { useEffect, useState, type FormEvent } from 'react';
import { Loader2, Save, X } from 'lucide-react';
import api from '../../lib/api';

export interface CustomerUser {
  id: string;
  /** Sporcu adı soyadı */
  name: string | null;
  clubName: string | null;
  birthYear: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
  emailVerified: boolean;
  /** false = hesap sipariş/rezervasyonla otomatik açıldı, müşteri henüz şifre belirlemedi */
  hasPassword: boolean;
}

interface Props {
  open: boolean;
  /** null = yeni müşteri, dolu = düzenleme */
  customer: CustomerUser | null;
  onClose: () => void;
  onSaved: () => void;
}

const errorMessage = (err: unknown) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
  'Bir hata oluştu';

const inputClass =
  'w-full px-3 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-amber-500';

const CustomerFormModal = ({ open, customer, onClose, onSaved }: Props) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [clubName, setClubName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(customer?.name ?? '');
    setEmail(customer?.email ?? '');
    setPhone(customer?.phone ?? '');
    setClubName(customer?.clubName ?? '');
    setBirthYear(customer?.birthYear ?? '');
    setPassword('');
    setError('');
  }, [open, customer]);

  if (!open) return null;

  const isEdit = !!customer;
  const emailChanged = isEdit && email.trim().toLowerCase() !== (customer.email ?? '');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      // Boş şifre hiç gönderilmez: düzenlemede "değiştirme", eklemede "şifresiz aç"
      const payload = { name, email, phone, clubName, birthYear, ...(password ? { password } : {}) };
      if (isEdit) {
        await api.patch(`/api/users/${customer.id}`, payload);
      } else {
        await api.post('/api/users', payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="p-5 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            {isEdit ? 'Müşteriyi Düzenle' : 'Müşteri Ekle'}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Sporcu Adı Soyadı</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">E-posta</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@eposta.com"
              required
              className={inputClass}
            />
            <p className="text-[11px] text-gray-500 mt-1">
              {emailChanged
                ? 'Adres değiştiği için e-posta doğrulaması sıfırlanacak.'
                : 'Müşteri bu adresle giriş yapar; fotoğrafları bu hesaba yüklenir.'}
            </p>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Kulüp</label>
            <input
              type="text"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              placeholder="Kulüp adı"
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Doğum Yılı</label>
            <input
              type="text"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              placeholder="2011"
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Telefon</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05XX XXX XX XX"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="customer-password" className="text-xs text-gray-400 mb-1 block">
              {isEdit ? 'Yeni Şifre' : 'Şifre'}
            </label>
            <input
              type="password"
              id="customer-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={
                isEdit
                  ? 'Değiştirmek istemiyorsanız boş bırakın'
                  : 'Boş bırakılırsa müşteri kendisi belirler'
              }
              autoComplete="new-password"
              minLength={8}
              className={inputClass}
            />
            <p className="text-[11px] text-gray-500 mt-1">En az 8 karakter.</p>
          </div>

          {!isEdit && (
            <p className="text-[11px] text-gray-500">
              Şifre boş bırakılırsa hesap şifresiz açılır; müşteriyi detay sayfasındaki
              "Şifre linki gönder" ile davet edebilirsiniz.
            </p>
          )}
        </div>

        <div className="p-5 border-t border-gray-700 flex flex-col sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            Vazgeç
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isEdit ? 'Kaydet' : 'Oluştur'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerFormModal;

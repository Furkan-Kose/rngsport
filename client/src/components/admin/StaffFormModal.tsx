import { useEffect, useState, type FormEvent } from 'react';
import { Loader2, Save, X } from 'lucide-react';
import api from '../../lib/api';
import { ROLES, roleLabel } from '../../lib/roles';

export interface StaffUser {
  id: string;
  username: string | null;
  name: string | null;
  role: string;
  createdAt: string;
}

interface Props {
  open: boolean;
  /** null = yeni personel, dolu = düzenleme */
  staff: StaffUser | null;
  onClose: () => void;
  onSaved: () => void;
}

const STAFF_ROLE_OPTIONS = [ROLES.PHOTOGRAPHER, ROLES.VIDEOGRAPHER];

const errorMessage = (err: unknown) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
  'Bir hata oluştu';

const StaffFormModal = ({ open, staff, onClose, onSaved }: Props) => {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<string>(ROLES.PHOTOGRAPHER);
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setUsername(staff?.username ?? '');
    setName(staff?.name ?? '');
    setRole(staff?.role ?? ROLES.PHOTOGRAPHER);
    setPassword('');
    setError('');
  }, [open, staff]);

  if (!open) return null;

  const isEdit = !!staff;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      if (isEdit) {
        await api.patch(`/api/users/staff/${staff.id}`, {
          username,
          name,
          role,
          // Boş şifre = değiştirme
          ...(password ? { password } : {}),
        });
      } else {
        await api.post('/api/users/staff', { username, name, role, password });
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
            {isEdit ? 'Personeli Düzenle' : 'Personel Ekle'}
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
            <label className="text-xs text-gray-400 mb-1 block">Kullanıcı Adı</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ornek.fotografci"
              required
              className="w-full px-3 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-amber-500"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Küçük harf, rakam, nokta, tire ve alt çizgi; 3-30 karakter. Girişte bu ad kullanılır.
            </p>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Ad Soyad</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Görev</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
            >
              {STAFF_ROLE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {roleLabel(option)}
                </option>
              ))}
            </select>
            {isEdit && (
              <p className="text-[11px] text-gray-500 mt-1">
                Görev değişikliği, kullanıcı yeniden giriş yaptığında geçerli olur.
              </p>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">
              {isEdit ? 'Yeni Şifre' : 'Şifre'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEdit ? 'Değiştirmek istemiyorsanız boş bırakın' : '••••••••'}
              required={!isEdit}
              className="w-full px-3 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-amber-500"
            />
            <p className="text-[11px] text-gray-500 mt-1">En az 8 karakter.</p>
          </div>
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

export default StaffFormModal;

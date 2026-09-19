import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import {
  ArrowLeft,
  Calendar,
  Images,
  KeyRound,
  Loader2,
  Mail,
  Package,
  Pencil,
  Phone,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import api from '../../lib/api';
import StatusBadge from '../../lib/orderStatus';
import CustomerFormModal, { type CustomerUser } from '../../components/admin/CustomerFormModal';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';

/** Ham OrderItem / ReservationItem satırı (backend include: { items: true }) */
interface RecordItem {
  packageId: string;
  packageName: string;
  category: string;
  seriesCount: number;
  quantity: number;
  price: number;
  apparatuses: string[];
}

interface CustomerRecord {
  id: string;
  athleteName: string;
  clubName: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  items: RecordItem[];
}

interface CustomerDetail extends CustomerUser {
  role: string;
  albums: (string | null)[];
  orders: CustomerRecord[];
  reservations: CustomerRecord[];
  _count: { photos: number; reservations: number; orders: number };
}

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));

const errorMessage = (err: unknown) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
  'Bir hata oluştu';

const Badge = ({ tone, children }: { tone: 'amber' | 'red' | 'green'; children: string }) => {
  const tones = {
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    red: 'bg-red-500/10 text-red-400 border-red-500/30',
    green: 'bg-green-500/10 text-green-400 border-green-500/30',
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${tones[tone]}`}>
      {children}
    </span>
  );
};

const RecordList = ({ title, records }: { title: string; records: CustomerRecord[] }) => (
  <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-5">
    <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
      <Calendar className="w-4 h-4 text-amber-500" />
      {title} ({records.length})
    </h2>

    {records.length === 0 ? (
      <p className="text-sm text-gray-500">Kayıt yok.</p>
    ) : (
      <div className="space-y-3">
        {records.map((r) => (
          <div key={r.id} className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4">
            <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
              <div>
                <p className="text-white font-medium">{r.athleteName}</p>
                <p className="text-sm text-gray-500">{r.clubName}</p>
              </div>
              <div className="text-right">
                <StatusBadge status={r.status} />
                <p className="text-sm text-gray-300 mt-1">
                  ₺{r.totalPrice.toLocaleString('tr-TR')}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {r.items.map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 text-xs text-gray-400 bg-gray-800 border border-gray-700 px-2 py-1 rounded-lg"
                >
                  <Package className="w-3 h-3 text-amber-500/70" />
                  {item.packageName} × {item.quantity} ({item.seriesCount} seri)
                </span>
              ))}
            </div>

            <p className="text-xs text-gray-600 mt-2">{formatDate(r.createdAt)}</p>
          </div>
        ))}
      </div>
    )}
  </div>
);

const UserDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<CustomerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSendingLink, setIsSendingLink] = useState(false);

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get(`/api/users/${id}`);
      setUser(data.user);
    } catch (error) {
      console.error('User fetch error:', error);
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { data } = await api.delete(`/api/users/${id}`);
      toast.success(
        data.deletedPhotos
          ? `Müşteri silindi (${data.deletedPhotos} dosya kaldırıldı)`
          : 'Müşteri silindi',
      );
      navigate('/admin/users');
    } catch (err) {
      toast.error(errorMessage(err));
      setIsDeleting(false);
      setConfirmOpen(false);
    }
  };

  const handleSendLink = async () => {
    setIsSendingLink(true);
    try {
      const { data } = await api.post(`/api/users/${id}/set-password-link`);
      toast.success(data.message);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setIsSendingLink(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (notFound || !user) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Link
          to="/admin/users"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Kullanıcılara Dön
        </Link>
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-12 text-center">
          <p className="text-gray-400">Kullanıcı bulunamadı.</p>
        </div>
      </div>
    );
  }

  const albums = user.albums.filter(Boolean) as string[];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Link
        to="/admin/users"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Kullanıcılara Dön
      </Link>

      {/* Profil kartı */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-5 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <UserIcon className="w-6 h-6 text-amber-500" />
              {user.name || 'İsimsiz müşteri'}
            </h1>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              {user.hasPassword ? (
                <Badge tone="green">Şifre belirlendi</Badge>
              ) : (
                <Badge tone="amber">Şifre belirlenmedi</Badge>
              )}
              {user.emailVerified ? (
                <Badge tone="green">E-posta doğrulandı</Badge>
              ) : (
                <Badge tone="red">E-posta doğrulanmadı</Badge>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 mt-4 text-sm">
              <p className="flex items-center gap-2 text-gray-300">
                <Mail className="w-4 h-4 text-gray-500" />
                {user.email || '-'}
              </p>
              <p className="flex items-center gap-2 text-gray-300">
                <Phone className="w-4 h-4 text-gray-500" />
                {user.phone || '-'}
              </p>
              <p className="flex items-center gap-2 text-gray-400">
                <Calendar className="w-4 h-4 text-gray-500" />
                Kayıt: {formatDate(user.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-700/50 hover:bg-gray-700 border border-gray-600 text-gray-200 text-sm font-medium transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Düzenle
            </button>
            <button
              type="button"
              onClick={handleSendLink}
              disabled={isSendingLink || !user.email}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-700/50 hover:bg-gray-700 border border-gray-600 text-gray-200 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isSendingLink ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <KeyRound className="w-4 h-4" />
              )}
              {user.hasPassword ? 'Şifre sıfırlama linki' : 'Şifre linki gönder'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Sil
            </button>
          </div>
        </div>
      </div>

      {/* Galeri özeti */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-5 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Images className="w-4 h-4 text-amber-500" />
            Galeri
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            {user._count.photos} dosya
            {albums.length > 0 && ` · ${albums.length} albüm: ${albums.join(', ')}`}
          </p>
        </div>
        <Link
          to={`/admin/users/${user.id}/galeri`}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-medium transition-colors"
        >
          <Images className="w-4 h-4" />
          Galeriyi Yönet
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RecordList title="Rezervasyonlar" records={user.reservations} />
        <RecordList title="Siparişler" records={user.orders} />
      </div>

      <CustomerFormModal
        open={modalOpen}
        customer={user}
        onClose={() => setModalOpen(false)}
        onSaved={fetchUser}
      />

      <ConfirmDeleteModal
        open={confirmOpen}
        title="Müşteriyi Sil"
        isDeleting={isDeleting}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        message={
          <>
            <strong className="text-white">{user.name || user.email}</strong> hesabı silinecek.
            {user._count.photos > 0 && (
              <>
                {' '}
                Galerisindeki <strong className="text-red-400">{user._count.photos} dosya
                kalıcı olarak</strong> silinecek.
              </>
            )}{' '}
            Sipariş ve rezervasyon kayıtları durur, ancak hesapla bağları kopar. Bu işlem geri
            alınamaz.
          </>
        }
      />
    </div>
  );
};

export default UserDetailPage;

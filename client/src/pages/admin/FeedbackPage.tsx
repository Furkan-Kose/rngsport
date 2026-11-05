import { useCallback, useEffect, useState } from 'react';
import { Check, MessageSquare, Star, Trash2, Undo2 } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../lib/api';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import { Button, EmptyState, FilterTabs, PageHeader, SkeletonRows, Toolbar } from '../../components/admin/ui';
import { useUrlState } from '../../hooks/useUrlState';

interface Feedback {
  id: string;
  rating: number | null;
  message: string;
  page: string;
  locale: string;
  isRead: boolean;
  createdAt: string;
  user: { id: string; name: string | null; email: string | null } | null;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const LOCALE_LABEL: Record<string, string> = { tr: 'TR', en: 'EN', ru: 'RU' };

// Admin: Galerim'deki "Görüşlerinizi bildirin" formundan gelen mesajlar
const FeedbackPage = () => {
  const [items, setItems] = useState<Feedback[]>([]);
  const [unread, setUnread] = useState(0);
  const [total, setTotal] = useState(0);
  // Sekme adres çubuğunda (?tab=unread)
  const [url, setUrl] = useUrlState({ tab: 'all' });
  const onlyUnread = url.tab === 'unread';
  const setOnlyUnread = (value: boolean) => setUrl({ tab: value ? 'unread' : 'all' });
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState<Feedback | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async (unreadOnly: boolean) => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/feedback', { params: unreadOnly ? { unread: 1 } : {} });
      setItems(data.data);
      setUnread(data.unread);
      setTotal(data.total);
    } catch {
      toast.error('Görüşler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(onlyUnread);
  }, [load, onlyUnread]);

  const toggleRead = async (f: Feedback) => {
    try {
      await api.patch(`/api/feedback/${f.id}`, { isRead: !f.isRead });
      setItems((prev) => prev.map((x) => (x.id === f.id ? { ...x, isRead: !f.isRead } : x)));
      setUnread((n) => n + (f.isRead ? 1 : -1));
    } catch {
      toast.error('Güncellenemedi');
    }
  };

  const remove = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/api/feedback/${toDelete.id}`);
      setItems((prev) => prev.filter((x) => x.id !== toDelete.id));
      if (!toDelete.isRead) setUnread((n) => n - 1);
      setTotal((n) => n - 1);
      setToDelete(null);
    } catch {
      toast.error('Silinemedi');
    } finally {
      setDeleting(false);
    }
  };

  const rated = items.filter((f) => f.rating);
  const average = rated.length ? rated.reduce((s, f) => s + (f.rating ?? 0), 0) / rated.length : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Görüşler"
        icon={MessageSquare}
        description={
          <>
            Galerim sayfasının altındaki formdan gelen mesajlar
            {unread > 0 && <span className="ml-2 text-amber-400">· {unread} okunmamış</span>}
            {average !== null && <span className="ml-2">· Ortalama ★ {average.toFixed(1)}</span>}
          </>
        }
      />

      <Toolbar>
        <FilterTabs
          tabs={[
            { key: 'all', label: 'Tümü', count: total },
            { key: 'unread', label: 'Okunmamış', count: unread },
          ]}
          value={onlyUnread ? 'unread' : 'all'}
          onChange={(key) => setOnlyUnread(key === 'unread')}
        />
      </Toolbar>

      {loading ? (
        <SkeletonRows rows={4} />
      ) : items.length === 0 ? (
        <EmptyState icon={MessageSquare} title={onlyUnread ? 'Okunmamış görüş yok' : 'Henüz görüş yok'} />
      ) : (
        <div className="space-y-3">
          {items.map((f) => (
            <div
              key={f.id}
              className={`bg-gray-800/50 border rounded-xl p-4 sm:p-5 ${f.isRead ? 'border-gray-700' : 'border-amber-500/50'}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <p className="text-white font-medium">
                    {f.user?.name || 'İsimsiz'}
                    {!f.isRead && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">Yeni</span>}
                  </p>
                  <p className="text-gray-500 text-xs break-all">
                    {f.user?.email || 'Hesap silinmiş'} · {formatDate(f.createdAt)} · {LOCALE_LABEL[f.locale] ?? f.locale}
                  </p>
                </div>
                {f.rating && (
                  <div className="flex gap-0.5" aria-label={`${f.rating} yıldız`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={`w-4 h-4 ${n <= f.rating! ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}`} />
                    ))}
                  </div>
                )}
              </div>
              <p className="text-gray-200 text-sm whitespace-pre-wrap break-words">{f.message}</p>
              <div className="flex gap-2 mt-4">
                <Button size="sm" icon={f.isRead ? Undo2 : Check} onClick={() => toggleRead(f)}>
                  {f.isRead ? 'Okunmadı yap' : 'Okundu'}
                </Button>
                <Button size="sm" variant="danger" icon={Trash2} onClick={() => setToDelete(f)}>
                  Sil
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDeleteModal
        open={!!toDelete}
        title="Görüş silinsin mi?"
        message="Bu görüş kalıcı olarak silinecek. Bu işlem geri alınamaz."
        isDeleting={deleting}
        onConfirm={remove}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
};

export default FeedbackPage;

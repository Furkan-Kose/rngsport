import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Copy, Loader2, Save, Search, Trash2, Truck, X } from 'lucide-react';
import api from '../../lib/api';
import { formatTL } from '../../lib/loyalty';
import { SHOP_STATUS_CLASSES, type ShopOrder, type ShopStatus } from '../../lib/shop';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import { getApparatusLabel } from '../../constants/apparatuses';

interface AdminShopOrder extends ShopOrder {
  adminNote: string | null;
  paymentId: string | null;
  locale: string;
  user: { id: string; name: string | null; email: string | null } | null;
}

const STATUS_LABELS: Record<ShopStatus, string> = {
  PENDING: 'Ödeme bekleniyor',
  FAILED: 'Ödeme başarısız',
  CONFIRMED: 'Onaylandı',
  IN_PRODUCTION: 'Hazırlanıyor',
  SHIPPED: 'Kargoda',
  DELIVERED: 'Teslim edildi',
  CANCELLED: 'İptal',
};

// Sekme → sunucudaki status filtresi
const TABS: { key: string; label: string; statuses: ShopStatus[] }[] = [
  { key: 'paid', label: 'Aktif siparişler', statuses: ['CONFIRMED', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED'] },
  { key: 'CONFIRMED', label: 'Yeni', statuses: ['CONFIRMED'] },
  { key: 'IN_PRODUCTION', label: 'Hazırlanıyor', statuses: ['IN_PRODUCTION'] },
  { key: 'SHIPPED', label: 'Kargoda', statuses: ['SHIPPED'] },
  { key: 'DELIVERED', label: 'Teslim edildi', statuses: ['DELIVERED'] },
  { key: 'unpaid', label: 'Ödenmemiş', statuses: ['PENDING', 'FAILED'] },
  { key: 'CANCELLED', label: 'İptal', statuses: ['CANCELLED'] },
  { key: 'all', label: 'Tümü', statuses: [] },
];

const StatusBadge = ({ status }: { status: ShopStatus }) => (
  <span className={`px-2 py-0.5 rounded-md text-xs font-medium border whitespace-nowrap ${SHOP_STATUS_CLASSES[status]}`}>
    {STATUS_LABELS[status]}
  </span>
);

const selectionText = (o: ShopOrder) =>
  o.selection ? `${getApparatusLabel(o.selection.apparatus)} · Poz ${o.selection.poseNo}` : '';

const formatDateTime = (value: string | null) =>
  value ? new Date(value).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const copy = (text: string) =>
  navigator.clipboard.writeText(text).then(
    () => toast.success('Kopyalandı'),
    () => toast.error('Kopyalanamadı')
  );

const inputClass =
  'w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-amber-500';

const ShopOrdersPage = () => {
  const [tab, setTab] = useState('paid');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<AdminShopOrder[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminShopOrder | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: tab, page: String(page), limit: '20' });
      if (query) params.set('search', query);
      const { data } = await api.get(`/api/shop/admin/orders?${params}`);
      setOrders(data.data);
      setCounts(data.counts);
      setTotalPages(Math.max(1, data.pagination.totalPages));
    } catch (err) {
      console.error('Ürün siparişleri yüklenemedi:', err);
      toast.error('Siparişler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [tab, page, query]);

  useEffect(() => {
    load();
  }, [load]);

  const tabCount = (t: (typeof TABS)[number]) =>
    t.statuses.length ? t.statuses.reduce((sum, s) => sum + (counts[s] ?? 0), 0) : Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Truck className="w-7 h-7 text-amber-500" />
          Ürün Siparişleri
        </h1>
        <p className="text-gray-400 mt-1 text-sm">
          Kişiye özel ürün siparişleri. Durumu buradan güncelleyin; müşteri profilinden görür. "Kargoda" ve "Teslim edildi"de müşteriye mail gider.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              tab === t.key ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:text-gray-200'
            }`}
          >
            {t.label} <span className="opacity-70">({tabCount(t)})</span>
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(search.trim());
          setPage(1);
        }}
        className="relative mb-4 max-w-md"
      >
        <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Alıcı, telefon, e-posta, ürün, il ara..." className={`${inputClass} pl-9`} />
      </form>

      <div className="bg-gray-800/50 border border-gray-700 rounded-2xl overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <p className="text-center text-gray-400 py-16">Sipariş yok</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-700">
                <th className="px-4 py-3 font-medium">Tarih</th>
                <th className="px-4 py-3 font-medium">Ürün</th>
                <th className="px-4 py-3 font-medium">Alıcı</th>
                <th className="px-4 py-3 font-medium">İl</th>
                <th className="px-4 py-3 font-medium">Tutar</th>
                <th className="px-4 py-3 font-medium">Durum</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} onClick={() => setSelected(o)} className="border-b border-gray-700/50 hover:bg-gray-700/30 cursor-pointer">
                  <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{formatDateTime(o.paidAt ?? o.createdAt)}</td>
                  <td className="px-4 py-3 text-white">
                    {o.productName}
                    {o.quantity > 1 && <span className="text-gray-400"> × {o.quantity}</span>}
                    {o.selection && <div className="text-xs text-amber-300">{selectionText(o)}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-200">
                    {o.recipientName}
                    <div className="text-xs text-gray-500">{o.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{o.city}</td>
                  <td className="px-4 py-3 text-gray-200 whitespace-nowrap">{formatTL(o.totalPrice)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4 text-sm">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 disabled:opacity-40">
            Önceki
          </button>
          <span className="text-gray-400">
            {page} / {totalPages}
          </span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 disabled:opacity-40">
            Sonraki
          </button>
        </div>
      )}

      {selected && (
        <OrderDetail
          order={selected}
          onClose={() => setSelected(null)}
          onSaved={(updated) => {
            setSelected(updated);
            load();
          }}
          onDeleted={() => {
            setSelected(null);
            load();
          }}
        />
      )}
    </div>
  );
};

const OrderDetail = ({
  order,
  onClose,
  onSaved,
  onDeleted,
}: {
  order: AdminShopOrder;
  onClose: () => void;
  onSaved: (o: AdminShopOrder) => void;
  onDeleted: () => void;
}) => {
  const [status, setStatus] = useState<ShopStatus>(order.status);
  const [trackingInfo, setTrackingInfo] = useState(order.trackingInfo ?? '');
  const [adminNote, setAdminNote] = useState(order.adminNote ?? '');
  const [notify, setNotify] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const unpaid = order.status === 'PENDING' || order.status === 'FAILED';
  const mailOnSave = notify && status !== order.status && (status === 'SHIPPED' || status === 'DELIVERED');

  const addressText = `${order.recipientName}\n${order.phone}\n${order.address}\n${order.district} / ${order.city}${order.postalCode ? ` ${order.postalCode}` : ''}`;
  const personalization = Object.entries(order.personalization || {});

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch(`/api/shop/admin/orders/${order.id}`, {
        ...(status !== order.status && { status }),
        trackingInfo,
        adminNote,
        notify,
      });
      toast.success(mailOnSave ? 'Kaydedildi, müşteriye mail gönderildi' : 'Kaydedildi');
      onSaved(data.order);
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(message || 'Kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/shop/admin/orders/${order.id}`);
      toast.success('Sipariş silindi');
      onDeleted();
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(message || 'Silinemedi');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-2xl my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {order.productName}
              {order.quantity > 1 && <span className="text-gray-400"> × {order.quantity}</span>}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {order.id} · {formatTL(order.totalPrice)} · sipariş {formatDateTime(order.createdAt)} · ödeme {formatDateTime(order.paidAt)}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {order.selection && (
            <div className="flex items-center gap-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
              {order.selection.poseImage && (
                <a href={order.selection.poseImage} target="_blank" rel="noreferrer" title="Büyük aç">
                  <img src={order.selection.poseImage} alt="" className="w-20 h-28 object-cover rounded-lg border border-gray-600" />
                </a>
              )}
              <div>
                <p className="text-xs text-amber-300/80 uppercase tracking-wide">Müşterinin seçimi</p>
                <p className="text-lg font-semibold text-white">{selectionText(order)}</p>
                {order.selection.poseLabel && <p className="text-sm text-gray-300">{order.selection.poseLabel}</p>}
              </div>
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-gray-900/40 border border-gray-700 rounded-xl p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Kişiselleştirme</h3>
              {personalization.length === 0 ? (
                <p className="text-sm text-gray-500">—</p>
              ) : (
                <dl className="space-y-2">
                  {personalization.map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-xs text-gray-500">{order.fieldLabels?.[key] || key}</dt>
                      <dd className="text-sm text-white break-words whitespace-pre-line flex items-start gap-2">
                        <span className="flex-1">{value}</span>
                        <button onClick={() => copy(value)} className="text-gray-500 hover:text-amber-400" title="Kopyala">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
            <div className="bg-gray-900/40 border border-gray-700 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-300">Teslimat adresi</h3>
                <button onClick={() => copy(addressText)} className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300">
                  <Copy className="w-3.5 h-3.5" /> Kopyala
                </button>
              </div>
              <p className="text-sm text-white whitespace-pre-line break-words">{addressText}</p>
              {order.customerNote && <p className="text-sm text-gray-400 italic mt-2">Not: {order.customerNote}</p>}
              <p className="text-xs text-gray-500 mt-3">
                Hesap: {order.user?.name ?? '—'} · {order.user?.email ?? 'hesap silinmiş'}
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Durum</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as ShopStatus)} className={inputClass}>
                {(Object.keys(STATUS_LABELS) as ShopStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
              {unpaid && status !== order.status && ['CONFIRMED', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED'].includes(status) && (
                <p className="text-xs text-amber-400 mt-1">Ödenmemiş sipariş elle "ödendi" sayılacak (ör. havale ile ödendiyse).</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Kargo bilgisi (müşteri görür)</label>
              <input value={trackingInfo} onChange={(e) => setTrackingInfo(e.target.value)} placeholder="Örn. Yurtiçi Kargo · 123456789" maxLength={300} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Admin notu (müşteri görmez)</label>
            <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={2} maxLength={2000} className={inputClass} />
          </div>
          {(status === 'SHIPPED' || status === 'DELIVERED') && status !== order.status && (
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="accent-amber-500" />
              Müşteriye "{STATUS_LABELS[status]}" maili gönder
            </label>
          )}
          {order.paymentId && <p className="text-xs text-gray-500">iyzico ödeme no: {order.paymentId} (iade iyzico panelinden yapılır)</p>}
        </div>

        <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-t border-gray-700">
          {unpaid && (
            <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-sm text-red-400">
              <Trash2 className="w-4 h-4" /> Sil
            </button>
          )}
          <div className="flex-1" />
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm">
            Kapat
          </button>
          <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Kaydet
          </button>
        </div>
      </div>

      <ConfirmDeleteModal
        open={confirmDelete}
        title="Sipariş silinsin mi?"
        message="Bu sipariş hiç ödenmedi. Kalıcı olarak silinecek."
        isDeleting={deleting}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
};

export default ShopOrdersPage;

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Copy, Eye, FileSpreadsheet, Pencil, Save, Trash2, Truck, X } from 'lucide-react';
import api from '../../lib/api';
import { useUrlState } from '../../hooks/useUrlState';
import PhoneLinks from '../../components/admin/PhoneLinks';
import ExportModal from '../../components/admin/ExportModal';
import { formatTL } from '../../lib/loyalty';
import { SHOP_STATUS_LABELS as STATUS_LABELS, isUnpaid, type ShippingInput, type ShopOrder, type ShopStatus } from '../../lib/shop';
import ShopStatusBadge from '../../components/admin/ShopStatusBadge';
import {
  Button,
  EmptyState,
  IconButton,
  FilterTabs,
  SkeletonRows,
  SortableTh,
  PageHeader,
  Pagination,
  Panel,
  SearchInput,
  Toolbar,
} from '../../components/admin/ui';
import { tableBodyClass, tableHeadRowClass, tdClass, thClass } from '../../lib/adminUi';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import { getApparatusLabel } from '../../constants/apparatuses';

interface AdminShopOrder extends ShopOrder {
  adminNote: string | null;
  paymentId: string | null;
  locale: string;
  user: { id: string; name: string | null; email: string | null } | null;
}


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
  // Sekme, arama, sayfa, sıralama ve açık detay adres çubuğunda.
  // Dashboard'daki "Ödeme Bekleyen" kartı → ?tab=unpaid, hızlı arama → ?tab=all&id=…
  const [url, setUrl] = useUrlState({ tab: 'paid', q: '', page: '1', sort: '', dir: 'desc', id: '' });
  const tab = TABS.some((t) => t.key === url.tab) ? url.tab : 'paid';
  const query = url.q;
  const page = Math.max(1, Number(url.page) || 1);
  const setPage = (p: number) => setUrl({ page: String(p) });
  const [search, setSearch] = useState(url.q);
  const [exportOpen, setExportOpen] = useState(false);
  const [orders, setOrders] = useState<AdminShopOrder[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminShopOrder | null>(null);
  // Listedeki satırdan silme (yalnızca ödenmemiş siparişler silinebilir)
  const [rowDelete, setRowDelete] = useState<AdminShopOrder | null>(null);
  const [rowDeleting, setRowDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: tab, page: String(page), limit: '20' });
      if (query) params.set('search', query);
      if (url.sort) {
        params.set('sort', url.sort);
        params.set('dir', url.dir);
      }
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
  }, [tab, page, query, url.sort, url.dir]);

  useEffect(() => {
    load();
  }, [load]);

  // Detay aç/kapat: açık sipariş ?id= ile adres çubuğunda
  const openDetail = (order: AdminShopOrder | null) => {
    setSelected(order);
    setUrl({ id: order?.id ?? '' });
  };

  // ?id= ile gelindi: listede yoksa aynı admin biçimiyle tek kayıt getirilir (search id ile eşleşir)
  useEffect(() => {
    if (!url.id || selected?.id === url.id) return;
    const inList = orders.find((o) => o.id === url.id);
    if (inList) {
      setSelected(inList);
      return;
    }
    let cancelled = false;
    api
      .get('/api/shop/admin/orders', { params: { status: 'all', search: url.id, limit: 1 } })
      .then(({ data }) => {
        if (cancelled) return;
        const found = data.data?.find((o: AdminShopOrder) => o.id === url.id);
        if (found) setSelected(found);
        else {
          toast.error('Sipariş bulunamadı');
          setUrl({ id: '' });
        }
      })
      .catch(() => !cancelled && setUrl({ id: '' }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url.id, orders]);

  const handleSort = (sort: string, dir: 'asc' | 'desc' | null) =>
    setUrl(dir ? { sort, dir, page: '1' } : { sort: '', dir: 'desc', page: '1' });
  const sortDir = url.dir as 'asc' | 'desc';

  const deleteRow = async () => {
    if (!rowDelete) return;
    setRowDeleting(true);
    try {
      await api.delete(`/api/shop/admin/orders/${rowDelete.id}`);
      toast.success('Sipariş silindi');
      setRowDelete(null);
      load();
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(message || 'Silinemedi');
    } finally {
      setRowDeleting(false);
    }
  };

  const tabCount = (t: (typeof TABS)[number]) =>
    t.statuses.length ? t.statuses.reduce((sum, s) => sum + (counts[s] ?? 0), 0) : Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ürün Siparişleri"
        icon={Truck}
        description={'Kişiye özel ürün siparişleri. Durumu buradan güncelleyin; müşteri profilinden görür. "Kargoda" ve "Teslim edildi"de müşteriye mail gider.'}
        actions={
          <Button icon={FileSpreadsheet} onClick={() => setExportOpen(true)}>
            Excel İndir
          </Button>
        }
      />

      <Toolbar>
        <SearchInput
          value={search}
          onChange={setSearch}
          onSubmit={() => setUrl({ q: search.trim(), page: '1' })}
          placeholder="Alıcı, telefon, e-posta, ürün, il ara... (Enter)"
        />
        <FilterTabs
          tabs={TABS.map((t) => ({ key: t.key, label: t.label, count: tabCount(t) }))}
          value={tab}
          onChange={(key) => setUrl({ tab: key, page: '1' })}
        />
      </Toolbar>

      <Panel className="overflow-hidden">
        {loading ? (
          <SkeletonRows />
        ) : orders.length === 0 ? (
          <EmptyState bare icon={Truck} title="Sipariş yok" description={query ? 'Aramayı değiştirmeyi deneyin.' : undefined} />
        ) : (
          <>
          {/* Mobil kartlar */}
          <div className="md:hidden divide-y divide-gray-700/50">
            {orders.map((o) => (
              <div key={o.id} className="p-4">
                <button type="button" onClick={() => openDetail(o)} className="w-full text-left">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium">
                        {o.productName}
                        {o.quantity > 1 && <span className="text-gray-400"> × {o.quantity}</span>}
                      </p>
                      {o.selection && <p className="text-xs text-amber-300">{selectionText(o)}</p>}
                      <p className="text-gray-400 text-xs mt-1 truncate">
                        {o.recipientName} · {o.city}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-white font-semibold">{formatTL(o.totalPrice)}</p>
                      <div className="mt-1.5">
                        <ShopStatusBadge status={o.status} />
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs mt-2">{formatDateTime(o.paidAt ?? o.createdAt)}</p>
                </button>
                <div className="mt-3 flex items-center gap-2">
                  <Button size="sm" icon={Eye} onClick={() => openDetail(o)}>
                    Detay / Düzenle
                  </Button>
                  {isUnpaid(o.status) && (
                    <Button size="sm" variant="danger" icon={Trash2} onClick={() => setRowDelete(o)}>
                      Sil
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={tableHeadRowClass}>
                  <SortableTh label="Tarih" field="createdAt" sort={url.sort} dir={sortDir} onSort={handleSort} />
                  <th className={thClass}>Ürün</th>
                  <SortableTh label="Alıcı" field="recipientName" sort={url.sort} dir={sortDir} onSort={handleSort} />
                  <SortableTh label="İl" field="city" sort={url.sort} dir={sortDir} onSort={handleSort} />
                  <SortableTh label="Tutar" field="totalPrice" sort={url.sort} dir={sortDir} onSort={handleSort} />
                  <SortableTh label="Durum" field="status" sort={url.sort} dir={sortDir} onSort={handleSort} />
                  <th className={`${thClass} text-right`}>İşlemler</th>
                </tr>
              </thead>
              <tbody className={tableBodyClass}>
                {orders.map((o) => (
                  <tr key={o.id} onClick={() => openDetail(o)} className="hover:bg-gray-700/20 cursor-pointer transition-colors">
                    <td className={`${tdClass} text-gray-300 whitespace-nowrap`}>{formatDateTime(o.paidAt ?? o.createdAt)}</td>
                    <td className={`${tdClass} text-white`}>
                      {o.productName}
                      {o.quantity > 1 && <span className="text-gray-400"> × {o.quantity}</span>}
                      {o.selection && <div className="text-xs text-amber-300">{selectionText(o)}</div>}
                    </td>
                    <td className={`${tdClass} text-gray-200`}>
                      {o.recipientName}
                      <div className="text-xs" onClick={(e) => e.stopPropagation()}>
                        <PhoneLinks phone={o.phone} />
                      </div>
                    </td>
                    <td className={`${tdClass} text-gray-300`}>{o.city}</td>
                    <td className={`${tdClass} text-gray-200 whitespace-nowrap`}>{formatTL(o.totalPrice)}</td>
                    <td className={tdClass}>
                      <ShopStatusBadge status={o.status} />
                    </td>
                    <td className={tdClass} onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <IconButton icon={Eye} title="Detay / Düzenle" onClick={() => openDetail(o)} />
                        {isUnpaid(o.status) ? (
                          <IconButton icon={Trash2} title="Sil" tone="danger" onClick={() => setRowDelete(o)} />
                        ) : (
                          <IconButton
                            icon={Trash2}
                            title="Ödenmiş sipariş silinemez; iptal için durumu İptal yapın"
                            tone="danger"
                            disabled
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </Panel>

      {selected && (
        <OrderDetail
          order={selected}
          onClose={() => openDetail(null)}
          onSaved={(updated) => {
            setSelected(updated);
            load();
          }}
          onDeleted={() => {
            openDetail(null);
            load();
          }}
        />
      )}

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Ürün Siparişleri — Excel"
        columnsUrl="/api/shop/admin/orders/export/columns"
        exportUrl="/api/shop/admin/orders/export"
        storageKey="shop-orders"
        fallbackFileName="urun-siparisleri.xlsx"
        initialValues={{ status: tab, search: query, from: '', to: '', sort: url.sort, dir: url.dir }}
        fields={[
          { key: 'status', label: 'Durum', type: 'select', options: TABS.map((t) => ({ value: t.key, label: t.label })) },
          { key: 'search', label: 'Arama (alıcı, telefon, e-posta, ürün, il)', type: 'text', placeholder: 'Boş = hepsi' },
          { key: 'from', label: 'Başlangıç tarihi', type: 'date' },
          { key: 'to', label: 'Bitiş tarihi', type: 'date' },
        ]}
      />

      <ConfirmDeleteModal
        open={!!rowDelete}
        title="Sipariş silinsin mi?"
        message={
          rowDelete && (
            <>
              <strong className="text-white">{rowDelete.recipientName}</strong> adına{' '}
              <strong className="text-white">{rowDelete.productName}</strong> siparişi hiç ödenmedi. Kalıcı olarak
              silinecek.
            </>
          )
        }
        isDeleting={rowDeleting}
        onConfirm={deleteRow}
        onCancel={() => setRowDelete(null)}
      />
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
  // Teslimat adresi düzenleme (backend validateShipping ile doğrular)
  const shippingFrom = (o: AdminShopOrder): ShippingInput => ({
    recipientName: o.recipientName,
    phone: o.phone,
    city: o.city,
    district: o.district,
    address: o.address,
    postalCode: o.postalCode ?? '',
    note: o.customerNote ?? '',
  });
  const [addressForm, setAddressForm] = useState<ShippingInput | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);
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

  const saveAddress = async () => {
    if (!addressForm) return;
    setSavingAddress(true);
    try {
      const { data } = await api.patch(`/api/shop/admin/orders/${order.id}`, { shipping: addressForm });
      toast.success('Adres güncellendi');
      setAddressForm(null);
      onSaved(data.order);
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(message || 'Adres kaydedilemedi');
    } finally {
      setSavingAddress(false);
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
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="text-sm font-medium text-gray-300">Teslimat adresi</h3>
                {!addressForm && (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setAddressForm(shippingFrom(order))}
                      className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Düzenle
                    </button>
                    <button
                      type="button"
                      onClick={() => copy(addressText)}
                      className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300"
                    >
                      <Copy className="w-3.5 h-3.5" /> Kopyala
                    </button>
                  </div>
                )}
              </div>
              {addressForm ? (
                <div className="space-y-2">
                  {(
                    [
                      ['recipientName', 'Alıcı adı soyadı', 100],
                      ['phone', 'Telefon', 20],
                      ['city', 'İl', 50],
                      ['district', 'İlçe', 50],
                      ['postalCode', 'Posta kodu', 10],
                    ] as [keyof ShippingInput, string, number][]
                  ).map(([key, label, max]) => (
                    <input
                      key={key}
                      value={addressForm[key]}
                      onChange={(e) => setAddressForm((f) => (f ? { ...f, [key]: e.target.value } : f))}
                      placeholder={label}
                      aria-label={label}
                      maxLength={max}
                      className={inputClass}
                    />
                  ))}
                  <textarea
                    value={addressForm.address}
                    onChange={(e) => setAddressForm((f) => (f ? { ...f, address: e.target.value } : f))}
                    placeholder="Açık adres"
                    aria-label="Açık adres"
                    rows={3}
                    maxLength={500}
                    className={inputClass}
                  />
                  <textarea
                    value={addressForm.note}
                    onChange={(e) => setAddressForm((f) => (f ? { ...f, note: e.target.value } : f))}
                    placeholder="Müşteri notu (isteğe bağlı)"
                    aria-label="Müşteri notu"
                    rows={2}
                    maxLength={500}
                    className={inputClass}
                  />
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="primary" icon={Save} loading={savingAddress} onClick={saveAddress}>
                      Adresi kaydet
                    </Button>
                    <Button size="sm" variant="ghost" disabled={savingAddress} onClick={() => setAddressForm(null)}>
                      Vazgeç
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-white whitespace-pre-line break-words">{addressText}</p>
                  <div className="mt-2 text-sm">
                    <PhoneLinks phone={order.phone} />
                  </div>
                  {order.customerNote && <p className="text-sm text-gray-400 italic mt-2">Not: {order.customerNote}</p>}
                </>
              )}
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
          {unpaid ? (
            <Button variant="danger" icon={Trash2} onClick={() => setConfirmDelete(true)}>
              Sil
            </Button>
          ) : (
            <p className="text-xs text-gray-500">Ödenmiş sipariş silinemez — iptal için durumu "İptal" yapın.</p>
          )}
          <div className="flex-1" />
          <Button onClick={onClose}>Kapat</Button>
          <Button variant="primary" icon={Save} loading={saving} onClick={save}>
            Kaydet
          </Button>
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

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Plus, Pencil, Trash2, X, Loader2, Package, Save, Upload } from 'lucide-react';
import api from '../../lib/api';

interface Package {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  image: string;
  imageUrl?: string;
  features: string[];
  discount2: number;
  discount3: number;
  reservationPrice: number;
  reservationDiscount2: number;
  reservationDiscount3: number;
  isActive: boolean;
  sortOrder: number;
}

interface PackageFormData {
  slug: string;
  name: string;
  category: string;
  price: number;
  image: string;
  features: string;
  discount2: number;
  discount3: number;
  reservationPrice: number;
  reservationDiscount2: number;
  reservationDiscount3: number;
  isActive: boolean;
  sortOrder: number;
}

const initialFormData: PackageFormData = {
  slug: '',
  name: '',
  category: 'photo',
  price: 0,
  image: '',
  features: '',
  discount2: 0,
  discount3: 0,
  reservationPrice: 0,
  reservationDiscount2: 0,
  reservationDiscount3: 0,
  isActive: true,
  sortOrder: 0,
};

const PackagesPage = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PackageFormData>(initialFormData);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  // Görsel yükleme durumu: imagePreview form açıkken gösterilen URL
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const { data } = await api.get('/api/packages/all');
      setPackages(data);
    } catch (error) {
      console.error('Failed to fetch packages:', error);
      // Fallback to regular endpoint if /all doesn't exist
      try {
        const { data } = await api.get('/api/packages');
        setPackages(data);
      } catch (err) {
        console.error('Failed to fetch packages:', err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setError('');
    setImagePreview('');
    setShowModal(true);
  };

  const openEditModal = (pkg: Package) => {
    setFormData({
      slug: pkg.slug,
      name: pkg.name,
      category: pkg.category,
      price: pkg.price,
      image: pkg.image,
      features: pkg.features.join('\n'),
      discount2: pkg.discount2,
      discount3: pkg.discount3,
      reservationPrice: pkg.reservationPrice || pkg.price,
      reservationDiscount2: pkg.reservationDiscount2 || pkg.discount2,
      reservationDiscount3: pkg.reservationDiscount3 || pkg.discount3,
      isActive: pkg.isActive,
      sortOrder: pkg.sortOrder,
    });
    setEditingId(pkg.id);
    setError('');
    setImagePreview(pkg.imageUrl || pkg.image);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(initialFormData);
    setError('');
    setImagePreview('');
  };

  // Görsel yükleme: presign → plain axios ile R2'ye PUT (cookie gitmesin) → form'a key yaz
  const handleImageUpload = async (file: File | undefined) => {
    if (!file) return;
    setIsUploadingImage(true);
    setError('');
    try {
      const { data } = await api.post('/api/packages/upload-image', {
        fileName: file.name,
        contentType: file.type,
        size: file.size,
      });
      await axios.put(data.uploadUrl, file, {
        headers: { 'Content-Type': file.type },
      });
      setFormData((prev) => ({ ...prev, image: data.key }));
      setImagePreview(URL.createObjectURL(file));
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setError(errorObj.response?.data?.message || 'Görsel yüklenemedi');
    } finally {
      setIsUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const payload = {
      ...formData,
      features: formData.features.split('\n').filter(f => f.trim()),
    };

    try {
      if (editingId) {
        await api.put(`/api/packages/${editingId}`, payload);
      } else {
        await api.post('/api/packages', payload);
      }
      await fetchPackages();
      closeModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/packages/${id}`);
      await fetchPackages();
      setDeleteConfirm(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Silme işlemi başarısız');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(price);
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      photo: 'Fotoğraf',
      video: 'Video',
      full: 'Komple',
    };
    return labels[category] || category;
  };

  const getCategoryBadge = (category: string) => {
    const badges: Record<string, string> = {
      photo: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      video: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      full: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    };
    return badges[category] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Paketler</h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">Fotoğraf ve video paketlerini yönetin</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" />
          Yeni Paket
        </button>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-3">
        {packages.map((pkg) => (
          <div key={pkg.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <img
                src={pkg.imageUrl || pkg.image}
                alt={pkg.name}
                className="w-14 h-14 rounded-lg object-cover bg-gray-700 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{pkg.name}</p>
                <p className="text-gray-500 text-xs truncate">{pkg.slug}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full border ${getCategoryBadge(pkg.category)}`}>
                    {getCategoryLabel(pkg.category)}
                  </span>
                  <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${
                    pkg.isActive
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {pkg.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                  <span className="text-gray-500 text-[11px]">Sıra: {pkg.sortOrder}</span>
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-900/40 rounded-lg p-2">
                <p className="text-gray-400 mb-1">Normal (Online)</p>
                <p className="text-white">{formatPrice(pkg.price)}</p>
                <p className="text-gray-500 text-[11px] mt-0.5">
                  2S: {formatPrice(pkg.discount2)} / 3S: {formatPrice(pkg.discount3)}
                </p>
              </div>
              <div className="bg-violet-500/5 border border-violet-500/20 rounded-lg p-2">
                <p className="text-gray-400 mb-1">Rezervasyon</p>
                <p className="text-violet-400">{formatPrice(pkg.reservationPrice || pkg.price)}</p>
                <p className="text-gray-500 text-[11px] mt-0.5">
                  2S: {formatPrice(pkg.reservationDiscount2 || pkg.discount2)} / 3S: {formatPrice(pkg.reservationDiscount3 || pkg.discount3)}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                onClick={() => openEditModal(pkg)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-md text-xs font-medium transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Düzenle
              </button>
              {deleteConfirm === pkg.id ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDelete(pkg.id)}
                    className="px-3 py-1.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded-md font-medium"
                  >
                    Sil
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="px-3 py-1.5 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded-md font-medium"
                  >
                    İptal
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDeleteConfirm(pkg.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 rounded-md text-xs font-medium transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Sil
                </button>
              )}
            </div>
          </div>
        ))}

        {packages.length === 0 && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl text-center py-12">
            <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Henüz paket eklenmemiş</p>
          </div>
        )}
      </div>

      {/* Packages Table (desktop) */}
      <div className="hidden lg:block bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 text-sm border-b border-gray-700 bg-gray-800/50">
                <th className="px-6 py-4 font-medium">Paket</th>
                <th className="px-6 py-4 font-medium">Kategori</th>
                <th className="px-6 py-4 font-medium">Normal Fiyat</th>
                <th className="px-6 py-4 font-medium">Rezervasyon Fiyatı</th>
                <th className="px-6 py-4 font-medium">Durum</th>
                <th className="px-6 py-4 font-medium">Sıra</th>
                <th className="px-6 py-4 font-medium text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {packages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={pkg.imageUrl || pkg.image}
                        alt={pkg.name}
                        className="w-12 h-12 rounded-lg object-cover bg-gray-700"
                      />
                      <div>
                        <p className="text-white font-medium">{pkg.name}</p>
                        <p className="text-gray-500 text-xs">{pkg.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getCategoryBadge(pkg.category)}`}>
                      {getCategoryLabel(pkg.category)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p className="text-white">{formatPrice(pkg.price)}</p>
                      <p className="text-gray-500 text-xs">2S: {formatPrice(pkg.discount2)} / 3S: {formatPrice(pkg.discount3)}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p className="text-violet-400">{formatPrice(pkg.reservationPrice || pkg.price)}</p>
                      <p className="text-gray-500 text-xs">
                        2S: {formatPrice(pkg.reservationDiscount2 || pkg.discount2)} / 3S: {formatPrice(pkg.reservationDiscount3 || pkg.discount3)}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      pkg.isActive 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {pkg.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400">{pkg.sortOrder}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(pkg)}
                        className="p-2 text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                        title="Düzenle"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {deleteConfirm === pkg.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(pkg.id)}
                            className="px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded"
                          >
                            Sil
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded"
                          >
                            İptal
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(pkg.id)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {packages.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Henüz paket eklenmemiş</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700">
              <h2 className="text-lg sm:text-xl font-semibold text-white">
                {editingId ? 'Paketi Düzenle' : 'Yeni Paket Ekle'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Slug */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Slug *</label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    placeholder="photo-basic"
                    required
                    disabled={!!editingId}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-500 disabled:opacity-50"
                  />
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Paket Adı *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Foto Basic"
                    required
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Kategori *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="photo">Fotoğraf</option>
                    <option value="video">Video</option>
                    <option value="full">Komple Paket</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Sıralama</label>
                  <input
                    type="number"
                    name="sortOrder"
                    value={formData.sortOrder}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Paket Görseli */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Paket Görseli</label>
                <div className="flex items-start gap-3">
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Önizleme"
                      className="w-20 h-20 rounded-lg object-cover bg-gray-700 border border-gray-600 shrink-0"
                    />
                  )}
                  <div className="grow">
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept=".webp,.jpg,.jpeg,.png,image/webp,image/jpeg,image/png"
                      onChange={(e) => handleImageUpload(e.target.files?.[0])}
                      disabled={isUploadingImage}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {isUploadingImage ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Yükleniyor...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          {imagePreview ? 'Görseli Değiştir' : 'Görsel Yükle'}
                        </>
                      )}
                    </button>
                    <p className="text-xs text-gray-500 mt-1.5">webp/jpg/png, maks. 10MB</p>
                    <input
                      type="text"
                      name="image"
                      value={formData.image}
                      onChange={(e) => {
                        handleInputChange(e);
                        setImagePreview(e.target.value);
                      }}
                      placeholder="veya harici URL girin"
                      className="mt-2 w-full px-3 py-1.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Normal Prices */}
              <div className="p-4 bg-gray-700/30 rounded-xl">
                <h3 className="text-sm font-medium text-white mb-3">Normal Fiyatlar (Online)</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">1 Seri *</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">2 Seri *</label>
                    <input
                      type="number"
                      name="discount2"
                      value={formData.discount2}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">3 Seri *</label>
                    <input
                      type="number"
                      name="discount3"
                      value={formData.discount3}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Reservation Prices */}
              <div className="p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                <h3 className="text-sm font-medium text-violet-400 mb-3">Rezervasyon Fiyatları (Nakit)</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">1 Seri</label>
                    <input
                      type="number"
                      name="reservationPrice"
                      value={formData.reservationPrice}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">2 Seri</label>
                    <input
                      type="number"
                      name="reservationDiscount2"
                      value={formData.reservationDiscount2}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">3 Seri</label>
                    <input
                      type="number"
                      name="reservationDiscount3"
                      value={formData.reservationDiscount3}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Özellikler (her satıra bir özellik)</label>
                <textarea
                  name="features"
                  value={formData.features}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="1 Seri Çekimi&#10;40+ editli fotoğraf&#10;Profesyonel düzenleme"
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="isActive"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-300">Paket aktif</label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingId ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackagesPage;

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  Folder,
  CheckCircle2,
  Download,
  Loader2,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { toast } from 'react-toastify';
import api, { API_URL } from '../../lib/api';
import { getApparatusLabel } from '../../constants/apparatuses';
import UploadDayModal from '../../components/admin/UploadDayModal';
import TournamentSelect from '../../components/admin/TournamentSelect';
import { useTournaments } from '../../lib/tournaments';
import { ALL_TOURNAMENTS, readStoredTournament, storeTournament } from '../../hooks/useAdminTournament';
import ShootingTimeEditModal from '../../components/admin/ShootingTimeEditModal';
import PhotoFolderModal from '../../components/admin/PhotoFolderModal';
import { useAuth } from '../../context/AuthContext';
import { TRACK_LABELS, type Track } from '../../lib/roles';
import { trackTimes, type ShootTrack } from '../../lib/shooting';
import PriorityBadge from '../../components/PriorityBadge';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import {
  ActionMenu,
  Button,
  EmptyState,
  PageHeader,
  Pagination as PaginationBar,
  SearchInput,
  Segmented,
  Select,
  SkeletonRows,
  Toolbar,
} from '../../components/admin/ui';
import { panelClass } from '../../lib/adminUi';
import ExportModal from '../../components/admin/ExportModal';

interface ShootingItem {
  packageName: string;
  category: string;
  seriesCount: number;
  quantity: number;
  apparatuses?: string[];
  priority?: boolean;
}

interface ShootingEntry {
  id: string;
  position: number;
  athleteName: string;
  clubName: string | null;
  birthYear: string | null;
  category: string | null;
  expectedTime: string | null;
  /** Seçili ize göre backend'de çözülür */
  willBeShot: boolean;
  willBeShotPhoto: boolean;
  willBeShotVideo: boolean;
  orderId: string | null;
  reservationId: string | null;
  photoStartedAt: string | null;
  photoEndedAt: string | null;
  videoStartedAt: string | null;
  videoEndedAt: string | null;
  /** Foto klasör numarası (günün foto çekim sırası, 100'den); başlatılmamışsa null */
  photoFolder: number | null;
  photoFolderEdited: boolean;
  createdAt: string;
  customerPhone: string | null;
  notes: string | null;
  status: string | null;
  items: ShootingItem[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Stats {
  total: number;
  willBeShot: number;
  willNotBeShot: number;
  pending: number;
  inProgress: number;
  done: number;
}

interface Day {
  id: string;
  label: string;
  sortOrder: number;
  tournamentId: string | null;
  total: number;
}

type SortKey = 'position' | 'expected' | 'started' | 'name';

const ITEMS_PER_PAGE = 10;

const statusBadge = (willBeShot: boolean) =>
  willBeShot ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
      Çekilecek
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
      Çekilmeyecek
    </span>
  );

// "14:23:07" — çekimler 1-2 dakika sürdüğü için saniye de gerekli
const clock = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;

interface TrackTimerProps {
  /** Ekranın görünümü — ÇEKİLİYOR/SAHNEDE ayrımı buna göre (Tümü → herhangi bir paket) */
  viewTrack: Track;
  entry: ShootingEntry;
  track: ShootTrack;
  /** Admin "Tümü" görünümünde iki iz alt alta — hangisi olduğu etiketlensin */
  showLabel: boolean;
  busy: boolean;
  onAction: (entry: ShootingEntry, track: ShootTrack, action: 'start' | 'end') => void;
  onEdit: (entry: ShootingEntry) => void;
  onEditFolder: (entry: ShootingEntry) => void;
}

// Bir izin açık (başlamış ama bitmemiş) olup olmadığı
const isTrackRecording = (entry: ShootingEntry, track: ShootTrack) => {
  const { startedAt, endedAt } = trackTimes(entry, track);
  return !!startedAt && !endedAt;
};

// Bu izde çekilecek mi (foto: willBeShotPhoto, video: willBeShotVideo)
const isTrackShot = (entry: ShootingEntry, track: ShootTrack) =>
  track === 'photo' ? entry.willBeShotPhoto : entry.willBeShotVideo;

// Satırın açık izleri: çekilecek olanda "ÇEKİLİYOR" (zümrüt), çekilmeyecek olanda
// "SAHNEDE" (nötr) — ekip zincir için çekilmeyen sporcuda da Başlat'a basıyor.
const rowRunState = (entry: ShootingEntry, tracks: ShootTrack[]) => {
  const running = tracks.filter((t) => isTrackRecording(entry, t));
  const isRecording = running.some((t) => isTrackShot(entry, t));
  return { isRecording, isOnStage: running.length > 0 && !isRecording, isRunning: running.length > 0 };
};

// Bir satırın tek bir izi. Zincirleme akış: "Başlat" → sıradakine basınca kendiliğinden kapanır.
// Ayrı bir durdur butonu yok; son kaydı kapatmak için yeşil rozete tıklanır.
const TrackTimer = ({ entry, track, viewTrack, showLabel, busy, onAction, onEdit, onEditFolder }: TrackTimerProps) => {
  const shot = viewTrack === 'all' ? entry.willBeShot : isTrackShot(entry, viewTrack);
  const { startedAt, endedAt } = trackTimes(entry, track);
  const started = clock(startedAt);
  const ended = clock(endedAt);

  return (
    <div className="flex items-center gap-2">
      {showLabel && (
        <span className="w-6 shrink-0 text-xs font-semibold uppercase text-gray-400">
          {track === 'photo' ? 'Fo' : 'Vi'}
        </span>
      )}
      {!started ? (
        <button
          type="button"
          onClick={() => onAction(entry, track, 'start')}
          disabled={busy}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 transition-colors disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
          Başlat
        </button>
      ) : !ended ? (
        shot ? (
          <button
            type="button"
            onClick={() => onAction(entry, track, 'end')}
            disabled={busy}
            title="Çekimi bitir (sıradaki sporcuya basınca da kapanır)"
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-white shadow-sm shadow-emerald-500/30 transition-colors disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            )}
            ÇEKİLİYOR · {started}
          </button>
        ) : (
          // Çekilmeyecek sporcu sahnede: süre zincir için tutuluyor, çekim yok
          <button
            type="button"
            onClick={() => onAction(entry, track, 'end')}
            disabled={busy}
            title="Bu sporcu çekilmeyecek; süre yalnızca sırayı takip için tutuluyor"
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 border border-violet-400/60 text-gray-950 shadow-sm shadow-violet-500/30 transition-colors disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <span className="w-1.5 h-1.5 rounded-full bg-violet-200" />}
            SAHNEDE · {started}
          </button>
        )
      ) : (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-gray-700/50 border border-gray-600 text-gray-300">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          {started} – {ended}
        </span>
      )}
      {/* Foto klasörü: kamerada bu sporcunun fotoğraflarının olduğu klasör */}
      {track === 'photo' && entry.photoFolder != null && (
        <button
          type="button"
          onClick={() => onEditFolder(entry)}
          title={
            entry.photoFolderEdited
              ? 'Klasör elle düzeltildi — düzenle'
              : 'Kameradaki klasör — yanlışsa düzelt, sonrakiler kendiliğinden kayar'
          }
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border transition-colors ${
            entry.photoFolderEdited
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
              : 'bg-sky-500/10 border-sky-500/30 text-sky-300 hover:bg-sky-500/20'
          }`}
        >
          <Folder className="w-3 h-3" />
          {entry.photoFolder}
        </button>
      )}
      <button
        type="button"
        onClick={() => onEdit(entry)}
        title="Saatleri düzenle"
        className="p-1 text-gray-400 hover:text-white transition-colors"
      >
        <Pencil className="w-3 h-3" />
      </button>
    </div>
  );
};

const ShootingListPage = () => {
  const { isAdmin, track: staffTrack } = useAuth();
  // Personelde iz role sabit; admin seçebiliyor ("Tümü" = bugüne kadarki görünüm)
  const [selectedTrack, setSelectedTrack] = useState<Track>(staffTrack ?? 'all');
  const track: Track = staffTrack ?? selectedTrack;
  const visibleTracks: ShootTrack[] =
    track === 'all' ? ['photo', 'video'] : [track];
  // Bu sekmenin kimliği — kendi tetiklediği SSE yankısını yok saymak için
  const clientIdRef = useRef(
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : String(Math.random()),
  );
  // Uçuşta kaç saat işlemi var — arka plan tazelemesini sadece sonuncusu tetiklesin
  const pendingActionsRef = useRef(0);
  const [timerBusyKey, setTimerBusyKey] = useState<string | null>(null);
  const [editEntry, setEditEntry] = useState<ShootingEntry | null>(null);
  const [folderEntry, setFolderEntry] = useState<ShootingEntry | null>(null);
  const [entries, setEntries] = useState<ShootingEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 0,
  });
  const [stats, setStats] = useState<Stats>({
    total: 0,
    willBeShot: 0,
    willNotBeShot: 0,
    pending: 0,
    inProgress: 0,
    done: 0,
  });
  const [days, setDays] = useState<Day[]>([]);
  const [activeDayId, setActiveDayId] = useState<string | null>(null);
  // fetchList içinde state yerine bu okunur — bkz. fetchList'teki not
  const activeDayRef = useRef(activeDayId);
  activeDayRef.current = activeDayId;
  // Yarışma: gün sekmeleri yalnızca seçili yarışmanın günleri. null = sunucu seçer (açık yarışma /
  // son yüklenen gün); sunucunun seçtiği cevapta gelir. activeDayRef ile aynı nedenle ref'ten okunur.
  const { tournaments } = useTournaments();
  const [tournamentId, setTournamentId] = useState<string | null>(null);
  // Başka sayfada seçilen yarışma burada da açılır (yalnızca admin; "tümü" burada yok → sunucu seçer)
  const tournamentRef = useRef<string | null>(null);
  const storedApplied = useRef(false);
  if (!storedApplied.current) {
    storedApplied.current = true;
    const stored = isAdmin ? readStoredTournament()?.id : null;
    if (stored && stored !== ALL_TOURNAMENTS) tournamentRef.current = stored;
  }
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('position');
  const [isClearing, setIsClearing] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  // Excel: sütun + filtre seçimi penceresi (ExportModal)
  const [exportOpen, setExportOpen] = useState(false);
  // Yükleme modalı: null = yeni gün; dolu = o günün üzerine yaz
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadExisting, setUploadExisting] = useState<{ id: string; label: string; tournamentId: string | null } | null>(null);

  const fetchList = useCallback(
    async (
      page: number = 1,
      silent: boolean = false,
      dayIdOverride?: string | null,
    ) => {
      if (!silent) setIsLoading(true);
      try {
        // activeDayId bağımlılık listesinde OLMAMALI: ilk yüklemede backend'den
        // gelen günü set etmek fetchList'i yeniden yaratıp ikinci bir istek atıyordu.
        const effectiveDay =
          dayIdOverride !== undefined ? dayIdOverride : activeDayRef.current;
        const params = new URLSearchParams({
          page: page.toString(),
          limit: ITEMS_PER_PAGE.toString(),
          sort: sortKey,
          // Personelde backend rolü baz alır; parametre admin için anlamlı
          track,
        });
        if (searchQuery) params.append('search', searchQuery);
        if (effectiveDay) params.append('dayId', effectiveDay);
        if (tournamentRef.current) params.append('tournamentId', tournamentRef.current);

        const { data } = await api.get(`/api/shooting-list?${params}`);
        setEntries(data.data);
        setPagination(data.pagination);
        setStats(data.stats);
        setDays(data.days ?? []);
        tournamentRef.current = data.tournamentId ?? null;
        setTournamentId(data.tournamentId ?? null);
        // Backend'in döndürdüğü aktif günü senkronla (ilk yükleme / silme sonrası)
        const nextActive = data.activeDayId ?? null;
        if (nextActive !== activeDayRef.current) setActiveDayId(nextActive);
      } catch (error) {
        if (!silent) console.error('Çekim listesi alınamadı:', error);
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [searchQuery, sortKey, track],
  );

  useEffect(() => {
    fetchList(1);
  }, [fetchList]);

  // Push tetiklendiğinde en güncel sayfayı/günü okumak için ref'ler
  const pageRef = useRef(pagination.page);
  useEffect(() => {
    pageRef.current = pagination.page;
  }, [pagination.page]);

  const fetchListRef = useRef(fetchList);
  useEffect(() => {
    fetchListRef.current = fetchList;
  }, [fetchList]);

  // SSE: başka bir sekme/kullanıcı listeyi değiştirdiğinde "refresh" gelir.
  // Bağımlılık [] — aksi halde her arama tuşunda bağlantı kapanıp yeniden açılıyordu.
  useEffect(() => {
    const source = new EventSource(`${API_URL}/api/shooting-list/stream`, {
      withCredentials: true,
    });

    const handleRefresh = (event: MessageEvent) => {
      // Kendi yaptığımız değişikliğin yankısı: state zaten güncel, boşuna yükleme yapma
      if (event.data && event.data === clientIdRef.current) return;
      fetchListRef.current(pageRef.current, true);
    };

    source.addEventListener('refresh', handleRefresh);
    // onerror durumunda EventSource otomatik reconnect denediği için manuel müdahale gereksiz

    return () => {
      source.removeEventListener('refresh', handleRefresh);
      source.close();
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchList(newPage);
    }
  };

  const activeDay = days.find((d) => d.id === activeDayId) ?? null;

  const openNewDay = () => {
    setUploadExisting(null);
    setUploadOpen(true);
  };

  const openReupload = () => {
    if (!activeDay) return;
    setUploadExisting({ id: activeDay.id, label: activeDay.label, tournamentId: activeDay.tournamentId });
    setUploadOpen(true);
  };

  // Gün sekmesi: fetchList aktif güne bağımlı değil (bkz. activeDayRef), bu yüzden
  // sadece state'i değiştirmek veri çekmez — seçilen gün doğrudan verilmeli.
  const handleDayChange = (dayId: string) => {
    if (dayId === activeDayId) return;
    setActiveDayId(dayId);
    fetchList(1, false, dayId);
  };

  // Yüklenen gün başka bir yarışmaya ait olabilir → o yarışmaya geç
  const handleUploaded = (dayId: string, dayTournamentId: string | null) => {
    tournamentRef.current = dayTournamentId;
    setActiveDayId(dayId);
    fetchList(1, false, dayId);
  };

  // Yarışma değişince o yarışmanın ilk günü açılır
  const handleTournamentChange = (id: string) => {
    if (id === tournamentId) return;
    storeTournament(id, tournaments);
    tournamentRef.current = id;
    setTournamentId(id);
    setActiveDayId(null);
    fetchList(1, false, null);
  };

  // Admin: seçili iz görünümüne göre günün sürelerini toplu sıfırla (Tümü → foto + video)
  const handleResetTimes = async () => {
    if (!activeDay) return;
    setIsResetting(true);
    try {
      const { data } = await api.post('/api/shooting-list/reset-times', { dayId: activeDay.id });
      toast.success(`${data.count} satırın süreleri sıfırlandı`);
      setConfirmReset(false);
      await fetchList(1, false, activeDay.id);
    } catch (error) {
      console.error('Süreler sıfırlanamadı:', error);
      toast.error('Süreler sıfırlanamadı');
    } finally {
      setIsResetting(false);
    }
  };

  const [confirmDeleteDay, setConfirmDeleteDay] = useState(false);
  const handleDeleteDay = async () => {
    if (!activeDay) return;
    setIsClearing(true);
    try {
      await api.delete(`/api/shooting-list?dayId=${activeDay.id}`);
      toast.success('Gün silindi');
      setConfirmDeleteDay(false);
      // Silinen günden çık; backend kalan ilk günü aktif yapacak
      setActiveDayId(null);
      await fetchList(1, false, null);
    } catch (error) {
      console.error('Gün silinemedi:', error);
      toast.error('Gün silinemedi');
    } finally {
      setIsClearing(false);
    }
  };

  // Başlat / Bitir. Veritabanı uzakta olduğu için istek ~1 sn sürüyor; zincirin sonucu
  // istemcide de bilindiğinden state'i beklemeden güncelliyoruz (iyimser), hata olursa geri alıyoruz.
  const handleTimerAction = async (
    entry: ShootingEntry,
    timerTrack: ShootTrack,
    action: 'start' | 'end',
  ) => {
    const key = `${entry.id}:${timerTrack}`;
    const snapshot = entries;
    const now = new Date().toISOString();
    // Süre ortak: her iz aynı kolonları kullanır (bkz. lib/shooting trackTimes)
    const startField = 'photoStartedAt';
    const endField = 'photoEndedAt';

    setEntries((prev) =>
      prev.map((row) => {
        if (row.id === entry.id) {
          return action === 'start'
            ? { ...row, [startField]: now, [endField]: null }
            : { ...row, [endField]: now };
        }
        // Zincir: o gün açık olan diğer satır aynı anda kapanır (tek ortak zincir)
        if (action === 'start' && row[startField] && !row[endField]) {
          return { ...row, [endField]: now };
        }
        return row;
      }),
    );

    setTimerBusyKey(key);
    pendingActionsRef.current += 1;
    try {
      await api.patch(`/api/shooting-list/${entry.id}`, {
        action,
        track: timerTrack,
        clientId: clientIdRef.current,
      });
    } catch (error) {
      console.error('Çekim saati güncellenemedi:', error);
      toast.error('Çekim saati güncellenemedi');
      setEntries(snapshot);
    } finally {
      pendingActionsRef.current -= 1;
      setTimerBusyKey(null);
      // İstatistik kartları (Çekiliyor / Tamamlanan) günün tamamını kapsıyor, iyimser
      // güncellemeden türetilemez. Arka planda sessizce tazele — butonu bekletmez.
      // Arka arkaya basışlarda sadece sonuncusu tazeler, cevaplar birbirini ezmesin.
      if (pendingActionsRef.current === 0) {
        void fetchListRef.current(pageRef.current, true);
      }
    }
  };

  // Satır başına TEK ortak süre. İstek izi: personelde kendi izi, admin "Tümü"de foto
  // (süre ortak; klasör rozeti foto izine ait olduğu için admin onu da görür).
  const timerTrack: ShootTrack = track === 'all' ? 'photo' : track;
  const renderTimers = (entry: ShootingEntry) => (
    <TrackTimer
      entry={entry}
      track={timerTrack}
      viewTrack={track}
      showLabel={false}
      busy={timerBusyKey === `${entry.id}:${timerTrack}`}
      onAction={handleTimerAction}
      onEdit={setEditEntry}
      onEditFolder={setFolderEntry}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={track === 'all' ? 'Çekim Listesi' : `${TRACK_LABELS[track]} Çekim Listesi`}
        icon={Camera}
        description={
          <>
            Sıradaki sporcuda <span className="text-emerald-400">Başlat</span>'a basın — önceki kayıt otomatik
            kapanır
          </>
        }
        actions={
          <>
            {isAdmin && (
              <>
                <TournamentSelect
                  tournaments={tournaments}
                  value={tournamentId ?? ''}
                  onChange={handleTournamentChange}
                  allowAll={false}
                  className="w-full sm:w-auto"
                />
                {/* İz seçici: hangi ekibin gözünden bakıldığı */}
                <Segmented<Track>
                  ariaLabel="Ekip görünümü"
                  value={track}
                  onChange={setSelectedTrack}
                  options={(['all', 'photo', 'video'] as Track[]).map((key) => ({ key, label: TRACK_LABELS[key] }))}
                />
                <Button variant="primary" icon={Plus} onClick={openNewDay}>
                  Yeni Gün
                </Button>
              </>
            )}
            {isAdmin && activeDay && (
              <>
                <Button iconOnlyOnMobile icon={Download} onClick={() => setExportOpen(true)}>
                  Excel İndir
                </Button>
                {/* Seyrek ve geri alınamayan işlemler tek menüde: yanlışlıkla basılmasın */}
                <ActionMenu
                  items={[
                    { label: 'Listeyi yeniden yükle', icon: RefreshCw, onClick: openReupload },
                    { label: 'Süreleri sıfırla', icon: RotateCcw, onClick: () => setConfirmReset(true) },
                    {
                      label: 'Bu günü sil',
                      icon: Trash2,
                      danger: true,
                      disabled: isClearing,
                      onClick: () => setConfirmDeleteDay(true),
                    },
                  ]}
                />
              </>
            )}
          </>
        }
      />

      {/* Gün sekmeleri */}
      {days.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap border-b border-gray-700 pb-px">
          {days.map((day) => (
            <button
              key={day.id}
              onClick={() => handleDayChange(day.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium border-b-2 -mb-px transition-colors ${
                day.id === activeDayId
                  ? 'border-amber-500 text-amber-400 bg-gray-800/50'
                  : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-800/30'
              }`}
            >
              {day.label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  day.id === activeDayId
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {day.total}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard label="Toplam" value={stats.total} tone="neutral" />
        <StatCard label="Çekilecek" value={stats.willBeShot} tone="emerald" />
        <StatCard
          label="Çekilmeyecek"
          value={stats.willNotBeShot}
          tone="gray"
        />
        <StatCard label="Çekiliyor" value={stats.inProgress} tone="emerald" />
        <StatCard label="Tamamlanan" value={stats.done} tone="amber" />
      </div>

      {/* Arama + sıralama */}
      <Toolbar>
        <SearchInput value={searchInput} onChange={setSearchInput} placeholder="Sporcu veya kulüp ara..." />
        <Select
          aria-label="Sıralama"
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="lg:w-64"
        >
          <option value="position">Excel sırasına göre</option>
          <option value="expected">Beklenen saate göre</option>
          <option value="started">Başlangıç saatine göre</option>
          <option value="name">Sporcu adına göre</option>
        </Select>
      </Toolbar>

      {/* Table */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
        {isLoading ? (
          <SkeletonRows rows={8} />
        ) : entries.length === 0 ? (
          <EmptyState
            bare
            icon={Camera}
            title={
              days.length === 0
                ? isAdmin
                  ? 'Henüz gün eklenmedi. "Yeni Gün" ile ilk Excel\'i yükleyin.'
                  : 'Henüz çekim listesi yüklenmedi.'
                : searchQuery
                  ? 'Aramayla eşleşen kayıt yok.'
                  : 'Bu günde kayıt yok.'
            }
          />
        ) : (
          <>
            {/* Mobile cards */}
            <div className="lg:hidden divide-y divide-gray-700/50">
              {entries.map((entry) => {
                const { isRecording, isOnStage, isRunning } = rowRunState(entry, visibleTracks);
                // Sahnedeki satır (çekilsin ya da çekilmesin) asla soluk görünmesin
                const disabledRow = !entry.willBeShot && !isRunning;
                const hasItems = entry.items.length > 0;
                const hasNotes = !!entry.notes;
                return (
                  <div
                    key={entry.id}
                    className={`p-4 border-l-2 transition-colors ${
                      isRecording
                        ? 'border-emerald-400 bg-emerald-500/10'
                        : isOnStage
                          ? 'border-violet-400 bg-violet-500/15'
                          : 'border-transparent'
                    } ${disabledRow ? 'opacity-60' : ''}`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-gray-400 font-mono text-xs">#{entry.position}</span>
                        {statusBadge(entry.willBeShot)}
                        {entry.category && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {entry.category}
                          </span>
                        )}
                      </div>
                      <p className="text-white font-medium truncate">{entry.athleteName}</p>
                      <p className="text-gray-400 text-xs truncate">{entry.clubName || '—'}</p>
                      <p className="text-gray-400 text-xs mt-0.5">
                        {[entry.birthYear, entry.customerPhone].filter(Boolean).join(' • ') || '—'}
                      </p>
                    </div>

                    <div className="mt-3 bg-gray-900/40 rounded-lg p-2 text-xs">
                      <p className="text-gray-400 uppercase tracking-wide">Beklenen</p>
                      <p className={`font-mono mt-0.5 ${entry.expectedTime ? 'text-white' : 'text-gray-400'}`}>
                        {entry.expectedTime || '—'}
                      </p>
                    </div>

                    <div className="mt-2 bg-gray-900/40 rounded-lg p-2 text-xs">
                      <p className="text-gray-400 uppercase tracking-wide mb-1">Çekim</p>
                      <div className="space-y-1">{renderTimers(entry)}</div>
                    </div>

                    <div className="mt-2 bg-gray-900/40 rounded-lg p-2 text-xs">
                      <p className="text-gray-400 uppercase tracking-wide">Paket / Seri / Not</p>
                      {!hasItems && !hasNotes ? (
                        <p className="text-gray-400 mt-0.5">—</p>
                      ) : (
                        <div className="mt-0.5 space-y-1.5">
                          {hasItems &&
                            entry.items.map((it, i) => (
                              <div key={i}>
                                <p className="text-gray-300">
                                  <span className="text-white">{it.packageName}</span>
                                  <PriorityBadge show={it.priority} />
                                  <span className="text-gray-400">
                                    {' · '}
                                    {it.seriesCount}'li × {it.quantity}
                                  </span>
                                </p>
                                {it.apparatuses && it.apparatuses.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-0.5">
                                    {it.apparatuses.map((slug) => (
                                      <span
                                        key={slug}
                                        className="inline-flex items-center px-1.5 py-0 rounded text-xs font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/25"
                                      >
                                        {getApparatusLabel(slug)}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          {hasNotes && (
                            <p
                              className="text-gray-400 line-clamp-2"
                              title={entry.notes ?? undefined}
                            >
                              <span className="text-gray-400">Not:</span> {entry.notes}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 text-xs uppercase tracking-wider bg-gray-900/50">
                    <th className="px-5 py-3 font-medium">Sıra</th>
                    <th className="px-5 py-3 font-medium">Sporcu</th>
                    <th className="px-5 py-3 font-medium">Kulüp</th>
                    <th className="px-5 py-3 font-medium">Alet</th>
                    <th className="px-5 py-3 font-medium">Durum</th>
                    <th className="px-5 py-3 font-medium">Beklenen</th>
                    <th className="px-5 py-3 font-medium">Çekim</th>
                    <th className="px-5 py-3 font-medium">Paket / Seri / Not</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {entries.map((entry) => {
                    const { isRecording, isOnStage, isRunning } = rowRunState(entry, visibleTracks);
                    // Sahnedeki satır (çekilsin ya da çekilmesin) asla soluk görünmesin
                    const disabledRow = !entry.willBeShot && !isRunning;
                    const hasItems = entry.items.length > 0;
                    const hasNotes = !!entry.notes;

                    return (
                      <tr
                        key={entry.id}
                        className={`transition-colors ${
                          isRecording
                            ? 'bg-emerald-500/10 hover:bg-emerald-500/15'
                            : isOnStage
                              ? 'bg-violet-500/15 hover:bg-violet-500/20'
                              : 'hover:bg-gray-700/20'
                        } ${disabledRow ? 'opacity-50 hover:opacity-70' : ''}`}
                      >
                        <td
                          className={`px-5 py-3 text-gray-400 font-mono text-sm align-top border-l-2 ${
                            isRecording ? 'border-emerald-400' : isOnStage ? 'border-violet-400' : 'border-transparent'
                          }`}
                        >
                          {entry.position}
                        </td>
                        <td className="px-5 py-3 align-top">
                          <div>
                            <p className="text-white font-medium">
                              {entry.athleteName}
                            </p>
                            <p className="text-gray-400 text-xs">
                              {[entry.birthYear, entry.customerPhone]
                                .filter(Boolean)
                                .join(' • ') || '—'}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-gray-300 text-sm align-top">
                          {entry.clubName || '—'}
                        </td>
                        <td className="px-5 py-3 align-top">
                          {entry.category ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              {entry.category}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 align-top">
                          {statusBadge(entry.willBeShot)}
                        </td>
                        <td className="px-5 py-3 align-top">
                          {entry.expectedTime ? (
                            <span className="text-white font-mono text-sm">
                              {entry.expectedTime}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 align-top">
                          <div className="space-y-1">{renderTimers(entry)}</div>
                        </td>
                        <td className="px-5 py-3 text-sm align-top">
                          {!hasItems && !hasNotes ? (
                            <span className="text-gray-400">—</span>
                          ) : (
                            <div className="space-y-1.5">
                              {hasItems &&
                                entry.items.map((it, i) => (
                                  <div key={i}>
                                    <p className="text-gray-300">
                                      <span className="text-white">
                                        {it.packageName}
                                      </span>
                                      <PriorityBadge show={it.priority} />
                                      <span className="text-gray-400">
                                        {' · '}
                                        {it.seriesCount}'li × {it.quantity}
                                      </span>
                                    </p>
                                    {it.apparatuses && it.apparatuses.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-0.5">
                                        {it.apparatuses.map((slug) => (
                                          <span
                                            key={slug}
                                            className="inline-flex items-center px-1.5 py-0 rounded text-xs font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/25"
                                          >
                                            {getApparatusLabel(slug)}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              {hasNotes && (
                                <p
                                  className="text-gray-400 text-xs line-clamp-1"
                                  title={entry.notes ?? undefined}
                                >
                                  <span className="text-gray-400">Not:</span>{' '}
                                  {entry.notes}
                                </p>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <PaginationBar
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
              onChange={handlePageChange}
            />
          </>
        )}
      </div>

      <UploadDayModal
        open={uploadOpen}
        existingDay={uploadExisting}
        defaultTournamentId={tournamentId}
        onClose={() => setUploadOpen(false)}
        onUploaded={handleUploaded}
      />

      <ShootingTimeEditModal
        entry={editEntry}
        tracks={[timerTrack]}
        canEditExpected={isAdmin}
        clientId={clientIdRef.current}
        onClose={() => setEditEntry(null)}
        onSaved={() => fetchList(pagination.page, true)}
      />

      <PhotoFolderModal
        entry={folderEntry}
        clientId={clientIdRef.current}
        onClose={() => setFolderEntry(null)}
        onSaved={() => fetchList(pagination.page, true)}
      />

      <ConfirmDeleteModal
        open={confirmReset && !!activeDay}
        title="Süreler sıfırlansın mı?"
        message={
          activeDay && (
            <>
              <strong>{activeDay.label}</strong> günündeki bütün başlangıç/bitiş saatleri ve elle
              düzeltilen klasör numaraları silinecek. Sporcular, "çekilecek" işaretleri ve eşleşmeler
              değişmez. Bu işlem geri alınamaz.
            </>
          )
        }
        confirmLabel="Evet, Sıfırla"
        isDeleting={isResetting}
        onConfirm={handleResetTimes}
        onCancel={() => setConfirmReset(false)}
      />

      <ConfirmDeleteModal
        open={confirmDeleteDay && !!activeDay}
        title="Gün silinsin mi?"
        message={
          activeDay && (
            <>
              <strong>{activeDay.label}</strong> günü ve listedeki bütün satırları (süreler dahil) kalıcı olarak
              silinecek. Sipariş ve rezervasyonlar etkilenmez. Bu işlem geri alınamaz.
            </>
          )
        }
        confirmLabel="Evet, Günü Sil"
        isDeleting={isClearing}
        onConfirm={handleDeleteDay}
        onCancel={() => setConfirmDeleteDay(false)}
      />

      {activeDay && (
        <ExportModal
          open={exportOpen}
          onClose={() => setExportOpen(false)}
          title={`Çekim Listesi — ${activeDay.label} — Excel`}
          columnsUrl="/api/shooting-list/export/columns"
          exportUrl="/api/shooting-list/export"
          storageKey="shooting-list"
          fallbackFileName={`cekim-listesi-${activeDay.label}.xlsx`}
          fixedParams={{ dayId: activeDay.id }}
          initialValues={{ track: track, onlyShot: '', search: searchQuery, sort: sortKey }}
          fields={[
            {
              key: 'track',
              label: 'Ekip',
              type: 'select',
              options: [
                { value: 'all', label: 'Tümü (foto + video)' },
                { value: 'photo', label: 'Fotoğraf' },
                { value: 'video', label: 'Video' },
              ],
            },
            {
              key: 'sort',
              label: 'Sıralama',
              type: 'select',
              options: [
                { value: 'position', label: 'Excel sırası' },
                { value: 'expected', label: 'Beklenen saat' },
                { value: 'started', label: 'Çekim başlangıcı' },
                { value: 'name', label: 'Sporcu adı' },
              ],
            },
            { key: 'search', label: 'Arama (sporcu, kulüp)', type: 'text', placeholder: 'Boş = hepsi' },
            {
              key: 'onlyShot',
              label: 'Sadece çekilecekler',
              type: 'checkbox',
              hint: 'Seçili ekip için paketi olan sporcular (Tümü seçiliyse herhangi bir paketi olanlar)',
            },
          ]}
        />
      )}
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: number;
  tone: 'neutral' | 'gray' | 'emerald' | 'amber';
}

const StatCard = ({ label, value, tone }: StatCardProps) => {
  const toneClass: Record<StatCardProps['tone'], string> = {
    neutral: 'text-white',
    gray: 'text-gray-300',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
  };
  return (
    <div className={`${panelClass} p-4`}>
      <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${toneClass[tone]}`}>{value}</p>
    </div>
  );
};

export default ShootingListPage;

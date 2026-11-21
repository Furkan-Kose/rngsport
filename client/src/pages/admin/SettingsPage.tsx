import { useState, type FormEvent } from 'react';
import { Check, Palette, Settings, UserCog } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { roleLabel } from '../../lib/roles';
import {
  ADMIN_ACCENTS,
  ADMIN_BACKGROUNDS,
  setAdminTheme,
  useAdminTheme,
  type AdminBackground,
} from '../../lib/adminTheme';
import { notifyError } from '../../lib/adminErrors';
import { cx } from '../../lib/adminUi';
import { Button, Field, Input, PageHeader, Panel, PanelHeader } from '../../components/admin/ui';

// Zeminin küçük önizlemesi: menü + kart + vurgu düğmesi. Renkler doğrudan verilir (seçili
// temadan bağımsız), böylece seçmeden önce görülür.
const ThemePreview = ({ background, accent }: { background: AdminBackground; accent: string }) => {
  const { bg, card, line } = background.preview;
  return (
    <div
      className="flex h-20 w-full sm:w-44 shrink-0 rounded-lg overflow-hidden border"
      style={{ background: bg, borderColor: line }}
      aria-hidden
    >
      <div className="w-1/4 p-2 space-y-1.5 border-r" style={{ background: card, borderColor: line }}>
        <div className="h-1.5 w-3/4 rounded-full" style={{ background: accent }} />
        <div className="h-1.5 w-full rounded-full" style={{ background: line }} />
        <div className="h-1.5 w-2/3 rounded-full" style={{ background: line }} />
      </div>
      <div className="flex-1 p-2 space-y-1.5">
        <div className="h-1.5 w-1/3 rounded-full bg-white/80" />
        <div className="rounded border p-1.5 space-y-1" style={{ background: card, borderColor: line }}>
          <div className="h-1 w-2/3 rounded-full" style={{ background: line }} />
          <div className="h-1 w-1/2 rounded-full" style={{ background: line }} />
        </div>
        <div className="h-3 w-10 rounded" style={{ background: accent }} />
      </div>
    </div>
  );
};

/**
 * Tema seçici: her zemin bir satır, satırda vurgu renkleri yan yana.
 * Bir renge tıklamak o zemin + o vurguyu seçer.
 */
const ThemePicker = () => {
  const current = useAdminTheme();
  const accentColor = (id: string) => ADMIN_ACCENTS.find((a) => a.id === id)?.color ?? ADMIN_ACCENTS[0].color;

  return (
    <div className="space-y-3">
      {ADMIN_BACKGROUNDS.map((background) => {
        const rowActive = background.id === current.bg;
        return (
          <div
            key={background.id}
            role="radiogroup"
            aria-label={`${background.name} zemin`}
            className={cx(
              'flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 rounded-xl border p-3',
              rowActive ? 'border-amber-500/60 bg-amber-500/5' : 'border-gray-700 bg-gray-900/40',
            )}
          >
            {/* Önizleme: seçili satırda seçili vurguyla, diğerlerinde o an seçili vurguyla çizilir */}
            <ThemePreview background={background} accent={accentColor(current.accent)} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white mb-2">{background.name}</p>
              <div className="flex flex-wrap gap-2">
                {ADMIN_ACCENTS.map((accent) => {
                  const active = rowActive && accent.id === current.accent;
                  return (
                    <button
                      key={accent.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setAdminTheme({ bg: background.id, accent: accent.id })}
                      className={cx(
                        'inline-flex items-center gap-1.5 h-8 pl-1.5 pr-2.5 rounded-lg border text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60',
                        active
                          ? 'border-gray-200 bg-gray-700 text-white'
                          : 'border-gray-700 bg-gray-800/60 text-gray-300 hover:border-gray-500 hover:text-white',
                      )}
                    >
                      <span
                        className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: accent.color }}
                      >
                        {active && <Check className="w-3 h-3 text-gray-950" strokeWidth={3} />}
                      </span>
                      {accent.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const PasswordForm = () => {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [errors, setErrors] = useState<{ next?: string; confirm?: string }>({});
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found = {
      next: form.next.length < 8 ? 'Yeni şifre en az 8 karakter olmalı' : undefined,
      confirm: form.next !== form.confirm ? 'Şifreler eşleşmiyor' : undefined,
    };
    setErrors(found);
    if (found.next || found.confirm) return;

    setSaving(true);
    try {
      await api.post('/api/auth/change-password', { currentPassword: form.current, newPassword: form.next });
      toast.success('Şifreniz güncellendi');
      setForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      notifyError(err, 'Şifre güncellenemedi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4 max-w-md">
      <Field label="Mevcut şifre" htmlFor="set-pw-current" required>
        <Input
          id="set-pw-current"
          type="password"
          autoComplete="current-password"
          value={form.current}
          onChange={(e) => setForm((p) => ({ ...p, current: e.target.value }))}
          required
        />
      </Field>
      <Field label="Yeni şifre" htmlFor="set-pw-next" required error={errors.next} hint="En az 8 karakter">
        <Input
          id="set-pw-next"
          type="password"
          autoComplete="new-password"
          value={form.next}
          onChange={(e) => setForm((p) => ({ ...p, next: e.target.value }))}
          invalid={!!errors.next}
        />
      </Field>
      <Field label="Yeni şifre (tekrar)" htmlFor="set-pw-confirm" required error={errors.confirm}>
        <Input
          id="set-pw-confirm"
          type="password"
          autoComplete="new-password"
          value={form.confirm}
          onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))}
          invalid={!!errors.confirm}
        />
      </Field>
      <Button type="submit" variant="primary" loading={saving}>
        Şifreyi Güncelle
      </Button>
    </form>
  );
};

/** /admin/settings — görünüm (tema) ve hesap. Admin ve saha personeli açabilir. */
const SettingsPage = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader title="Ayarlar" icon={Settings} description="Panelin görünümü ve hesabınız." />

      <Panel padded>
        <PanelHeader title="Görünüm" icon={Palette} />
        <p className="text-sm text-gray-400 -mt-2 mb-4">
          Bir zemin ve bir vurgu rengi seçin: her satır bir zemin, yanındaki renkler o zeminin vurgu seçenekleri.
          Seçim bu cihazda saklanır; durum renkleri (ödendi, iptal, bekliyor) her temada aynıdır.
        </p>
        <ThemePicker />
      </Panel>

      <Panel padded>
        <PanelHeader title="Hesap" icon={UserCog} />
        <dl className="grid sm:grid-cols-3 gap-4 text-sm mb-6">
          <div>
            <dt className="text-gray-400">Ad</dt>
            <dd className="text-white font-medium">{user?.name || '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-400">Kullanıcı adı</dt>
            <dd className="text-white font-medium">{user?.username || user?.email || '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-400">Görev</dt>
            <dd className="text-white font-medium">{roleLabel(user?.role)}</dd>
          </div>
        </dl>
        <h3 className="text-sm font-semibold text-white mb-3">Şifre değiştir</h3>
        <PasswordForm />
      </Panel>
    </div>
  );
};

export default SettingsPage;

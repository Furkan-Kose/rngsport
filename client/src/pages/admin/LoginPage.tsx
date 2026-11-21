import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { Camera } from 'lucide-react';
import { ROLES, STAFF_ROLES } from '../../lib/roles';
import { useApplyAdminTheme } from '../../lib/adminTheme';
import { Button, Callout, Field, Input } from '../../components/admin/ui';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  // Seçili panel teması giriş ekranında da geçerli
  useApplyAdminTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(username, password);

    if (!result.success) {
      setError(result.message || 'Giriş başarısız');
      setIsLoading(false);
      return;
    }

    // Personel panelin geri kalanını göremez → doğrudan çekim listesine,
    // müşteri hesabı ise buraya hiç girmemeli.
    const role = result.user?.role;
    if (role === ROLES.ADMIN) {
      navigate('/admin');
    } else if (role && STAFF_ROLES.includes(role)) {
      navigate('/admin/shooting-list');
    } else {
      setError('Bu panele erişim yetkiniz yok');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-500 rounded-xl mb-4">
            <Camera className="w-7 h-7 text-gray-950" />
          </div>
          <h1 className="text-2xl font-bold text-white">rngsport</h1>
          <p className="text-gray-400 mt-1">Yönetim Paneli</p>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Callout tone="error">{error}</Callout>}

            <Field label="Kullanıcı adı" htmlFor="username">
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                required
              />
            </Field>

            <Field label="Şifre" htmlFor="password">
              <Input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </Field>

            <Button type="submit" variant="primary" loading={isLoading} className="w-full">
              {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

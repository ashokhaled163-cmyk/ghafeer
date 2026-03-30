import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!phone.trim() || !password.trim()) { setError('أدخل رقم الموبايل وكلمة المرور'); return; }
    setLoading(true);
    try {
      const user = await login(phone.trim(), password);
      const r = user.role;
      if (['super_admin','area_manager','supervisor','street_monitor'].includes(r)) navigate('/admin');
      else if (r === 'driver') navigate('/driver');
      else navigate('/client');
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('invalid-credential') || msg.includes('wrong-password')) setError('رقم الموبايل أو كلمة المرور غلط');
      else setError(msg || 'خطأ في تسجيل الدخول');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-24 pb-16 px-4 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md">
          <div className="glass-card-gold p-8 shadow-lg">
            <div className="text-center mb-8">
              <img src="/images/logo.png" alt="الغفير" className="w-20 h-20 mx-auto rounded-full object-cover border-4 border-gold mb-4" />
              <h1 className="text-3xl font-black bg-gradient-to-l from-gold to-gold-dark bg-clip-text text-transparent">تسجيل الدخول</h1>
              <p className="text-gray-500 mt-2">مرحباً بك في الغفير</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-1 text-sm">رقم الموبايل</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="01xxxxxxxxx"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gold outline-none bg-white transition-all" />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1 text-sm">كلمة المرور</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gold outline-none bg-white transition-all" />
              </div>
              {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">⚠️ {error}</div>}
              <button type="submit" disabled={loading} className="btn-gold w-full text-lg py-4 disabled:opacity-60">
                {loading ? '⏳ جاري الدخول...' : 'دخول ➜'}
              </button>
            </form>
            <div className="mt-6 text-center space-y-2">
              <p className="text-gray-500 text-sm">مالكش حساب؟</p>
              <Link to="/signup/client" className="block text-gold font-semibold hover:underline text-sm">تسجيل كعميل</Link>
              <Link to="/signup/driver" className="block text-teal font-semibold hover:underline text-sm">تسجيل كسائق</Link>
              <Link to="/signup/family" className="block text-silver-dark font-semibold hover:underline text-sm">تسجيل عائلة</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

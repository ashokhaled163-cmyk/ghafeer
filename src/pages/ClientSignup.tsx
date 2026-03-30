import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';

export default function ClientSignup() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [isFamily, setIsFamily] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name:'', phone:'', password:'', confirmPassword:'', address:'', familyHeadPhone:'',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!agreed) { setError('يجب الموافقة على الاتفاقية أولاً'); return; }
    if (form.password !== form.confirmPassword) { setError('كلمتا المرور غير متطابقتين'); return; }
    if (form.password.length < 6) { setError('كلمة المرور على الأقل 6 أحرف'); return; }
    if (!/^01[0-9]{9}$/.test(form.phone)) { setError('رقم الموبايل غير صحيح'); return; }
    setLoading(true);
    try {
      await register({
        name: form.name, phone: form.phone, password: form.password,
        role: isFamily ? 'family' : 'client',
        address: form.address,
        familyHeadId: isFamily ? form.familyHeadPhone : undefined,
      });
      navigate('/client');
    } catch (err: any) {
      if (err.message?.includes('email-already-in-use')) setError('رقم الموبايل مسجل من قبل');
      else setError(err.message || 'خطأ في التسجيل');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-24 pb-16 px-4 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-lg">
          <div className="glass-card-gold p-8 shadow-lg">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">👤</div>
              <h1 className="text-3xl font-black bg-gradient-to-l from-gold to-gold-dark bg-clip-text text-transparent">تسجيل عميل</h1>
              <p className="text-gray-500 mt-2">سجّل واطلب غفير في أي وقت</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {[{l:'الاسم الكامل',k:'name',t:'text',p:'أدخل اسمك الكامل'},{l:'رقم الموبايل',k:'phone',t:'tel',p:'01xxxxxxxxx'},{l:'العنوان',k:'address',t:'text',p:'المنطقة - الشارع'},{l:'كلمة المرور',k:'password',t:'password',p:'••••••••'},{l:'تأكيد كلمة المرور',k:'confirmPassword',t:'password',p:'••••••••'}].map(f => (
                <div key={f.k}>
                  <label className="block text-gray-700 font-semibold mb-1 text-sm">{f.l}</label>
                  <input type={f.t} required value={(form as any)[f.k]} onChange={e=>setForm({...form,[f.k]:e.target.value})}
                    placeholder={f.p} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gold outline-none bg-white transition-all"/>
                </div>
              ))}
              <div className="glass-card p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700">👨‍👩‍👧‍👦 هل أنت تابع لعائلة؟</span>
                  <button type="button" onClick={()=>setIsFamily(!isFamily)}
                    className={`w-14 h-7 rounded-full transition-all relative ${isFamily?'bg-teal':'bg-gray-300'}`}>
                    <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all ${isFamily?'right-0.5':'right-7'}`}/>
                  </button>
                </div>
                {isFamily && (
                  <div className="mt-3 fade-in">
                    <label className="block text-gray-600 text-sm mb-1">رقم موبايل رب العائلة</label>
                    <input type="tel" value={form.familyHeadPhone} onChange={e=>setForm({...form,familyHeadPhone:e.target.value})}
                      placeholder="رقم موبايل رب العائلة" className="w-full px-4 py-3 rounded-xl border border-teal/30 focus:border-teal outline-none bg-white"/>
                    <p className="text-xs text-gray-400 mt-1">سيتم إضافتك تلقائياً لعائلة رب الأسرة</p>
                  </div>
                )}
              </div>
              <div className="flex items-start gap-3">
                <input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)} className="mt-1 w-5 h-5 accent-gold"/>
                <label className="text-sm text-gray-600">أوافق على <Link to="/agreement" className="text-gold font-semibold hover:underline">اتفاقية الاستخدام</Link></label>
              </div>
              {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">⚠️ {error}</div>}
              <button type="submit" disabled={loading} className="btn-gold w-full text-lg py-4 disabled:opacity-60">
                {loading ? '⏳ جاري التسجيل...' : 'تسجيل ✓'}
              </button>
            </form>
            <p className="text-center mt-4 text-gray-500 text-sm">عندك حساب؟ <Link to="/login" className="text-gold font-semibold hover:underline">سجّل دخول</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}

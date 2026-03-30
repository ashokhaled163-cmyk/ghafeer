import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function FamilySignup() {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [isFamilyHead, setIsFamilyHead] = useState(true);
  const [form, setForm] = useState({
    name: '', phone: '', password: '', confirmPassword: '',
    address: '', familyHeadPhone: '', membersCount: '1',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) { alert('يجب الموافقة على الاتفاقية أولاً'); return; }
    alert(isFamilyHead ? 'تم إنشاء حساب عائلة بنجاح! يمكنك إضافة أفراد العائلة لاحقاً.' : 'تم إرسال طلب الانضمام لعائلة! سيتم إضافتك بعد موافقة رب العائلة.');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="w-full max-w-lg">
          <div className="glass-card-gold p-8 shadow-lg">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">👨‍👩‍👧‍👦</div>
              <h1 className="text-3xl font-black bg-gradient-to-l from-gold to-gold-dark bg-clip-text text-transparent">تسجيل عائلة</h1>
              <p className="text-gray-500 mt-2">تابع رحلات أفراد عائلتك واطمئن عليهم</p>
            </div>

            {/* Role Selection */}
            <div className="flex gap-3 mb-6">
              <button type="button" onClick={() => setIsFamilyHead(true)}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${isFamilyHead ? 'bg-gradient-to-l from-gold to-gold-dark text-white' : 'bg-gray-100 text-gray-600'}`}>
                👑 رب العائلة
              </button>
              <button type="button" onClick={() => setIsFamilyHead(false)}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${!isFamilyHead ? 'bg-gradient-to-l from-teal to-teal-dark text-white' : 'bg-gray-100 text-gray-600'}`}>
                👤 فرد في العائلة
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-1 text-sm">الاسم الكامل</label>
                <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="أدخل اسمك الكامل" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none bg-white" />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1 text-sm">رقم الموبايل</label>
                <input type="tel" required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                  placeholder="01xxxxxxxxx" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none bg-white" />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1 text-sm">العنوان</label>
                <input type="text" required value={form.address} onChange={e => setForm({...form, address: e.target.value})}
                  placeholder="المنطقة - الشارع" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none bg-white" />
              </div>

              {!isFamilyHead && (
                <div className="glass-card p-4 fade-in">
                  <label className="block text-gray-700 font-semibold mb-1 text-sm">📞 رقم رب العائلة</label>
                  <input type="tel" required value={form.familyHeadPhone} onChange={e => setForm({...form, familyHeadPhone: e.target.value})}
                    placeholder="رقم موبايل رب العائلة المسجّل" className="w-full px-4 py-3 rounded-xl border border-teal/30 focus:border-teal focus:ring-2 focus:ring-teal/20 outline-none bg-white" />
                  <p className="text-xs text-gray-400 mt-2">⚠️ يجب أن يكون رب العائلة مسجّل مسبقاً في النظام</p>
                </div>
              )}

              {isFamilyHead && (
                <div className="glass-card p-4 fade-in">
                  <label className="block text-gray-700 font-semibold mb-1 text-sm">عدد أفراد العائلة المتوقع</label>
                  <input type="number" min="1" max="20" value={form.membersCount} onChange={e => setForm({...form, membersCount: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gold/30 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none bg-white" />
                  <p className="text-xs text-gray-400 mt-2">يمكنك إضافة أفراد لاحقاً من لوحة التحكم</p>
                </div>
              )}

              <div>
                <label className="block text-gray-700 font-semibold mb-1 text-sm">كلمة المرور</label>
                <input type="password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                  placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none bg-white" />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1 text-sm">تأكيد كلمة المرور</label>
                <input type="password" required value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})}
                  placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none bg-white" />
              </div>

              <div className="flex items-start gap-3">
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-1 w-5 h-5 accent-gold" />
                <label className="text-sm text-gray-600">
                  أوافق على <Link to="/agreement" className="text-gold font-semibold hover:underline">اتفاقية الاستخدام</Link>
                </label>
              </div>

              <button type="submit" className="btn-gold w-full text-lg py-4">
                {isFamilyHead ? 'إنشاء حساب عائلة 👑' : 'طلب الانضمام للعائلة 👤'}
              </button>
            </form>

            <p className="text-center mt-4 text-gray-500 text-sm">
              عندك حساب؟ <Link to="/login" className="text-gold font-semibold hover:underline">سجّل دخول</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

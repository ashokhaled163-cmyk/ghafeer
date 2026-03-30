import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { useCloudinary } from '../hooks/useCloudinary';

export default function DriverSignup() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { uploadFile, uploading, progress } = useCloudinary();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name:'', phone:'', password:'', confirmPassword:'',
    nationalId:'', licenseNumber:'', vehicleType:'tuktuk', area:'', address:'',
  });
  const [files, setFiles] = useState<Record<string,File|null>>({
    nidPhoto:null, licensePhoto:null, vehiclePhoto:null, selfie:null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!agreed) { setError('يجب الموافقة على الاتفاقية'); return; }
    if (form.password !== form.confirmPassword) { setError('كلمتا المرور غير متطابقتين'); return; }
    if (form.password.length < 6) { setError('كلمة المرور على الأقل 6 أحرف'); return; }
    setLoading(true);
    try {
      const uid = await register({
        name:form.name, phone:form.phone, password:form.password, role:'driver',
        nationalId:form.nationalId, licenseNumber:form.licenseNumber,
        vehicleType:form.vehicleType, area:form.area, address:form.address,
      });
      // رفع الصور على Cloudinary
      for (const [key, file] of Object.entries(files)) {
        if (file) await uploadFile(file, `ghafeer/drivers/${uid}/${key}`);
      }
      navigate('/login');
    } catch (err: any) {
      if (err.message?.includes('email-already-in-use')) setError('رقم الموبايل مسجل من قبل');
      else if (err.message?.includes('Cloudinary')) setError('تم التسجيل - لكن فشل رفع الصور. تواصل مع الإدارة.');
      else setError(err.message || 'خطأ في التسجيل');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="w-full max-w-lg">
          <div className="glass-card p-8 shadow-lg">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🛺</div>
              <h1 className="text-3xl font-black bg-gradient-to-l from-teal to-teal-dark bg-clip-text text-transparent">تسجيل سائق</h1>
              <p className="text-gray-500 mt-2">انضم لفريق الغفير</p>
            </div>
            <div className="bg-gold/10 border border-gold/30 rounded-xl p-3 mb-6 text-center">
              <p className="text-gold-dark font-semibold text-sm">⚠️ تسجيل السائق يحتاج موافقة الإدارة</p>
            </div>

            {/* Steps */}
            <div className="flex gap-2 mb-6">
              {[{n:1,l:'البيانات'},{n:2,l:'المستندات'},{n:3,l:'الاتفاقية'}].map(s => (
                <div key={s.n} className={`flex-1 text-center py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${step===s.n?'bg-teal text-white':step>s.n?'bg-teal/20 text-teal':'bg-gray-100 text-gray-400'}`}
                  onClick={()=>step>s.n&&setStep(s.n)}>
                  {step>s.n?'✓ ':''}{s.l}
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              {step === 1 && (
                <div className="space-y-4 fade-in">
                  {[{l:'الاسم الكامل',k:'name',t:'text',p:'الاسم الثلاثي'},{l:'رقم الموبايل',k:'phone',t:'tel',p:'01xxxxxxxxx'},{l:'الرقم القومي',k:'nationalId',t:'text',p:'14 رقم'},{l:'رقم الرخصة',k:'licenseNumber',t:'text',p:'رقم رخصة القيادة'},{l:'المنطقة',k:'area',t:'text',p:'المنطقة التي تعمل بها'},{l:'العنوان',k:'address',t:'text',p:'عنوان السكن'},{l:'كلمة المرور',k:'password',t:'password',p:'••••••••'},{l:'تأكيد كلمة المرور',k:'confirmPassword',t:'password',p:'••••••••'}].map(f => (
                    <div key={f.k}>
                      <label className="block text-gray-700 font-semibold mb-1 text-sm">{f.l}</label>
                      <input type={f.t} required value={(form as any)[f.k]} onChange={e=>setForm({...form,[f.k]:e.target.value})}
                        placeholder={f.p} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal outline-none bg-white"/>
                    </div>
                  ))}
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1 text-sm">نوع المركبة</label>
                    <select value={form.vehicleType} onChange={e=>setForm({...form,vehicleType:e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal outline-none bg-white">
                      <option value="tuktuk">توك توك</option>
                      <option value="motorcycle">موتوسيكل</option>
                      <option value="other">أخرى</option>
                    </select>
                  </div>
                  <button type="button" onClick={()=>setStep(2)} className="btn-teal w-full py-4">التالي ←</button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 fade-in">
                  {[
                    {k:'nidPhoto',l:'📷 صورة البطاقة القومية'},
                    {k:'licensePhoto',l:'📷 صورة الرخصة'},
                    {k:'vehiclePhoto',l:'📷 صورة المركبة'},
                    {k:'selfie',l:'🤳 صورة شخصية واضحة'},
                  ].map(f => (
                    <div key={f.k}>
                      <label className="block text-gray-700 font-semibold mb-1 text-sm">{f.l}</label>
                      <div className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${files[f.k]?'border-teal bg-teal/5':'border-gray-200 hover:border-teal/50'}`}
                        onClick={()=>document.getElementById(f.k)?.click()}>
                        <input id={f.k} type="file" accept="image/*" className="hidden"
                          onChange={e=>setFiles(p=>({...p,[f.k]:e.target.files?.[0]||null}))}/>
                        {files[f.k] ? (
                          <p className="text-teal font-semibold text-sm">✓ {files[f.k]!.name}</p>
                        ) : (
                          <p className="text-gray-400 text-sm">اضغط لرفع الصورة</p>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-3">
                    <button type="button" onClick={()=>setStep(1)} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold">→ رجوع</button>
                    <button type="button" onClick={()=>setStep(3)} className="flex-1 btn-teal py-3">التالي ←</button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4 fade-in">
                  <div className="bg-gray-50 rounded-xl p-4 max-h-48 overflow-y-auto text-sm text-gray-600 leading-relaxed">
                    <b>اتفاقية انضمام سائق — الغفير</b><br/><br/>
                    بالتوقيع على هذه الاتفاقية أقر بأنني اطلعت على شروط وأحكام منصة الغفير وأوافق عليها:<br/><br/>
                    1. الالتزام بالقوانين والأنظمة المرورية.<br/>
                    2. التصرف باحترافية مع العملاء.<br/>
                    3. قبول نظام الدفع الذي تحدده الإدارة (نسبة أو مبلغ ثابت).<br/>
                    4. الاستجابة لاتصالات الإدارة عبر الواكي توكي فوراً.<br/>
                    5. عدم رفض مسح QR قبل بدء الرحلة.<br/>
                    6. الالتزام بمسار الرحلة والمعالم المحددة.<br/>
                    7. المحافظة على المركبة في حالة جيدة.<br/>
                    8. الإخلال بالاتفاقية يعرض الحساب للإيقاف.
                  </div>
                  <div className="flex items-start gap-3">
                    <input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)} className="mt-1 w-5 h-5 accent-teal"/>
                    <label className="text-sm text-gray-600">أوافق على <Link to="/agreement" className="text-teal font-semibold">اتفاقية الاستخدام</Link> والشروط والأحكام</label>
                  </div>
                  {uploading && (
                    <div className="bg-teal/10 rounded-xl p-3">
                      <p className="text-teal text-sm font-semibold mb-2">⏳ جاري رفع الصور... {progress}%</p>
                      <div className="bg-teal/20 rounded-full h-2"><div className="bg-teal h-2 rounded-full transition-all" style={{width:`${progress}%`}}/></div>
                    </div>
                  )}
                  {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">⚠️ {error}</div>}
                  <div className="flex gap-3">
                    <button type="button" onClick={()=>setStep(2)} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold">→ رجوع</button>
                    <button type="submit" disabled={loading||uploading} className="flex-1 btn-teal py-3 disabled:opacity-60">
                      {loading ? '⏳ جاري الإرسال...' : 'إرسال للمراجعة 📤'}
                    </button>
                  </div>
                </div>
              )}
            </form>
            <p className="text-center mt-4 text-gray-500 text-sm">عندك حساب؟ <Link to="/login" className="text-teal font-semibold">سجّل دخول</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}

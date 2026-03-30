import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function LandingPage() {
  const features = [
    { icon: '🛡️', title: 'أمان كامل', desc: 'كل رحلة مسجلة ومراقبة بالكامل مع نظام QR فريد لكل رحلة' },
    { icon: '📡', title: 'وكي توكي', desc: 'تواصل فوري بين السائق والعميل والإدارة بنظام لاسلكي متطور' },
    { icon: '🗺️', title: 'تتبع بالمعالم', desc: 'نظام ذكي يتتبع الرحلة عبر معالم معروفة بدون استهلاك GPS مستمر' },
    { icon: '👨‍👩‍👧‍👦', title: 'نظام العائلة', desc: 'تابع رحلات أفراد عائلتك واطمئن عليهم في أي وقت' },
    { icon: '🚨', title: 'زر الطوارئ SOS', desc: 'في أي لحظة اضغط SOS وسيصلك المساعدة فوراً' },
    { icon: '⭐', title: 'تقييم مستمر', desc: 'نظام تقييم شفاف يضمن أفضل خدمة دائماً' },
  ];

  const driverBenefits = [
    { icon: '💰', title: 'دخل مستقر', desc: 'طلبات مستمرة ونظام دفع واضح ومنظم' },
    { icon: '🔧', title: 'خصومات صيانة', desc: 'خصومات حصرية على قطع الغيار وورش التصليح' },
    { icon: '📱', title: 'تطبيق سهل', desc: 'واجهة بسيطة وسهلة الاستخدام' },
    { icon: '🛡️', title: 'حماية كاملة', desc: 'نظام دعم 6 شهور لكل سائق جديد' },
  ];

  const howItWorks = [
    { step: '1', title: 'اطلب غفير', desc: 'افتح التطبيق واضغط طلب غفير', icon: '📱' },
    { step: '2', title: 'السائق في الطريق', desc: 'أقرب سائق متاح يقبل طلبك', icon: '🛺' },
    { step: '3', title: 'امسح QR', desc: 'السائق يمسح كود QR لبدء الرحلة', icon: '📷' },
    { step: '4', title: 'رحلة آمنة', desc: 'تتبع بالمعالم وتواصل فوري', icon: '✅' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="mb-8 fade-in">
            <img src="/images/logo.png" alt="الغفير" className="w-32 h-32 mx-auto rounded-full object-cover border-4 border-gold shadow-lg shadow-gold/20" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 slide-up">
            <span className="bg-gradient-to-l from-gold to-gold-dark bg-clip-text text-transparent">الغفير</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-4 font-semibold fade-in">أول نظام أمان وتشغيل للتوك توك في مصر</p>
          <p className="text-lg text-silver-dark mb-10 max-w-2xl mx-auto fade-in">رحلة آمنة • سائق موثق • تتبع ذكي • تواصل فوري</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center fade-in">
            <Link to="/signup/client" className="btn-gold text-lg px-10 py-4 w-64">🚀 اطلب غفير</Link>
            <Link to="/signup/driver" className="btn-teal text-lg px-10 py-4 w-64">🛺 انضم كسائق</Link>
          </div>

          <div className="mt-12 flex justify-center gap-8 text-center">
            <div className="fade-in">
              <div className="text-3xl font-black text-gold">+1000</div>
              <div className="text-gray-500 text-sm">سائق مسجل</div>
            </div>
            <div className="fade-in">
              <div className="text-3xl font-black text-teal">+5000</div>
              <div className="text-gray-500 text-sm">رحلة آمنة</div>
            </div>
            <div className="fade-in">
              <div className="text-3xl font-black text-gold">4.8⭐</div>
              <div className="text-gray-500 text-sm">تقييم</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-4">
            <span className="bg-gradient-to-l from-gold to-gold-dark bg-clip-text text-transparent">إزاي بنشتغل؟</span>
          </h2>
          <p className="text-center text-gray-500 mb-12">أربع خطوات بسيطة لرحلة آمنة</p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {howItWorks.map((item, i) => (
              <div key={i} className="glass-card-gold p-6 text-center hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="text-5xl mb-4">{item.icon}</div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-l from-gold to-gold-dark text-white flex items-center justify-center mx-auto mb-3 font-bold">{item.step}</div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-gray-50/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-4">
            <span className="bg-gradient-to-l from-teal to-teal-dark bg-clip-text text-transparent">ليه الغفير؟</span>
          </h2>
          <p className="text-center text-gray-500 mb-12">مزايا تخلي رحلتك مختلفة تماماً</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="glass-card p-6 hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Driver Benefits */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-4">
            <span className="bg-gradient-to-l from-gold to-gold-dark bg-clip-text text-transparent">ليه تشتغل معانا كسائق؟</span>
          </h2>
          <p className="text-center text-gray-500 mb-12">مزايا حصرية لسائقي الغفير</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {driverBenefits.map((b, i) => (
              <div key={i} className="glass-card-gold p-6 text-center hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="text-4xl mb-4">{b.icon}</div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{b.title}</h3>
                <p className="text-gray-500 text-sm">{b.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/signup/driver" className="btn-gold text-lg px-12 py-4">🛺 سجّل كسائق الآن</Link>
          </div>
        </div>
      </section>

      {/* VOIP Section */}
      <section className="py-16 px-4 bg-gray-50/50">
        <div className="max-w-6xl mx-auto glass-card p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl font-black mb-4 text-gray-800">📡 نظام الوكي توكي المتطور</h2>
              <p className="text-gray-600 mb-6">تواصل فوري بنظام VOIP متقدم يعمل على سيرفرات Elastix و Issabel</p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-gray-700">
                  <span className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center text-teal">✓</span>
                  تواصل فوري بين الإدارة والسائق
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <span className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center text-teal">✓</span>
                  نظام Push-to-Talk احترافي
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <span className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center text-teal">✓</span>
                  الإدارة تتحكم في المكالمة بالكامل
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <span className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center text-teal">✓</span>
                  تواصل العميل مع السائق أثناء الرحلة
                </li>
              </ul>
            </div>
            <div className="flex justify-center">
              <div className="w-48 h-48 rounded-full bg-gradient-to-br from-teal to-teal-dark flex items-center justify-center shadow-xl shadow-teal/30 walkie-pulse">
                <span className="text-7xl">📡</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-white text-center">
        <h2 className="text-4xl font-black mb-4">
          <span className="bg-gradient-to-l from-gold to-gold-dark bg-clip-text text-transparent">ابدأ الآن مع الغفير</span>
        </h2>
        <p className="text-gray-500 text-lg mb-8">سجّل واستمتع بأمان رحلتك</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/signup/client" className="btn-gold text-lg px-10 py-4">👤 تسجيل عميل</Link>
          <Link to="/signup/driver" className="btn-teal text-lg px-10 py-4">🛺 تسجيل سائق</Link>
          <Link to="/signup/family" className="btn-silver text-lg px-10 py-4">👨‍👩‍👧‍👦 تسجيل عائلة</Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

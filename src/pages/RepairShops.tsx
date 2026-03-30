import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function RepairShops() {
  const workshops = [
    { id: 1, name: 'ورشة الأمان للتوك توك', area: 'المنطقة الأولى', discount: '20%', rating: 4.8, phone: '01012345678', services: ['صيانة عامة', 'كهرباء', 'نقل حركة'], status: 'ورشة معتمدة' },
    { id: 2, name: 'ورشة أبو علي', area: 'المنطقة الثانية', discount: '15%', rating: 4.6, phone: '01098765432', services: ['موتورات', 'دهان', 'عفشة'], status: 'ورشة معتمدة' },
    { id: 3, name: 'مركز خدمة الغفير', area: 'المنطقة الثالثة', discount: '25%', rating: 4.9, phone: '01122334455', services: ['صيانة شاملة', 'فحص دوري', 'طوارئ'], status: 'مركز ذهبي' },
    { id: 4, name: 'ورشة الحرفيين', area: 'المنطقة الأولى', discount: '12%', rating: 4.4, phone: '01234567890', services: ['لحام', 'هيكل', 'تجهيز'], status: 'ورشة معتمدة' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="text-5xl mb-4">🔧</div>
            <h1 className="text-4xl font-black bg-gradient-to-l from-teal to-teal-dark bg-clip-text text-transparent">ورش التصليح والصيانة</h1>
            <p className="text-gray-500 mt-3">ورش معتمدة بخصومات حصرية لسائقي الغفير</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {workshops.map(shop => (
              <div key={shop.id} className="glass-card p-6 hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-xl text-xs font-bold ${
                    shop.status === 'مركز ذهبي' ? 'bg-gold/10 text-gold-dark' : 'bg-teal/10 text-teal'
                  }`}>{shop.status}</span>
                  <span className="text-gold text-sm font-bold">⭐ {shop.rating}</span>
                </div>

                <h3 className="text-lg font-bold text-gray-800 mb-2">{shop.name}</h3>
                <p className="text-sm text-gray-500 mb-2">📍 {shop.area}</p>
                <p className="text-sm text-gray-500 mb-3">📞 {shop.phone}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {shop.services.map((s, i) => (
                    <span key={i} className="bg-gray-100 text-gray-600 px-2 py-1 rounded-lg text-xs font-semibold">🔧 {s}</span>
                  ))}
                </div>

                <div className="bg-teal/10 rounded-xl p-3 text-center mb-4">
                  <span className="text-2xl font-black text-teal">{shop.discount}</span>
                  <p className="text-xs text-teal-dark font-semibold">خصم لسائقي الغفير</p>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 btn-teal py-3 text-sm">📞 اتصل</button>
                  <button className="flex-1 btn-gold py-3 text-sm">📍 الموقع</button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 glass-card-gold p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-3">🔧 عندك ورشة؟</h3>
            <p className="text-gray-500 mb-6">انضم لمنصة الغفير كورشة معتمدة واحصل على عملاء سائقين</p>
            <button className="btn-gold px-8 py-3">📝 سجّل ورشتك</button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

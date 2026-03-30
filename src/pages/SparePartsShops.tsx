import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function SparePartsShops() {
  const shops = [
    { id: 1, name: 'محل أبو حسن لقطع الغيار', area: 'المنطقة الأولى', discount: '15%', rating: 4.7, phone: '01012345678', speciality: 'موتورات وجير بوكس', status: 'شريك معتمد' },
    { id: 2, name: 'شركة النور لقطع الغيار', area: 'المنطقة الثانية', discount: '10%', rating: 4.5, phone: '01098765432', speciality: 'كهرباء وإضاءة', status: 'شريك معتمد' },
    { id: 3, name: 'مركز الأمان للتوك توك', area: 'المنطقة الثالثة', discount: '20%', rating: 4.9, phone: '01122334455', speciality: 'إطارات وعفشة', status: 'شريك ذهبي' },
    { id: 4, name: 'محلات الفاروق', area: 'المنطقة الأولى', discount: '12%', rating: 4.3, phone: '01234567890', speciality: 'زيوت ومحركات', status: 'شريك معتمد' },
    { id: 5, name: 'مخازن الشرق لقطع الغيار', area: 'المنطقة الثانية', discount: '18%', rating: 4.8, phone: '01555666777', speciality: 'كل قطع الغيار', status: 'شريك ذهبي' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="text-5xl mb-4">🔧</div>
            <h1 className="text-4xl font-black bg-gradient-to-l from-gold to-gold-dark bg-clip-text text-transparent">محلات وشركات قطع الغيار</h1>
            <p className="text-gray-500 mt-3">خصومات حصرية لسائقي الغفير</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map(shop => (
              <div key={shop.id} className="glass-card-gold p-6 hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-xl text-xs font-bold ${
                    shop.status === 'شريك ذهبي' ? 'bg-gold/10 text-gold-dark' : 'bg-teal/10 text-teal'
                  }`}>{shop.status}</span>
                  <span className="text-gold text-sm font-bold">⭐ {shop.rating}</span>
                </div>

                <h3 className="text-lg font-bold text-gray-800 mb-2">{shop.name}</h3>
                <p className="text-sm text-gray-500 mb-1">📍 {shop.area}</p>
                <p className="text-sm text-gray-500 mb-1">🔧 {shop.speciality}</p>
                <p className="text-sm text-gray-500 mb-3">📞 {shop.phone}</p>

                <div className="bg-gold/10 rounded-xl p-3 text-center mb-4">
                  <span className="text-2xl font-black text-gold">{shop.discount}</span>
                  <p className="text-xs text-gold-dark font-semibold">خصم لسائقي الغفير</p>
                </div>

                <button className="btn-teal w-full py-3 text-sm">📞 تواصل الآن</button>
              </div>
            ))}
          </div>

          <div className="mt-12 glass-card p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-3">🤝 انضم كشريك</h3>
            <p className="text-gray-500 mb-6">عندك محل قطع غيار؟ انضم لمنصة الغفير واحصل على عملاء جدد</p>
            <button className="btn-gold px-8 py-3">📝 سجّل كشريك</button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

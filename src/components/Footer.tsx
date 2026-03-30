import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-10 mt-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/images/logo.png" alt="الغفير" className="w-10 h-10 rounded-full object-cover" />
              <span className="text-xl font-bold text-gold">الغفير</span>
            </div>
            <p className="text-gray-500 text-sm">أول نظام أمان وتشغيل للتوك توك في مصر. رحلة آمنة ومنظمة.</p>
          </div>
          <div>
            <h4 className="font-bold text-gray-800 mb-3">روابط سريعة</h4>
            <div className="flex flex-col gap-2">
              <Link to="/" className="text-gray-500 hover:text-gold text-sm">الرئيسية</Link>
              <Link to="/agreement" className="text-gray-500 hover:text-gold text-sm">الاتفاقية</Link>
              <Link to="/signup/client" className="text-gray-500 hover:text-gold text-sm">تسجيل عميل</Link>
              <Link to="/signup/driver" className="text-gray-500 hover:text-gold text-sm">تسجيل سائق</Link>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-gray-800 mb-3">خدماتنا</h4>
            <div className="flex flex-col gap-2">
              <Link to="/shops/parts" className="text-gray-500 hover:text-gold text-sm">قطع الغيار</Link>
              <Link to="/shops/repair" className="text-gray-500 hover:text-gold text-sm">ورش التصليح</Link>
              <Link to="/erp" className="text-gray-500 hover:text-gold text-sm">نظام ERP</Link>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-gray-800 mb-3">تواصل معنا</h4>
            <div className="flex flex-col gap-2 text-gray-500 text-sm">
              <span>📧 info@elghafir.com</span>
              <span>📞 01000000000</span>
              <span>📍 مصر</span>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-100 mt-8 pt-6 text-center">
          <p className="text-gray-400 text-sm">© 2025 الغفير - جميع الحقوق محفوظة</p>
        </div>
      </div>
    </footer>
  );
}

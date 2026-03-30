import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-teal/20 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src="/images/logo.png" alt="الغفير" className="w-12 h-12 rounded-full object-cover border-2 border-gold" />
          <span className="text-2xl font-bold bg-gradient-to-l from-gold to-gold-dark bg-clip-text text-transparent">الغفير</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-gray-700 hover:text-gold font-semibold transition-colors">الرئيسية</Link>
          <Link to="/agreement" className="text-gray-700 hover:text-gold font-semibold transition-colors">الاتفاقية</Link>
          <Link to="/shops/parts" className="text-gray-700 hover:text-gold font-semibold transition-colors">قطع الغيار</Link>
          <Link to="/shops/repair" className="text-gray-700 hover:text-gold font-semibold transition-colors">ورش التصليح</Link>
          <Link to="/login" className="btn-gold text-sm px-6 py-2">تسجيل الدخول</Link>
        </div>

        {/* Mobile Menu Button */}
        <button onClick={() => setOpen(!open)} className="md:hidden text-gray-700 p-2">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg fade-in">
          <div className="flex flex-col p-4 gap-3">
            <Link to="/" onClick={() => setOpen(false)} className="text-gray-700 hover:text-gold font-semibold py-2 border-b border-gray-50">الرئيسية</Link>
            <Link to="/agreement" onClick={() => setOpen(false)} className="text-gray-700 hover:text-gold font-semibold py-2 border-b border-gray-50">الاتفاقية</Link>
            <Link to="/shops/parts" onClick={() => setOpen(false)} className="text-gray-700 hover:text-gold font-semibold py-2 border-b border-gray-50">قطع الغيار</Link>
            <Link to="/shops/repair" onClick={() => setOpen(false)} className="text-gray-700 hover:text-gold font-semibold py-2 border-b border-gray-50">ورش التصليح</Link>
            <Link to="/signup/client" onClick={() => setOpen(false)} className="text-gray-700 hover:text-gold font-semibold py-2 border-b border-gray-50">تسجيل عميل</Link>
            <Link to="/signup/driver" onClick={() => setOpen(false)} className="text-gray-700 hover:text-gold font-semibold py-2 border-b border-gray-50">تسجيل سائق</Link>
            <Link to="/login" onClick={() => setOpen(false)} className="btn-gold text-center text-sm py-2 mt-2">تسجيل الدخول</Link>
          </div>
        </div>
      )}
    </nav>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ERPDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: '📊 نظرة عامة' },
    { id: 'employees', label: '👥 الموظفين' },
    { id: 'finance', label: '💰 المالية' },
    { id: 'inventory', label: '📦 المخزون' },
    { id: 'reports', label: '📈 التقارير' },
    { id: 'commerce', label: '🛒 التجارة' },
  ];

  const employees = [
    { id: 'E001', name: 'أحمد فؤاد', role: 'مدير منطقة', salary: 5000, attendance: '95%', status: 'نشط' },
    { id: 'E002', name: 'محمد حسن', role: 'مشرف', salary: 3500, attendance: '92%', status: 'نشط' },
    { id: 'E003', name: 'سعيد علي', role: 'متابع شارع', salary: 2500, attendance: '88%', status: 'نشط' },
    { id: 'E004', name: 'كريم محمد', role: 'محاسب', salary: 4000, attendance: '97%', status: 'نشط' },
    { id: 'E005', name: 'عمرو حسين', role: 'دعم فني', salary: 3000, attendance: '90%', status: 'إجازة' },
  ];

  const transactions = [
    { id: 'T001', type: 'إيراد', desc: 'اشتراكات سائقين - يناير', amount: 25000, date: '2025-01-15' },
    { id: 'T002', type: 'مصروف', desc: 'رواتب الموظفين', amount: -18000, date: '2025-01-01' },
    { id: 'T003', type: 'إيراد', desc: 'نسبة رحلات', amount: 12500, date: '2025-01-14' },
    { id: 'T004', type: 'مصروف', desc: 'سيرفرات VOIP', amount: -2000, date: '2025-01-10' },
    { id: 'T005', type: 'إيراد', desc: 'عمولة ورش وقطع غيار', amount: 3500, date: '2025-01-12' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/images/logo.png" alt="الغفير" className="w-10 h-10 rounded-full object-cover border-2 border-gold" />
          <div>
            <span className="font-bold text-gold">نظام ERP</span>
            <p className="text-xs text-gray-400">إدارة الموارد والحسابات</p>
          </div>
        </div>
        <Link to="/admin" className="text-gray-400 hover:text-gray-600 text-sm font-semibold">← لوحة التحكم</Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-100 px-4 overflow-x-auto">
        <div className="flex gap-1 py-2">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id ? 'bg-gradient-to-l from-gold to-gold-dark text-white' : 'text-gray-500 hover:bg-gray-50'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="fade-in space-y-6">
            <h2 className="text-2xl font-black text-gray-800">📊 نظرة عامة على النظام</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card-gold p-5 text-center">
                <div className="text-3xl font-black text-gold">41,000</div>
                <div className="text-sm text-gray-500">إجمالي الإيرادات</div>
              </div>
              <div className="glass-card p-5 text-center">
                <div className="text-3xl font-black text-red-500">20,000</div>
                <div className="text-sm text-gray-500">إجمالي المصروفات</div>
              </div>
              <div className="glass-card-gold p-5 text-center">
                <div className="text-3xl font-black text-teal">21,000</div>
                <div className="text-sm text-gray-500">صافي الربح</div>
              </div>
              <div className="glass-card p-5 text-center">
                <div className="text-3xl font-black text-gold">5</div>
                <div className="text-sm text-gray-500">موظفين</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-card p-5">
                <h3 className="font-bold text-gray-800 mb-3">📈 الإيرادات الشهرية</h3>
                <div className="space-y-2">
                  {['يناير', 'ديسمبر', 'نوفمبر'].map((month, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{month}</span>
                      <div className="flex-1 mx-4">
                        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-l from-gold to-gold-light rounded-full" style={{ width: `${90 - i * 15}%` }} />
                        </div>
                      </div>
                      <span className="text-sm font-bold text-gold">{41000 - i * 5000} ج</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass-card-gold p-5">
                <h3 className="font-bold text-gray-800 mb-3">📊 مصادر الدخل</h3>
                <div className="space-y-3">
                  {[
                    { source: 'اشتراكات السائقين', percentage: 60, amount: 25000 },
                    { source: 'نسبة الرحلات', percentage: 30, amount: 12500 },
                    { source: 'عمولة الشركاء', percentage: 10, amount: 3500 },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{item.source}</span>
                        <span className="font-bold text-gold">{item.amount} ج ({item.percentage}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-l from-teal to-teal-light rounded-full" style={{ width: `${item.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Employees */}
        {activeTab === 'employees' && (
          <div className="fade-in space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-gray-800">👥 إدارة الموظفين</h2>
              <button className="btn-gold px-4 py-2 text-sm">+ إضافة موظف</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right py-3 px-3 text-sm text-gray-500 font-semibold">الموظف</th>
                    <th className="text-right py-3 px-3 text-sm text-gray-500 font-semibold">الوظيفة</th>
                    <th className="text-right py-3 px-3 text-sm text-gray-500 font-semibold">الراتب</th>
                    <th className="text-right py-3 px-3 text-sm text-gray-500 font-semibold">الحضور</th>
                    <th className="text-right py-3 px-3 text-sm text-gray-500 font-semibold">الحالة</th>
                    <th className="text-right py-3 px-3 text-sm text-gray-500 font-semibold">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => (
                    <tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-3 font-semibold text-gray-800 text-sm">{emp.name}</td>
                      <td className="py-3 px-3 text-gray-600 text-sm">{emp.role}</td>
                      <td className="py-3 px-3 text-gold font-bold text-sm">{emp.salary} ج</td>
                      <td className="py-3 px-3 text-teal text-sm">{emp.attendance}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                          emp.status === 'نشط' ? 'bg-teal/10 text-teal' : 'bg-gold/10 text-gold-dark'
                        }`}>{emp.status}</span>
                      </td>
                      <td className="py-3 px-3">
                        <button className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-gray-200">تعديل</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Finance */}
        {activeTab === 'finance' && (
          <div className="fade-in space-y-4">
            <h2 className="text-2xl font-black text-gray-800">💰 الحسابات المالية</h2>
            <div className="space-y-3">
              {transactions.map(t => (
                <div key={t.id} className={`glass-card p-4 flex items-center justify-between ${t.type === 'إيراد' ? 'border-teal' : 'border-red-200'}`}>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{t.desc}</p>
                    <p className="text-xs text-gray-400">{t.date}</p>
                  </div>
                  <span className={`font-black text-lg ${t.amount > 0 ? 'text-teal' : 'text-red-500'}`}>
                    {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString()} ج
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inventory */}
        {activeTab === 'inventory' && (
          <div className="fade-in space-y-4">
            <h2 className="text-2xl font-black text-gray-800">📦 المخزون والأصول</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { item: 'أجهزة تتبع GPS', qty: 50, min: 20, status: 'متوفر' },
                { item: 'كروت SIM بيانات', qty: 100, min: 30, status: 'متوفر' },
                { item: 'ستيكرات الغفير', qty: 200, min: 50, status: 'متوفر' },
                { item: 'كروت تعريف السائقين', qty: 15, min: 25, status: 'يحتاج طلب' },
              ].map((item, i) => (
                <div key={i} className={`glass-card p-4 ${item.status === 'يحتاج طلب' ? 'border-red-200' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-800">{item.item}</p>
                      <p className="text-sm text-gray-500">الحد الأدنى: {item.min}</p>
                    </div>
                    <div className="text-left">
                      <div className={`text-2xl font-black ${item.qty > item.min ? 'text-teal' : 'text-red-500'}`}>{item.qty}</div>
                      <span className={`text-xs px-2 py-1 rounded-lg font-bold ${
                        item.status === 'متوفر' ? 'bg-teal/10 text-teal' : 'bg-red-100 text-red-600'
                      }`}>{item.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reports */}
        {activeTab === 'reports' && (
          <div className="fade-in space-y-4">
            <h2 className="text-2xl font-black text-gray-800">📈 التقارير</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: 'تقرير الرحلات اليومي', icon: '🗺️', desc: 'عدد الرحلات والإيرادات اليومية' },
                { title: 'تقرير أداء السائقين', icon: '🛺', desc: 'التقييمات والرحلات لكل سائق' },
                { title: 'تقرير مالي شهري', icon: '💰', desc: 'الإيرادات والمصروفات الشهرية' },
                { title: 'تقرير الطوارئ', icon: '🚨', desc: 'حالات SOS والاستجابة' },
                { title: 'تقرير العملاء', icon: '👤', desc: 'العملاء الجدد والنشاط' },
                { title: 'تقرير الشركاء', icon: '🤝', desc: 'أداء الورش ومحلات قطع الغيار' },
              ].map((report, i) => (
                <div key={i} className="glass-card-gold p-5 hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{report.icon}</div>
                    <div>
                      <h3 className="font-bold text-gray-800">{report.title}</h3>
                      <p className="text-sm text-gray-500">{report.desc}</p>
                    </div>
                  </div>
                  <button className="mt-3 text-gold text-sm font-semibold hover:underline">عرض التقرير ←</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Commerce */}
        {activeTab === 'commerce' && (
          <div className="fade-in space-y-4">
            <h2 className="text-2xl font-black text-gray-800">🛒 التجارة والشراكات</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-card-gold p-5 text-center">
                <div className="text-3xl font-black text-gold">12</div>
                <div className="text-sm text-gray-500">شريك قطع غيار</div>
              </div>
              <div className="glass-card p-5 text-center">
                <div className="text-3xl font-black text-teal">8</div>
                <div className="text-sm text-gray-500">ورشة معتمدة</div>
              </div>
              <div className="glass-card-gold p-5 text-center">
                <div className="text-3xl font-black text-gold">3,500</div>
                <div className="text-sm text-gray-500">عمولة الشهر (جنيه)</div>
              </div>
            </div>

            <div className="glass-card p-5">
              <h3 className="font-bold text-gray-800 mb-4">⚙️ إعداد نسب الخصم والعمولات</h3>
              <div className="space-y-3">
                {['محل أبو حسن', 'شركة النور', 'ورشة الأمان', 'مركز خدمة الغفير'].map((shop, i) => (
                  <div key={i} className="flex items-center justify-between flex-wrap gap-2 p-3 bg-gray-50 rounded-xl">
                    <span className="font-semibold text-gray-700 text-sm">{shop}</span>
                    <div className="flex items-center gap-2">
                      <div>
                        <label className="text-xs text-gray-400">خصم للسائقين</label>
                        <input type="text" placeholder="15%" className="w-20 px-2 py-1 rounded-lg border border-gray-200 text-sm bg-white" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">عمولتنا</label>
                        <input type="text" placeholder="5%" className="w-20 px-2 py-1 rounded-lg border border-gray-200 text-sm bg-white" />
                      </div>
                      <button className="bg-gold text-white px-3 py-1 rounded-lg text-sm font-bold mt-4">حفظ</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

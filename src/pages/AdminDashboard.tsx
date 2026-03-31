import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  useDashboardStats, useDrivers, useClients, useActiveRides,
  useAllRides, useSOSAlerts, usePartners, useAreas,
  approveDriver, rejectDriver, updateDriverSettings,
  resolveSOSAlert, saveSetting, sendPTTSignal,
  saveArea, deleteArea, type Area,
} from '../hooks/useFirestore';

const EMPTY_AREA: Omit<Area, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '', city: '',
  baseFare: 5, perKmRate: 3, minFare: 8, maxFare: undefined,
  supervisors: [], areaManagerId: undefined,
  active: true,
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showWalkie, setShowWalkie] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<{uid:string;name:string;ext?:string}|null>(null);
  const [isTalking, setIsTalking] = useState(false);
  const [editingDriver, setEditingDriver] = useState<string|null>(null);
  const [driverEdits, setDriverEdits] = useState<Record<string,any>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [cloudSettings, setCloudSettings] = useState({cloudName:'',uploadPreset:'',apiKey:''});
  const [voipSettings, setVoipSettings] = useState({server:'',port:'5060',wsUrl:'',realm:'',adminExt:'',adminExtPass:''});

  // Areas state
  const { areas } = useAreas();
  const [editingArea, setEditingArea] = useState<string|null>(null); // null = no edit, 'new' = new
  const [areaForm, setAreaForm] = useState<Omit<Area,'id'|'createdAt'|'updatedAt'>>(EMPTY_AREA);
  const [supervisorInput, setSupervisorInput] = useState(''); // phone number to add as supervisor

  const stats = useDashboardStats();
  const { drivers } = useDrivers();
  const pendingDrivers = drivers.filter(d => d.status === 'pending');
  const activeDrivers = drivers.filter(d => d.status === 'active');
  const { clients } = useClients();
  const { rides } = useAllRides();
  const activeRides = useActiveRides();
  const sosAlerts = useSOSAlerts();
  const partners = usePartners();

  const canApprove = user?.role === 'super_admin' || user?.role === 'supervisor';
  const canSettings = user?.role === 'super_admin';
  const canAreas = user?.role === 'super_admin' || user?.role === 'area_manager';

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const tabs = [
    { id: 'overview', label: '📊 نظرة عامة' },
    { id: 'areas', label: `📍 المناطق (${areas.length})` },
    { id: 'pending', label: `⏳ طلبات (${pendingDrivers.length})` },
    { id: 'drivers', label: '🛺 السائقين' },
    { id: 'clients', label: '👤 العملاء' },
    { id: 'trips', label: '🗺️ الرحلات' },
    { id: 'sos', label: `🚨 SOS ${sosAlerts.length > 0 ? `(${sosAlerts.length})` : ''}` },
    { id: 'partners', label: '🔧 الشركاء' },
    { id: 'settings', label: '⚙️ الإعدادات' },
  ];

  const handleApprove = async (uid: string) => { await approveDriver(uid, user!.uid); showToast('✅ تم قبول السائق'); };
  const handleReject = async (uid: string) => {
    const reason = prompt('سبب الرفض:') || 'لم تستوفِ الشروط';
    await rejectDriver(uid, reason); showToast('❌ تم رفض السائق');
  };
  const handleSaveDriverEdit = async (uid: string) => {
    setSaving(true);
    await updateDriverSettings(uid, driverEdits);
    setSaving(false); setEditingDriver(null); setDriverEdits({});
    showToast('💾 تم الحفظ');
  };
  const startPTT = async () => { if (!selectedDriver) return; setIsTalking(true); await sendPTTSignal(selectedDriver.uid, true, user?.name || 'الإدارة'); };
  const stopPTT = async () => { if (!selectedDriver) return; setIsTalking(false); await sendPTTSignal(selectedDriver.uid, false, ''); };
  const callDriver = (d: {uid:string;name:string;voipExtension?:string}) => { setSelectedDriver({uid:d.uid,name:d.name,ext:d.voipExtension}); setShowWalkie(true); };
  const handleSuspend = async (uid: string, status: string) => {
    const ns = status === 'suspended' ? 'active' : 'suspended';
    await updateDoc(doc(db,'users',uid),{status:ns,updatedAt:serverTimestamp()});
    showToast(ns === 'suspended' ? '⏸ تم الإيقاف' : '▶️ تم التفعيل');
  };

  // Area handlers
  const startNewArea = () => {
    setAreaForm(EMPTY_AREA);
    setSupervisorInput('');
    setEditingArea('new');
  };
  const startEditArea = (area: Area) => {
    setAreaForm({
      name: area.name, city: area.city,
      baseFare: area.baseFare, perKmRate: area.perKmRate,
      minFare: area.minFare, maxFare: area.maxFare,
      supervisors: area.supervisors || [],
      areaManagerId: area.areaManagerId,
      active: area.active,
    });
    setSupervisorInput('');
    setEditingArea(area.id);
  };
  const handleSaveArea = async () => {
    if (!areaForm.name.trim() || !areaForm.city.trim()) { showToast('⚠️ اكتب اسم المنطقة والمدينة'); return; }
    setSaving(true);
    try {
      await saveArea(areaForm, editingArea === 'new' ? undefined : editingArea!);
      showToast(editingArea === 'new' ? '✅ تم إضافة المنطقة' : '💾 تم تحديث المنطقة');
      setEditingArea(null);
    } catch (e: any) { showToast('❌ ' + e.message); }
    setSaving(false);
  };
  const handleDeleteArea = async (id: string, name: string) => {
    if (!confirm(`حذف منطقة "${name}"؟`)) return;
    await deleteArea(id);
    showToast('🗑️ تم الحذف');
  };

  // Add supervisor by phone
  const addSupervisorByPhone = () => {
    const phone = supervisorInput.trim();
    if (!phone) return;
    // Find driver/supervisor user with this phone
    const found = drivers.find(d => d.phone === phone) || clients.find(c => c.phone === phone);
    if (!found) { showToast('⚠️ لا يوجد مستخدم بهذا الرقم'); return; }
    if (areaForm.supervisors.includes(found.uid)) { showToast('⚠️ موجود بالفعل'); return; }
    setAreaForm(p => ({ ...p, supervisors: [...p.supervisors, found.uid] }));
    setSupervisorInput('');
    showToast(`✅ تم إضافة ${found.name}`);
  };
  const removeSupervisor = (uid: string) => {
    setAreaForm(p => ({ ...p, supervisors: p.supervisors.filter(s => s !== uid) }));
  };
  const getSupervisorName = (uid: string) => {
    const u = [...drivers, ...clients].find(d => d.uid === uid);
    return u ? `${u.name} (${u.phone})` : uid;
  };

  return (
    <div className="min-h-screen bg-white">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white border border-gold/30 shadow-xl rounded-2xl px-6 py-3 font-bold text-gray-800 fade-in">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <img src="/images/logo.png" className="w-10 h-10 rounded-full border-2 border-gold" />
          <div>
            <p className="font-bold text-gold text-sm">لوحة التحكم</p>
            <p className="text-xs text-gray-400">{user?.name} — {user?.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {stats.liveRides > 0 && (
            <span className="text-xs bg-teal/10 text-teal px-3 py-1 rounded-full font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-teal animate-pulse inline-block"/>
              {stats.liveRides} مباشر
            </span>
          )}
          {sosAlerts.length > 0 && (
            <button onClick={() => setActiveTab('sos')} className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded-full font-bold animate-pulse">
              🚨 {sosAlerts.length} SOS
            </button>
          )}
          <button onClick={async () => { await logout(); navigate('/login'); }} className="text-gray-400 hover:text-red-500 text-sm font-semibold">خروج</button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-16 md:w-52 bg-white border-l border-gray-100 min-h-screen p-2 sticky top-16 self-start">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`w-full flex items-center gap-2 px-2 md:px-3 py-3 rounded-xl text-sm mb-1 transition-all ${
                activeTab === t.id ? 'bg-gradient-to-l from-gold to-gold-dark text-white shadow' : 'text-gray-600 hover:bg-gray-50'
              }`}>
              <span>{t.label.split(' ')[0]}</span>
              <span className="hidden md:inline font-semibold">{t.label.split(' ').slice(1).join(' ')}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 p-4 md:p-6 overflow-auto">

          {/* Overview */}
          {activeTab === 'overview' && (
            <div className="fade-in space-y-5">
              <h2 className="text-xl font-black">📊 نظرة عامة</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  {n:stats.activeDrivers,l:'سائق متصل',c:'text-gold'},
                  {n:stats.clients,l:'عميل مسجل',c:'text-teal'},
                  {n:stats.liveRides,l:'رحلة الآن',c:'text-gold'},
                  {n:stats.pendingDrivers,l:'انتظار موافقة',c:'text-teal'},
                ].map((s,i) => (
                  <div key={i} className={`${i%2===0?'glass-card-gold':'glass-card'} p-4 text-center`}>
                    <div className={`text-3xl font-black ${s.c}`}>{s.n}</div>
                    <div className="text-xs text-gray-500 mt-1">{s.l}</div>
                  </div>
                ))}
              </div>
              {/* Areas summary */}
              <div className="glass-card p-4">
                <h3 className="font-bold mb-3">📍 المناطق النشطة ({areas.filter(a=>a.active).length})</h3>
                {areas.filter(a=>a.active).slice(0,3).map(a => (
                  <div key={a.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="font-semibold text-sm">{a.name}</p>
                      <p className="text-xs text-gray-400">{a.city}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-gold font-bold">{a.baseFare}ج + {a.perKmRate}ج/كم</p>
                      <p className="text-xs text-gray-400">حد أدنى {a.minFare}ج</p>
                    </div>
                  </div>
                ))}
                <button onClick={() => setActiveTab('areas')} className="text-gold text-sm font-semibold mt-2 block">إدارة المناطق ←</button>
              </div>
              {sosAlerts.length > 0 && (
                <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-4">
                  <p className="font-black text-red-600">🚨 {sosAlerts.length} تنبيه طوارئ نشط!</p>
                  <button onClick={() => setActiveTab('sos')} className="text-red-500 text-sm underline">عرض التنبيهات ←</button>
                </div>
              )}
            </div>
          )}

          {/* === AREAS TAB === */}
          {activeTab === 'areas' && (
            <div className="fade-in space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black">📍 المناطق والتسعير</h2>
                {canAreas && editingArea === null && (
                  <button onClick={startNewArea} className="btn-gold py-2 px-4 text-sm">+ منطقة جديدة</button>
                )}
              </div>

              {!canAreas && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 font-semibold text-sm">
                  لا تملك صلاحية إدارة المناطق
                </div>
              )}

              {/* Add / Edit Form */}
              {canAreas && editingArea !== null && (
                <div className="glass-card-gold p-5 space-y-4">
                  <h3 className="font-black text-lg">
                    {editingArea === 'new' ? '➕ منطقة جديدة' : '✏️ تعديل المنطقة'}
                  </h3>

                  {/* Basic info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">اسم المنطقة *</label>
                      <input value={areaForm.name} onChange={e => setAreaForm(p=>({...p,name:e.target.value}))}
                        placeholder="مثال: وسط المنصورة"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-gold outline-none text-sm bg-white" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">المدينة *</label>
                      <input value={areaForm.city} onChange={e => setAreaForm(p=>({...p,city:e.target.value}))}
                        placeholder="المنصورة"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-gold outline-none text-sm bg-white" />
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="bg-white rounded-xl p-4 border border-gold/20">
                    <p className="font-bold text-sm text-gray-700 mb-3">💰 التسعير</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">الأجرة الأساسية (جنيه)</label>
                        <input type="number" min="0" value={areaForm.baseFare}
                          onChange={e => setAreaForm(p=>({...p,baseFare:+e.target.value}))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none text-sm bg-white focus:border-gold" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">سعر الكيلومتر (جنيه/كم)</label>
                        <input type="number" min="0" step="0.5" value={areaForm.perKmRate}
                          onChange={e => setAreaForm(p=>({...p,perKmRate:+e.target.value}))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none text-sm bg-white focus:border-gold" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">الحد الأدنى (جنيه)</label>
                        <input type="number" min="0" value={areaForm.minFare}
                          onChange={e => setAreaForm(p=>({...p,minFare:+e.target.value}))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none text-sm bg-white focus:border-gold" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">الحد الأقصى (اختياري)</label>
                        <input type="number" min="0" value={areaForm.maxFare ?? ''}
                          onChange={e => setAreaForm(p=>({...p,maxFare:e.target.value?+e.target.value:undefined}))}
                          placeholder="بلا حد"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none text-sm bg-white focus:border-gold" />
                      </div>
                    </div>
                    {/* Preview */}
                    <div className="mt-3 bg-gold/5 rounded-lg p-3 text-xs text-gray-600">
                      <span className="font-semibold">معاينة: </span>
                      رحلة 2 كم = <span className="font-black text-gold">
                        {Math.max(areaForm.minFare, Math.round(areaForm.baseFare + 2 * areaForm.perKmRate))} ج
                      </span>
                      {' · '}
                      رحلة 5 كم = <span className="font-black text-gold">
                        {areaForm.maxFare
                          ? Math.min(areaForm.maxFare, Math.max(areaForm.minFare, Math.round(areaForm.baseFare + 5 * areaForm.perKmRate)))
                          : Math.max(areaForm.minFare, Math.round(areaForm.baseFare + 5 * areaForm.perKmRate))
                        } ج
                      </span>
                    </div>
                  </div>

                  {/* Supervisors */}
                  <div className="bg-white rounded-xl p-4 border border-teal/20">
                    <p className="font-bold text-sm text-gray-700 mb-3">👮 المشرفون على المنطقة</p>
                    {areaForm.supervisors.length === 0 && (
                      <p className="text-xs text-gray-400 mb-2">لا يوجد مشرفون بعد</p>
                    )}
                    {areaForm.supervisors.map(uid => (
                      <div key={uid} className="flex items-center justify-between bg-teal/5 rounded-lg px-3 py-2 mb-2 text-sm">
                        <span className="text-gray-700">{getSupervisorName(uid)}</span>
                        <button onClick={() => removeSupervisor(uid)} className="text-red-400 font-bold text-xs">✕</button>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-2">
                      <input value={supervisorInput} onChange={e => setSupervisorInput(e.target.value)}
                        placeholder="رقم موبايل المشرف"
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 outline-none text-sm bg-white focus:border-teal" />
                      <button onClick={addSupervisorByPhone}
                        className="bg-teal/10 text-teal px-3 py-2 rounded-lg text-sm font-bold border border-teal/20">
                        + إضافة
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">المشرف لازم يكون مسجّل في النظام أولاً</p>
                  </div>

                  {/* Active toggle */}
                  <div className="flex items-center justify-between bg-white rounded-xl p-3 border border-gray-200">
                    <span className="font-semibold text-sm text-gray-700">المنطقة نشطة؟</span>
                    <button onClick={() => setAreaForm(p=>({...p,active:!p.active}))}
                      className={`w-14 h-7 rounded-full transition-all relative ${areaForm.active?'bg-teal':'bg-gray-300'}`}>
                      <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all ${areaForm.active?'right-0.5':'right-7'}`}/>
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={handleSaveArea} disabled={saving} className="flex-1 btn-gold py-3 disabled:opacity-60">
                      {saving ? '⏳...' : '💾 حفظ'}
                    </button>
                    <button onClick={() => setEditingArea(null)} className="bg-gray-100 text-gray-500 px-5 py-3 rounded-xl font-bold">
                      إلغاء
                    </button>
                  </div>
                </div>
              )}

              {/* Areas List */}
              {areas.length === 0 && editingArea === null && (
                <div className="glass-card p-10 text-center text-gray-400">
                  <p className="text-4xl mb-3">📍</p>
                  <p>لا توجد مناطق بعد — أضف منطقة لتحديد التسعير</p>
                </div>
              )}

              {areas.map(area => (
                <div key={area.id} className={`glass-card p-5 ${!area.active ? 'opacity-60' : ''}`}>
                  <div className="flex justify-between items-start flex-wrap gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-black text-gray-800">{area.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${area.active ? 'bg-teal/10 text-teal' : 'bg-gray-100 text-gray-400'}`}>
                          {area.active ? '● نشط' : '○ معطّل'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">🏙️ {area.city}</p>
                      <div className="flex gap-3 mt-2 flex-wrap">
                        <span className="text-xs bg-gold/10 text-gold-dark px-2 py-1 rounded-lg font-bold">
                          أساسي: {area.baseFare} ج
                        </span>
                        <span className="text-xs bg-teal/10 text-teal px-2 py-1 rounded-lg font-bold">
                          {area.perKmRate} ج/كم
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-bold">
                          أدنى: {area.minFare} ج
                        </span>
                        {area.maxFare && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-bold">
                            أقصى: {area.maxFare} ج
                          </span>
                        )}
                      </div>
                      {area.supervisors?.length > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                          👮 {area.supervisors.length} مشرف
                        </p>
                      )}
                    </div>
                    {canAreas && (
                      <div className="flex gap-2">
                        <button onClick={() => startEditArea(area)}
                          className="bg-gold/10 text-gold-dark px-3 py-1.5 rounded-lg text-xs font-bold">
                          ✏️ تعديل
                        </button>
                        <button onClick={() => handleDeleteArea(area.id, area.name)}
                          className="bg-red-100 text-red-500 px-3 py-1.5 rounded-lg text-xs font-bold">
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pending */}
          {activeTab === 'pending' && (
            <div className="fade-in space-y-4">
              <h2 className="text-xl font-black">⏳ طلبات السائقين ({pendingDrivers.length})</h2>
              {pendingDrivers.length === 0 && <div className="glass-card p-10 text-center text-gray-400">لا توجد طلبات معلقة ✅</div>}
              {pendingDrivers.map(d => (
                <div key={d.uid} className="glass-card-gold p-5">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center text-2xl">🛺</div>
                      <div>
                        <p className="font-bold">{d.name}</p>
                        <p className="text-sm text-gray-500">{d.phone}</p>
                        {(d as any).area && <p className="text-xs text-gray-400">📍 {(d as any).area}</p>}
                        {(d as any).vehicleType && <p className="text-xs text-gray-400">🛺 {(d as any).vehicleType}</p>}
                        {(d as any).nationalId && <p className="text-xs text-gray-400">🪪 {(d as any).nationalId}</p>}
                      </div>
                    </div>
                    {canApprove ? (
                      <div className="flex gap-2">
                        <button onClick={() => handleApprove(d.uid)} className="bg-teal text-white px-4 py-2 rounded-xl font-bold text-sm">✅ قبول</button>
                        <button onClick={() => handleReject(d.uid)} className="bg-red-100 text-red-600 px-4 py-2 rounded-xl font-bold text-sm">❌ رفض</button>
                      </div>
                    ) : <span className="text-gray-400 text-sm">لا تملك صلاحية القبول</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Drivers */}
          {activeTab === 'drivers' && (
            <div className="fade-in space-y-3">
              <h2 className="text-xl font-black">🛺 السائقين النشطين ({activeDrivers.length})</h2>
              {activeDrivers.map(d => (
                <div key={d.uid} className="glass-card p-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center overflow-hidden">🛺</div>
                      <div>
                        <p className="font-bold">{d.name}</p>
                        <p className="text-sm text-gray-500">{d.phone}</p>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${d.isOnline?'bg-teal/10 text-teal':'bg-gray-100 text-gray-400'}`}>
                            {d.isOnline?'🟢 متصل':'⚫ غير متصل'}
                          </span>
                          {d.voipExtension && <span className="text-xs bg-gold/10 text-gold-dark px-2 py-0.5 rounded-full">🎙️ {d.voipExtension}</span>}
                          {d.paymentType && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {d.paymentType==='percent'?`نسبة ${d.paymentValue}%`:`ثابت ${d.paymentValue} ج`}
                          </span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      <span className="text-sm text-gold">⭐ {d.rating?.toFixed(1)}</span>
                      <button onClick={() => callDriver(d)} className="bg-teal/10 text-teal px-3 py-1 rounded-lg text-xs font-bold">📡</button>
                      <button onClick={() => { setEditingDriver(d.uid); setDriverEdits({voipExtension:d.voipExtension||'',voipPassword:'',paymentType:d.paymentType||'percent',paymentValue:d.paymentValue||20}); }}
                        className="bg-gold/10 text-gold-dark px-3 py-1 rounded-lg text-xs font-bold">⚙️</button>
                      <button onClick={() => handleSuspend(d.uid, d.status)} className="bg-gray-100 text-gray-500 px-3 py-1 rounded-lg text-xs font-bold">
                        {d.status==='suspended'?'▶️':'⏸'}
                      </button>
                    </div>
                  </div>
                  {editingDriver === d.uid && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 fade-in">
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        {[
                          {k:'voipExtension',l:'🎙️ امتداد VoIP',p:'201',t:'text'},
                          {k:'voipPassword',l:'🔐 كلمة مرور',p:'••••••',t:'password'},
                        ].map(f => (
                          <div key={f.k}>
                            <label className="text-xs text-gray-500 mb-1 block">{f.l}</label>
                            <input type={f.t} value={driverEdits[f.k]||''} onChange={e=>setDriverEdits(p=>({...p,[f.k]:e.target.value}))}
                              placeholder={f.p} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white outline-none focus:border-teal"/>
                          </div>
                        ))}
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">💰 نظام الدفع</label>
                          <select value={driverEdits.paymentType||'percent'} onChange={e=>setDriverEdits(p=>({...p,paymentType:e.target.value}))}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white outline-none">
                            <option value="percent">نسبة %</option>
                            <option value="fixed">مبلغ ثابت</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">{driverEdits.paymentType==='percent'?'النسبة %':'المبلغ (ج)'}</label>
                          <input type="number" value={driverEdits.paymentValue||''} onChange={e=>setDriverEdits(p=>({...p,paymentValue:parseFloat(e.target.value)}))}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white outline-none"/>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={()=>handleSaveDriverEdit(d.uid)} disabled={saving} className="btn-teal py-2 px-4 text-sm">{saving?'⏳...':'💾 حفظ'}</button>
                        <button onClick={()=>setEditingDriver(null)} className="bg-gray-200 text-gray-600 py-2 px-4 rounded-xl text-sm font-bold">إلغاء</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Clients */}
          {activeTab === 'clients' && (
            <div className="fade-in space-y-3">
              <h2 className="text-xl font-black">👤 العملاء ({clients.length})</h2>
              {clients.map(c => (
                <div key={c.uid} className="glass-card p-4 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">👤</div>
                    <div>
                      <p className="font-bold">{c.name}</p>
                      <p className="text-sm text-gray-500">{c.phone}</p>
                      {c.familyHeadId && <p className="text-xs text-teal">👨‍👩‍👧 عائلة</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">{c.totalRides} رحلة</span>
                    <span className="text-sm text-gold">⭐ {c.rating?.toFixed(1)}</span>
                    <button onClick={()=>handleSuspend(c.uid,c.status)} className={`text-xs px-3 py-1 rounded-lg font-bold ${c.status==='suspended'?'bg-teal/10 text-teal':'bg-gray-100 text-gray-400'}`}>
                      {c.status==='suspended'?'▶️':'⏸'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Trips */}
          {activeTab === 'trips' && (
            <div className="fade-in space-y-4">
              <h2 className="text-xl font-black">🗺️ الرحلات</h2>
              <div className="glass-card p-4">
                <h3 className="font-bold mb-3">📍 مباشر ({activeRides.length})</h3>
                {activeRides.length===0 && <p className="text-gray-400 text-sm text-center py-4">لا توجد رحلات مباشرة</p>}
                {activeRides.map(r => (
                  <div key={r.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-semibold text-sm">{r.clientName} ← {r.driverName||'?'}</p>
                      <p className="text-xs text-gray-400">{r.pickupAddress}</p>
                      {(r as any).areaName && <p className="text-xs text-gold">{(r as any).areaName}</p>}
                    </div>
                    <div className="text-left">
                      <span className="text-xs bg-teal/10 text-teal px-2 py-1 rounded-full font-bold block">{r.status}</span>
                      <span className="text-xs text-gold font-bold">{r.price} ج</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-gray-500 text-right">
                    <th className="py-2 px-2">العميل</th>
                    <th className="py-2 px-2">السائق</th>
                    <th className="py-2 px-2">المنطقة</th>
                    <th className="py-2 px-2">الحالة</th>
                    <th className="py-2 px-2">السعر</th>
                  </tr></thead>
                  <tbody>
                    {rides.map(r => (
                      <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2 px-2">{r.clientName}</td>
                        <td className="py-2 px-2">{r.driverName||'—'}</td>
                        <td className="py-2 px-2 text-xs text-gray-400">{(r as any).areaName||'—'}</td>
                        <td className="py-2 px-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${r.status==='completed'?'bg-teal/10 text-teal':r.status==='cancelled'?'bg-red-100 text-red-500':'bg-gold/10 text-gold-dark'}`}>{r.status}</span>
                        </td>
                        <td className="py-2 px-2 font-bold text-gold">{r.price||0} ج</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SOS */}
          {activeTab === 'sos' && (
            <div className="fade-in space-y-4">
              <h2 className="text-xl font-black text-red-600">🚨 تنبيهات الطوارئ ({sosAlerts.length})</h2>
              {sosAlerts.length===0 && <div className="glass-card p-10 text-center text-gray-400">✅ لا توجد تنبيهات نشطة</div>}
              {sosAlerts.map(a => (
                <div key={a.id} className="bg-red-50 border-2 border-red-300 rounded-2xl p-5">
                  <div className="flex justify-between flex-wrap gap-3">
                    <div>
                      <p className="font-bold text-red-700">🚨 نداء طوارئ</p>
                      <p className="text-sm text-gray-600">👤 {a.userName} | 📞 {a.userPhone}</p>
                      {a.lat && <p className="text-xs text-gray-400 mt-1">📍 {a.lat?.toFixed(4)}, {a.lng?.toFixed(4)}</p>}
                    </div>
                    <button onClick={()=>resolveSOSAlert(a.id,user!.uid)} className="bg-teal text-white px-4 py-2 rounded-xl font-bold text-sm">✅ تم الحل</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Partners */}
          {activeTab === 'partners' && (
            <div className="fade-in space-y-3">
              <h2 className="text-xl font-black">🔧 الشركاء ({partners.length})</h2>
              {partners.map((p:any) => (
                <div key={p.id} className="glass-card p-4 flex justify-between items-center flex-wrap gap-3">
                  <div>
                    <p className="font-bold">{p.businessName}</p>
                    <p className="text-sm text-gray-500">{p.type} | خصم {p.discountPercent}%</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${p.status==='active'?'bg-teal/10 text-teal':'bg-gray-100 text-gray-400'}`}>{p.status}</span>
                    {p.status==='pending' && (
                      <button onClick={()=>updateDoc(doc(db,'partners',p.id),{status:'active',updatedAt:serverTimestamp()})}
                        className="bg-teal/10 text-teal px-3 py-1 rounded-lg text-xs font-bold">✅ قبول</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Settings */}
          {activeTab === 'settings' && (
            <div className="fade-in space-y-6">
              <h2 className="text-xl font-black">⚙️ إعدادات النظام</h2>
              {!canSettings && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 font-semibold">لا تملك صلاحية الإعدادات</div>}
              {canSettings && (
                <>
                  <div className="glass-card-gold p-6">
                    <h3 className="font-black text-lg mb-1">☁️ Cloudinary</h3>
                    <div className="space-y-3">
                      {[{k:'cloudName',l:'Cloud Name',p:'your-cloud'},{k:'uploadPreset',l:'Upload Preset',p:'ghafeer_preset'},{k:'apiKey',l:'API Key',p:'123...'}].map(f => (
                        <div key={f.k}>
                          <label className="text-sm font-semibold text-gray-600 block mb-1">{f.l}</label>
                          <input value={(cloudSettings as any)[f.k]} onChange={e=>setCloudSettings(p=>({...p,[f.k]:e.target.value}))}
                            placeholder={f.p} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gold outline-none bg-white"/>
                        </div>
                      ))}
                      <button onClick={async()=>{await saveSetting('cloudinary',cloudSettings);showToast('☁️ تم الحفظ');}} className="btn-gold w-full py-3">💾 حفظ</button>
                    </div>
                  </div>
                  <div className="glass-card p-6">
                    <h3 className="font-black text-lg mb-1">📞 VoIP</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[{k:'server',l:'IP',p:'192.168.1.100'},{k:'port',l:'Port',p:'5060'},{k:'wsUrl',l:'WebSocket',p:'wss://...'},{k:'adminExt',l:'امتداد الأدمن',p:'100'},{k:'adminExtPass',l:'كلمة المرور',p:'••••'},{k:'realm',l:'Realm',p:'domain.com'}].map(f => (
                        <div key={f.k}>
                          <label className="text-xs font-semibold text-gray-600 block mb-1">{f.l}</label>
                          <input type={f.k.includes('Pass')?'password':'text'} value={(voipSettings as any)[f.k]} onChange={e=>setVoipSettings(p=>({...p,[f.k]:e.target.value}))}
                            placeholder={f.p} className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none bg-white text-sm"/>
                        </div>
                      ))}
                    </div>
                    <button onClick={async()=>{await saveSetting('voip',voipSettings);showToast('📞 تم الحفظ');}} className="btn-teal w-full py-3 mt-4">💾 حفظ</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Walkie Modal */}
      {showWalkie && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-8 text-center shadow-2xl slide-up">
            <div className={`w-24 h-24 rounded-full bg-gradient-to-br from-teal to-teal-dark mx-auto mb-4 flex items-center justify-center ${isTalking?'walkie-pulse':''}`}>
              <span className="text-5xl">📡</span>
            </div>
            <h3 className="text-xl font-bold mb-1">وكي توكي</h3>
            <p className="text-gray-500 text-sm mb-4">الاتصال بـ: {selectedDriver?.name}</p>
            <div className="bg-gray-50 rounded-xl p-4 mb-4 text-sm text-gray-500">
              {isTalking ? '🎙️ تتحدث الآن...' : '🔊 جاهز'}
            </div>
            <button onMouseDown={startPTT} onMouseUp={stopPTT} onTouchStart={startPTT} onTouchEnd={stopPTT}
              className={`w-full py-5 rounded-xl font-bold text-lg mb-3 ${isTalking?'bg-red-500 text-white shadow-lg':'btn-teal'}`}>
              {isTalking ? '🎙️ تحدث الآن...' : '🎙️ اضغط مع الاستمرار'}
            </button>
            <button onClick={()=>{setShowWalkie(false);if(isTalking)stopPTT();}} className="w-full py-3 bg-red-100 text-red-600 rounded-xl font-bold">إنهاء</button>
          </div>
        </div>
      )}
    </div>
  );
}

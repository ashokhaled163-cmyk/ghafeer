import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function TripPage() {
  const [landmarks, setLandmarks] = useState([
    { name: 'نقطة الانطلاق - شارع المحطة', done: true },
    { name: 'التقاطع الرئيسي', done: true },
    { name: 'كوبري النهر', done: false },
    { name: 'ميدان المدرسة', done: false },
    { name: 'شارع السوق', done: false },
    { name: 'الوجهة النهائية - البيت', done: false },
  ]);

  const toggleLandmark = (index: number) => {
    setLandmarks(prev => prev.map((l, i) => i === index ? { ...l, done: true } : l));
  };

  const progress = (landmarks.filter(l => l.done).length / landmarks.length) * 100;

  const qrData = JSON.stringify({
    rideId: 'R-2025-001',
    clientId: 'C001',
    driverId: 'D001',
    otp: '4829',
    timestamp: new Date().toISOString(),
  });

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Header */}
        <div className="glass-card-gold p-5 text-center">
          <h1 className="text-2xl font-black bg-gradient-to-l from-gold to-gold-dark bg-clip-text text-transparent">🛺 تفاصيل الرحلة</h1>
          <p className="text-gray-500 text-sm mt-1">رحلة #R-2025-001</p>
        </div>

        {/* QR with Logo */}
        <div className="glass-card-gold p-6 text-center">
          <h3 className="font-bold text-gray-800 mb-3">🎫 كود الرحلة</h3>
          <div className="flex justify-center mb-3">
            <div className="bg-white p-4 rounded-2xl shadow-inner border border-gold/20 inline-block">
              <QRCodeSVG
                value={qrData}
                size={200}
                bgColor="#ffffff"
                fgColor="#1a1a1a"
                level="H"
                imageSettings={{
                  src: '/images/logo.png',
                  x: undefined,
                  y: undefined,
                  height: 40,
                  width: 40,
                  excavate: true,
                }}
              />
            </div>
          </div>
          <p className="text-xs text-gray-400">اللوجو في المنتصف - كود فريد لكل رحلة</p>
        </div>

        {/* Progress */}
        <div className="glass-card p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-gray-700 text-sm">تقدم الرحلة</span>
            <span className="text-teal font-bold text-sm">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-l from-teal to-teal-light rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Landmarks */}
        <div className="glass-card p-5">
          <h3 className="font-bold text-gray-800 mb-4">🗺️ مسار الرحلة بالمعالم</h3>
          <div className="space-y-2">
            {landmarks.map((landmark, i) => (
              <button
                key={i}
                onClick={() => !landmark.done && toggleLandmark(i)}
                disabled={landmark.done}
                className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all text-right ${
                  landmark.done ? 'landmark-done' : 'landmark-pending hover:border-teal'
                }`}
              >
                <span className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  landmark.done ? 'bg-white/30 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {landmark.done ? '✓' : i + 1}
                </span>
                <div className="flex-1">
                  <span className={`font-semibold text-sm block ${landmark.done ? 'text-white' : 'text-gray-700'}`}>{landmark.name}</span>
                  {landmark.done && <span className="text-white/70 text-xs">تم المرور ✓</span>}
                </div>
                {!landmark.done && <span className="text-xs text-gray-400">⬅ اضغط</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Trip Info */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card p-3 text-center">
            <div className="text-lg font-black text-gold">12</div>
            <div className="text-[10px] text-gray-500">دقيقة</div>
          </div>
          <div className="glass-card p-3 text-center">
            <div className="text-lg font-black text-teal">2.5</div>
            <div className="text-[10px] text-gray-500">كم</div>
          </div>
          <div className="glass-card p-3 text-center">
            <div className="text-lg font-black text-gold">15</div>
            <div className="text-[10px] text-gray-500">جنيه</div>
          </div>
        </div>

        {landmarks.every(l => l.done) && (
          <button className="btn-gold w-full py-4 text-lg walkie-pulse fade-in">
            🏁 إنهاء الرحلة
          </button>
        )}
      </div>
    </div>
  );
}

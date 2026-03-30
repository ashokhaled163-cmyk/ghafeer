import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePTTSignal } from '../hooks/useFirestore';

// صفحة الواكي توكي للسائق - بتستمع لإشارات PTT من الإدارة
export default function WalkieTalkie() {
  const { user } = useAuth();
  const pttSignal = usePTTSignal(user?.uid || '');
  const [isTalking, setIsTalking] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (pttSignal?.active) {
      setShowAlert(true);
      // صوت تنبيه عند وصول اتصال
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.value = 0.3;
        osc.start(); osc.stop(ctx.currentTime + 0.3);
      } catch(e) {}
    } else {
      setShowAlert(false);
    }
  }, [pttSignal?.active]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        {showAlert && pttSignal?.active ? (
          <div className="glass-card-gold p-8 fade-in">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-gold to-gold-dark mx-auto mb-6 flex items-center justify-center walkie-pulse shadow-xl">
              <span className="text-6xl">📡</span>
            </div>
            <h2 className="text-2xl font-black text-gray-800 mb-2">📞 اتصال من الإدارة</h2>
            <p className="text-gray-500 mb-6">{pttSignal.adminName || 'الإدارة'} بتتكلم معاك</p>
            <div className="bg-gold/10 rounded-xl p-4 mb-6">
              <p className="text-gold-dark font-semibold text-sm">🔊 استمع للرسالة</p>
              <p className="text-gray-500 text-xs mt-1">لما يخلصوا الكلام، ممكن ترد</p>
            </div>
            <button
              onMouseDown={() => setIsTalking(true)}
              onMouseUp={() => setIsTalking(false)}
              onTouchStart={() => setIsTalking(true)}
              onTouchEnd={() => setIsTalking(false)}
              className={`w-full py-5 rounded-xl font-bold text-lg transition-all ${isTalking ? 'bg-red-500 text-white shadow-lg' : 'btn-teal'}`}>
              {isTalking ? '🎙️ تتكلم الآن...' : '🎙️ اضغط للرد'}
            </button>
          </div>
        ) : (
          <div className="glass-card p-8">
            <div className="w-24 h-24 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
              <span className="text-5xl">📡</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">الواكي توكي</h2>
            <p className="text-gray-400 text-sm">في انتظار اتصال من الإدارة...</p>
            <div className="flex justify-center gap-1 mt-4">
              {[0,1,2,3,4].map(i => (
                <div key={i} className="w-1 bg-gray-200 rounded-full" style={{height:`${8+i*4}px`,animation:`wave 1s ${i*0.1}s ease-in-out infinite`}}/>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

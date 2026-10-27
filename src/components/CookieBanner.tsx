import React, { useState, useEffect } from 'react';
import { Cookie, Shield, Check, X, ExternalLink } from 'lucide-react';

interface CookieBannerProps {
  onOpenLegal: (tab?: 'disclaimer' | 'dmca' | 'terms' | 'privacy') => void;
}

export const CookieBanner: React.FC<CookieBannerProps> = ({ onOpenLegal }) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('kick_cookie_consent_v1');
      if (!consent) {
        setIsVisible(true);
      }
    } catch {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem('kick_cookie_consent_v1', 'accepted_all');
    } catch (e) {
      console.warn(e);
    }
    setIsVisible(false);
  };

  const handleAcceptEssential = () => {
    try {
      localStorage.setItem('kick_cookie_consent_v1', 'accepted_essential');
    } catch (e) {
      console.warn(e);
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-[#0e141f]/95 border border-white/15 backdrop-blur-xl rounded-2xl p-4 sm:p-5 shadow-2xl shadow-black/80 text-xs text-slate-300 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            <div className="w-7 h-7 rounded-lg bg-[#53fc18]/15 border border-[#53fc18]/30 flex items-center justify-center text-[#53fc18]">
              <Cookie className="w-4 h-4" />
            </div>
            <span>Çerez ve Gizlilik Bildirimi</span>
          </div>

          <button
            onClick={handleAcceptEssential}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            title="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-slate-400 leading-relaxed text-[11px]">
          Sitemizdeki tercihlerinizi (indirme geçmişi, kuyruk listeniz) hatırlamak ve performans analizi yapmak için minimum düzeyde çerez ve yerel depolama (LocalStorage) kullanıyoruz.
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={handleAcceptAll}
            className="flex-1 py-2 px-3 rounded-xl bg-[#53fc18] hover:bg-[#43d412] text-black font-extrabold text-xs shadow-md shadow-[#53fc18]/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Kabul Et</span>
          </button>

          <button
            onClick={handleAcceptEssential}
            className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <span>Sadece Gerekli</span>
          </button>

          <button
            onClick={() => onOpenLegal('privacy')}
            className="py-2 px-2.5 rounded-xl text-slate-400 hover:text-[#53fc18] text-xs font-medium transition-colors flex items-center gap-1"
          >
            <span>Detaylar</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

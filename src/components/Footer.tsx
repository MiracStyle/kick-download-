import React from 'react';
import { Heart, ShieldCheck, Zap, HeartHandshake, ShieldAlert, FileText, Lock } from 'lucide-react';

interface FooterProps {
  onOpenLegal?: (tab?: 'disclaimer' | 'dmca' | 'terms' | 'privacy') => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenLegal }) => {
  return (
    <footer className="border-t border-white/10 bg-[#070a0e] text-slate-400 text-xs py-10 px-4 sm:px-6 lg:px-8 mt-16">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Fan Made Banner & Legal Warning Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#53fc18]/15 border border-[#53fc18]/30 flex items-center justify-center text-[#53fc18] shrink-0 mt-0.5">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 font-bold text-white text-xs sm:text-sm">
                <span>Kick Yayın & Klip İndirici (Bağımsız Hayran Yapımı Araç)</span>
                <span className="px-2 py-0.5 rounded-full bg-[#53fc18]/20 text-[#53fc18] text-[10px] font-mono border border-[#53fc18]/30">
                  UNOFFICIAL FAN-MADE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed max-w-3xl">
                Bu web sitesi, Kick.com platformundan ve Easygo Entertainment Ltd. şirketinden <strong>tamamen bağımsız, ücretsiz ve hayran yapımı</strong> bir yardımcı yazılımdır. Sunucularımızda hiçbir video dosyası saklanmaz. Tüm telif hakları ilgili yayıncılara aittir.
              </p>
            </div>
          </div>

          {onOpenLegal && (
            <button
              onClick={() => onOpenLegal('disclaimer')}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 hover:text-white transition-all cursor-pointer shrink-0 self-end md:self-auto"
            >
              Yasal Detaylar & Sorumluluk Reddi
            </button>
          )}
        </div>

        {/* Footer Navigation & Legal Links */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#53fc18] flex items-center justify-center font-black text-black font-mono">
              K
            </div>
            <div>
              <div className="font-extrabold text-white text-sm">
                Kick Klip & Yayın İndirici
              </div>
              <p className="text-[11px] text-slate-500">
                1080p60 HD Video & MP3 Ses İndirme Aracı
              </p>
            </div>
          </div>

          {/* Legal Quick Links */}
          {onOpenLegal && (
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-400">
              <button
                onClick={() => onOpenLegal('disclaimer')}
                className="hover:text-[#53fc18] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <HeartHandshake className="w-3.5 h-3.5 text-[#53fc18]" />
                <span>Hakkında & Hayran Projesi</span>
              </button>

              <button
                onClick={() => onOpenLegal('dmca')}
                className="hover:text-[#53fc18] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                <span>Telif & DMCA Kaldırma</span>
              </button>

              <button
                onClick={() => onOpenLegal('terms')}
                className="hover:text-[#53fc18] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>Kullanım Şartları</span>
              </button>

              <button
                onClick={() => onOpenLegal('privacy')}
                className="hover:text-[#53fc18] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Çerez & Gizlilik</span>
              </button>
            </div>
          )}
        </div>

        {/* Bottom Credits */}
        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <span>Kick topluluğu için sevgiyle geliştirildi</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-current" />
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#53fc18]" />
              Güvenli & Reklamsız
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-[#53fc18]" />
              Ultra Hızlı Sunucu
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};


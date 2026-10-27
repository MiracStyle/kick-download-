import React from 'react';
import { Heart, ShieldCheck, Zap } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/5 bg-[#080b0f] text-slate-500 text-xs py-10 px-4 sm:px-6 lg:px-8 mt-16">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#53fc18] flex items-center justify-center font-black text-black font-mono">
            K
          </div>
          <div>
            <div className="font-extrabold text-white text-sm">
              Kick Klip İndirici
            </div>
            <p className="text-[11px] text-slate-400">
              Hızlı, Filigransız ve Yüksek Çözünürlüklü Video İndirme Aracı
            </p>
          </div>
        </div>

        <div className="text-center md:text-right text-[11px] text-slate-500 max-w-md leading-relaxed">
          <p>
            Bu araç yalnızca kişisel kullanım ve arşivleme amacıyla geliştirilmiştir. Kick.com veya iştirakleri ile resmi bir bağı yoktur. Tüm ticari markalar ve video hakları ilgili yayıncılara ve Kick platformuna aittir.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
        <div className="flex items-center gap-1.5 text-slate-400">
          <span>Kick topluluğu için sevgiyle geliştirildi</span>
          <Heart className="w-3.5 h-3.5 text-red-500 fill-current" />
        </div>

        <div className="flex items-center gap-4 text-slate-400">
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
    </footer>
  );
};

import React from 'react';
import { Download, Layers, History, Sparkles, HelpCircle, Zap, Radio } from 'lucide-react';

interface HeaderProps {
  activeTab: 'downloader' | 'vod' | 'queue' | 'history' | 'explore' | 'faq';
  setActiveTab: (tab: 'downloader' | 'vod' | 'queue' | 'history' | 'explore' | 'faq') => void;
  queueCount: number;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  queueCount,
  historyCount,
}) => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0b0e14]/90 border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand */}
        <button
          onClick={() => setActiveTab('downloader')}
          className="flex items-center gap-3 group text-left transition-transform active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-[#53fc18] flex items-center justify-center font-black text-black text-xl tracking-tighter shadow-lg shadow-[#53fc18]/25 group-hover:scale-105 transition-all">
            K
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-[#53fc18] transition-colors">
                KICK <span className="text-[#53fc18]">İNDİRİCİ</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#53fc18]/15 text-[#53fc18] border border-[#53fc18]/30">
                KLİP & YAYIN (VOD)
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Filigransız 1080p HD Klip & Tam Yayın İndirici
            </p>
          </div>
        </button>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('downloader')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'downloader'
                ? 'bg-[#53fc18] text-black shadow-lg shadow-[#53fc18]/20'
                : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">Klip İndirici</span>
          </button>

          <button
            onClick={() => setActiveTab('vod')}
            className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'vod'
                ? 'bg-[#53fc18] text-black shadow-lg shadow-[#53fc18]/20'
                : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span className="hidden md:inline">Tüm Yayın (VOD)</span>
            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${
              activeTab === 'vod' ? 'bg-black text-[#53fc18]' : 'bg-[#53fc18]/20 text-[#53fc18] border border-[#53fc18]/30'
            }`}>
              YENİ
            </span>
          </button>

          <button
            onClick={() => setActiveTab('explore')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'explore'
                ? 'bg-[#53fc18] text-black shadow-lg shadow-[#53fc18]/20'
                : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden md:inline">Keşfet</span>
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'queue'
                ? 'bg-[#53fc18] text-black shadow-lg shadow-[#53fc18]/20'
                : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="hidden md:inline">Kuyruk</span>
            {queueCount > 0 && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  activeTab === 'queue' ? 'bg-black text-[#53fc18]' : 'bg-[#53fc18] text-black'
                }`}
              >
                {queueCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-[#53fc18] text-black shadow-lg shadow-[#53fc18]/20'
                : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <History className="w-4 h-4" />
            <span className="hidden md:inline">Geçmiş</span>
            {historyCount > 0 && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  activeTab === 'history' ? 'bg-black text-[#53fc18]' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {historyCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('faq')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'faq'
                ? 'bg-[#53fc18] text-black shadow-lg shadow-[#53fc18]/20'
                : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden md:inline">Rehber & SSS</span>
          </button>
        </nav>

        {/* Live badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Sunucu Aktif & Hızlı
        </div>
      </div>
    </header>
  );
};

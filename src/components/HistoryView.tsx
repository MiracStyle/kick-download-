import React from 'react';
import { History, Trash2, Download, ExternalLink, Play, Clock, Eye } from 'lucide-react';
import { HistoryItem } from '../types';

interface HistoryViewProps {
  history: HistoryItem[];
  onSelectClip: (streamUrl: string, clipId: string) => void;
  onRemoveItem: (id: string) => void;
  onClearHistory: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onSelectClip,
  onRemoveItem,
  onClearHistory,
}) => {
  const formatTimeAgo = (timestamp: number) => {
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return 'Az önce';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} dk önce`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} saat önce`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} gün önce`;
  };

  const formatViews = (views: number) => {
    if (!views) return '0';
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toLocaleString('tr-TR');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#53fc18]/15 border border-[#53fc18]/30 text-[#53fc18]">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">İndirme Geçmişi</h2>
            <p className="text-xs text-slate-400">
              Daha önce incelediğiniz ve indirdiğiniz Kick klipleri tarayıcınızda saklanır.
            </p>
          </div>
        </div>

        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Geçmişi Temizle
          </button>
        )}
      </div>

      {/* History Items */}
      {history.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white/[0.02] border border-white/5 rounded-3xl">
          <div className="w-16 h-16 rounded-3xl bg-slate-800/50 flex items-center justify-center mx-auto mb-4 text-slate-500">
            <History className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Geçmiş Kaydı Bulunmuyor</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            İndirdiğiniz veya arattığınız Kick klipleri bu alanda listelenecek.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md hover:border-white/20 transition-all flex flex-col justify-between group"
            >
              <div className="relative aspect-video bg-black/60 overflow-hidden">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                {/* Duration Badge */}
                <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 text-white font-mono text-[10px] font-semibold border border-white/10">
                  {item.duration}s
                </span>

                {/* Channel Tag */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-xs font-bold text-white border border-white/10">
                  {item.channelAvatar ? (
                    <img
                      src={item.channelAvatar}
                      alt={item.channel}
                      className="w-4 h-4 rounded-full"
                    />
                  ) : null}
                  <span>{item.channel}</span>
                </div>
              </div>

              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white line-clamp-1 group-hover:text-[#53fc18] transition-colors">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-slate-500" />
                      {formatViews(item.views)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {formatTimeAgo(item.timestamp)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <button
                    onClick={() => onSelectClip(item.streamUrl, item.clipId)}
                    className="flex items-center gap-1 text-xs font-bold text-[#53fc18] hover:underline"
                  >
                    <Play className="w-3.5 h-3.5 fill-[#53fc18]" />
                    İndiricide Aç
                  </button>

                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-white/5 transition-colors"
                    title="Geçmişten Kaldır"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

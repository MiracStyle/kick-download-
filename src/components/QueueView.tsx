import React, { useState } from 'react';
import {
  Layers,
  Download,
  Trash2,
  Plus,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Film,
  Music,
} from 'lucide-react';
import { QueueItem } from '../types';

interface QueueViewProps {
  queue: QueueItem[];
  onRemoveFromQueue: (id: string) => void;
  onClearCompleted: () => void;
  onAddUrlToQueue: (url: string) => void;
  onDownloadItem: (item: QueueItem) => Promise<void>;
  onDownloadAll: () => Promise<void>;
  isProcessingBatch: boolean;
}

export const QueueView: React.FC<QueueViewProps> = ({
  queue,
  onRemoveFromQueue,
  onClearCompleted,
  onAddUrlToQueue,
  onDownloadItem,
  onDownloadAll,
  isProcessingBatch,
}) => {
  const [newUrl, setNewUrl] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;
    onAddUrlToQueue(newUrl.trim());
    setNewUrl('');
  };

  const completedCount = queue.filter((q) => q.status === 'done').length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header card */}
      <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#53fc18]/15 border border-[#53fc18]/30 text-[#53fc18]">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">İndirme Kuyruğu</h2>
              <p className="text-xs text-slate-400">
                Birden fazla Kick klibini sıraya ekleyin ve tek tıkla toplu olarak indirin.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {completedCount > 0 && (
              <button
                onClick={onClearCompleted}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
              >
                Tamamlananları Temizle ({completedCount})
              </button>
            )}

            {queue.length > 0 && (
              <button
                onClick={onDownloadAll}
                disabled={isProcessingBatch}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#53fc18] hover:bg-[#46d614] text-black font-extrabold text-xs shadow-lg shadow-[#53fc18]/20 transition-all disabled:opacity-50"
              >
                {isProcessingBatch ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Toplu İndiriliyor...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Tümünü İndir ({queue.length})</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Quick Add URL Form */}
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            placeholder="Kuyruğa yeni Kick klip linki ekleyin (örn: kick.com/xqc?clip=clip_...)"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#53fc18]"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Ekle</span>
          </button>
        </form>
      </div>

      {/* Queue items list */}
      {queue.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white/[0.02] border border-white/5 rounded-3xl">
          <div className="w-16 h-16 rounded-3xl bg-slate-800/50 flex items-center justify-center mx-auto mb-4 text-slate-500">
            <Layers className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Kuyruk Boş</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            İndirici sekmesinden klipleri kuyruğa ekleyebilir veya yukarıdaki kutuya klip linki yapıştırabilirsiniz.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map((item) => {
            return (
              <div
                key={item.id}
                className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 transition-all hover:border-white/20"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Thumbnail / Icon */}
                  {item.clip?.thumbnail_url ? (
                    <img
                      src={item.clip.thumbnail_url}
                      alt={item.clip.title}
                      className="w-20 h-12 object-cover rounded-xl border border-white/10 shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                      {item.format === 'mp3' || item.format === 'm4a' ? <Music className="w-5 h-5" /> : <Film className="w-5 h-5" />}
                    </div>
                  )}

                  {/* Title & Info */}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-white truncate">
                      {item.clip?.title || item.url}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                      {item.clip?.channel?.username && (
                        <span className="font-semibold text-[#53fc18]">
                          @{item.clip.channel.username}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded bg-white/5 font-mono text-[10px]">
                        {item.quality.toUpperCase()} • {item.format.toUpperCase()}
                      </span>
                      {item.clip?.duration && (
                        <span>{item.clip.duration}s</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-3">
                  {item.status === 'downloading' && (
                    <span className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      İndiriliyor
                    </span>
                  )}

                  {item.status === 'done' && (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Tamamlandı
                    </span>
                  )}

                  {item.status === 'error' && (
                    <span className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Hata
                    </span>
                  )}

                  {item.status === 'pending' || item.status === 'ready' || item.status === 'error' ? (
                    <button
                      onClick={() => onDownloadItem(item)}
                      className="p-2.5 rounded-xl bg-[#53fc18] hover:bg-[#46d614] text-black font-bold text-xs transition-colors flex items-center gap-1 shadow-md shadow-[#53fc18]/20"
                      title={item.status === 'error' ? 'Yeniden Dene' : 'İndir'}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  ) : null}

                  <button
                    onClick={() => onRemoveFromQueue(item.id)}
                    className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Kuyruktan Çıkar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

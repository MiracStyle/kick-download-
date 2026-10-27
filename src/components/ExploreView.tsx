import React from 'react';
import { Sparkles, Play, Eye, Clock, Download, Flame } from 'lucide-react';

interface ExploreClip {
  id: string;
  title: string;
  views: number;
  duration: number;
  thumbnail_url: string;
  clip_url?: string;
  channel?: { username: string; profile_picture?: string };
  category?: { name: string };
}

interface ExploreViewProps {
  onSelectClipId: (id: string) => void;
  trendingClips: ExploreClip[];
  isLoadingTrending: boolean;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  onSelectClipId,
  trendingClips,
  isLoadingTrending,
}) => {
  const formatViews = (views: number) => {
    if (!views) return '0';
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toLocaleString('tr-TR');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Hero explore card */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-black to-[#53fc18]/10 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#53fc18]/15 border border-[#53fc18]/30 text-[#53fc18] text-xs font-extrabold uppercase mb-3">
            <Flame className="w-4 h-4 fill-[#53fc18]" />
            Trend & Popüler Kick Klipleri
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            En Çok İndirilen ve İzlenen Klipleri Keşfedin
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2">
            Aşağıdaki popüler yayıncı kliplerinden dilediğinize tıklayarak anında indiriciye aktarabilir, kırpabilir veya indirebilirsiniz.
          </p>
        </div>
      </div>

      {/* Grid of clips */}
      {isLoadingTrending ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white/[0.03] border border-white/10 rounded-2xl aspect-video animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {trendingClips.map((clip) => (
            <div
              key={clip.id}
              onClick={() => onSelectClipId(clip.id)}
              className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md hover:border-[#53fc18]/50 hover:shadow-xl hover:shadow-[#53fc18]/10 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="relative aspect-video bg-black/80 overflow-hidden">
                <img
                  src={clip.thumbnail_url}
                  alt={clip.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                {/* Duration */}
                <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 text-white font-mono text-[10px] font-semibold border border-white/10">
                  {clip.duration}s
                </span>

                {/* Hover Play Icon */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-[#53fc18] text-black flex items-center justify-center shadow-lg shadow-[#53fc18]/50 transform scale-75 group-hover:scale-100 transition-transform">
                    <Play className="w-6 h-6 fill-black translate-x-0.5" />
                  </div>
                </div>

                {/* Channel Tag */}
                {clip.channel?.username && (
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-xs font-bold text-white border border-white/10">
                    {clip.channel.profile_picture ? (
                      <img
                        src={clip.channel.profile_picture}
                        alt={clip.channel.username}
                        className="w-4 h-4 rounded-full"
                      />
                    ) : null}
                    <span>{clip.channel.username}</span>
                  </div>
                )}
              </div>

              <div className="p-4 space-y-2">
                <h4 className="text-sm font-bold text-white line-clamp-1 group-hover:text-[#53fc18] transition-colors">
                  {clip.title}
                </h4>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1 font-medium">
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    {formatViews(clip.views)} görüntülenme
                  </span>

                  {clip.category?.name && (
                    <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-slate-300 font-medium">
                      {clip.category.name}
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#53fc18] flex items-center gap-1">
                    <Download className="w-3 h-3" />
                    İndiricide Aç
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {clip.id.slice(0, 14)}...
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

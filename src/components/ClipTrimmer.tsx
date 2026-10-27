import React from 'react';
import { Scissors, RotateCcw, Clock, Play } from 'lucide-react';

interface ClipTrimmerProps {
  duration: number;
  trimStart: number;
  trimEnd: number;
  currentTime: number;
  onTrimChange: (start: number, end: number) => void;
  onSeekTo: (time: number) => void;
}

export const ClipTrimmer: React.FC<ClipTrimmerProps> = ({
  duration,
  trimStart,
  trimEnd,
  currentTime,
  onTrimChange,
  onSeekTo,
}) => {
  const max = Math.max(1, duration || 30);
  const currentEnd = trimEnd === 0 ? max : trimEnd;
  const selectedDuration = Math.max(0, currentEnd - trimStart);
  const isTrimmed = trimStart > 0 || (trimEnd > 0 && trimEnd < max);

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${mins}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  const handleStartSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = Math.min(parseFloat(e.target.value), currentEnd - 0.5);
    onTrimChange(Math.max(0, newStart), currentEnd);
  };

  const handleEndSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = Math.max(parseFloat(e.target.value), trimStart + 0.5);
    onTrimChange(trimStart, Math.min(max, newEnd));
  };

  const handleSetCurrentAsStart = () => {
    const newStart = Math.min(currentTime, currentEnd - 0.5);
    onTrimChange(Math.max(0, newStart), currentEnd);
  };

  const handleSetCurrentAsEnd = () => {
    const newEnd = Math.max(currentTime, trimStart + 0.5);
    onTrimChange(trimStart, Math.min(max, newEnd));
  };

  const handleReset = () => {
    onTrimChange(0, 0);
  };

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#53fc18]/10 text-[#53fc18] border border-[#53fc18]/20">
            <Scissors className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Klip Kırpıcı & Highlight Kesici
              {isTrimmed && (
                <span className="text-[10px] bg-[#53fc18] text-black font-extrabold px-2 py-0.5 rounded-full">
                  AKTİF
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Sadece en komik veya heyecanlı anı indirmek için başlangıç ve bitiş seçin.
            </p>
          </div>
        </div>

        {isTrimmed && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Tüm Klibi Seç
          </button>
        )}
      </div>

      {/* Sliders */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Start Point */}
          <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Başlangıç Noktası</span>
              <span className="font-mono font-bold text-[#53fc18]">
                {formatSeconds(trimStart)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={max}
              step={0.1}
              value={trimStart}
              onChange={handleStartSlider}
              className="w-full accent-[#53fc18] cursor-pointer"
            />
            <div className="flex items-center justify-between mt-1">
              <button
                onClick={handleSetCurrentAsStart}
                className="text-[11px] text-slate-300 hover:text-[#53fc18] underline font-medium"
              >
                Şu anki zamana ayarla ({formatSeconds(currentTime)})
              </button>
              <button
                onClick={() => onSeekTo(trimStart)}
                className="text-[11px] text-[#53fc18] hover:underline flex items-center gap-1 font-semibold"
              >
                <Play className="w-2.5 h-2.5 fill-[#53fc18]" /> Git
              </button>
            </div>
          </div>

          {/* End Point */}
          <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Bitiş Noktası</span>
              <span className="font-mono font-bold text-[#53fc18]">
                {formatSeconds(currentEnd)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={max}
              step={0.1}
              value={currentEnd}
              onChange={handleEndSlider}
              className="w-full accent-[#53fc18] cursor-pointer"
            />
            <div className="flex items-center justify-between mt-1">
              <button
                onClick={handleSetCurrentAsEnd}
                className="text-[11px] text-slate-300 hover:text-[#53fc18] underline font-medium"
              >
                Şu anki zamana ayarla ({formatSeconds(currentTime)})
              </button>
              <button
                onClick={() => onSeekTo(currentEnd)}
                className="text-[11px] text-[#53fc18] hover:underline flex items-center gap-1 font-semibold"
              >
                <Play className="w-2.5 h-2.5 fill-[#53fc18]" /> Git
              </button>
            </div>
          </div>
        </div>

        {/* Highlight Summary Info */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#53fc18]/5 border border-[#53fc18]/20 rounded-xl text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="w-4 h-4 text-[#53fc18]" />
            <span>İndirilecek Süre:</span>
            <span className="font-bold text-white font-mono">
              {formatSeconds(selectedDuration)}
            </span>
            <span className="text-slate-400">
              (Toplam klip: {formatSeconds(max)})
            </span>
          </div>

          {isTrimmed && (
            <span className="text-emerald-400 font-medium hidden sm:inline">
              ✓ Yalnızca seçilen aralık indirilecektir
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

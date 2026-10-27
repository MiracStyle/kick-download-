import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  Sparkles,
  Scissors,
  Loader2,
} from 'lucide-react';

interface VideoPlayerProps {
  streamUrl: string;
  thumbnailUrl?: string;
  duration: number;
  trimStart: number;
  trimEnd: number;
  onCurrentTimeChange?: (time: number) => void;
  onSetTrimStart?: (time: number) => void;
  onSetTrimEnd?: (time: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  streamUrl,
  thumbnailUrl,
  duration,
  trimStart,
  trimEnd,
  onCurrentTimeChange,
  onSetTrimStart,
  onSetTrimEnd,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(duration || 30);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showControls, setShowControls] = useState<boolean>(true);
  const controlsTimeoutRef = useRef<any>(null);

  // Stream via Express server proxy to avoid CORS and decode m3u8 to playable mp4 stream
  const videoSrc = `/api/clip/stream?url=${encodeURIComponent(streamUrl)}`;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setIsLoading(false);
      if (video.duration && !isNaN(video.duration) && video.duration !== Infinity) {
        setVideoDuration(video.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (onCurrentTimeChange) {
        onCurrentTimeChange(video.currentTime);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => setIsLoading(false);

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
    };
  }, [streamUrl, onCurrentTimeChange]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    videoRef.current.muted = newMuted;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      if (val === 0) {
        setIsMuted(true);
        videoRef.current.muted = true;
      } else if (isMuted) {
        setIsMuted(false);
        videoRef.current.muted = false;
      }
    }
  };

  const handleSpeedChange = () => {
    const speeds = [0.5, 1, 1.25, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackRate);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackRate(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 2800);
  };

  // Calculate trim highlights in percentage
  const total = videoDuration || duration || 30;
  const trimLeftPercent = (Math.max(0, trimStart) / total) * 100;
  const trimRightPercent = 100 - (Math.min(total, trimEnd || total) / total) * 100;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black/90 border border-white/10 shadow-2xl group select-none"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoSrc}
        poster={thumbnailUrl}
        preload="metadata"
        loop={isLooping}
        playsInline
        onClick={togglePlay}
        className="w-full h-full object-contain cursor-pointer"
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
          <Loader2 className="w-12 h-12 text-[#53fc18] animate-spin mb-2" />
          <span className="text-xs font-semibold text-slate-300">
            Video akışı yükleniyor...
          </span>
        </div>
      )}

      {/* Big Center Play Button when paused */}
      {!isPlaying && !isLoading && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-[#53fc18] text-black flex items-center justify-center shadow-xl shadow-[#53fc18]/30 hover:scale-110 active:scale-95 transition-transform z-20 cursor-pointer"
          title="Oynat"
        >
          <Play className="w-8 h-8 fill-black translate-x-0.5" />
        </button>
      )}

      {/* Top Bar Overlay */}
      <div
        className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 via-black/30 to-transparent flex items-center justify-between transition-opacity duration-300 z-20 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md bg-[#53fc18]/20 border border-[#53fc18]/40 text-[#53fc18] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#53fc18] animate-ping" />
            HD 1080p
          </span>
          {trimEnd > 0 && trimEnd < total && (
            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center gap-1">
              <Scissors className="w-3 h-3" />
              Kırpma Aktif ({Math.round(trimEnd - trimStart)}s)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onSetTrimStart && (
            <button
              onClick={() => onSetTrimStart(currentTime)}
              className="px-2.5 py-1 rounded-lg bg-black/60 hover:bg-[#53fc18] hover:text-black border border-white/10 text-white text-xs font-semibold transition-all flex items-center gap-1"
              title="Şu anki saniyeyi Başlangıç noktası yap"
            >
              <Scissors className="w-3 h-3" />
              Başlangıç Yap: {formatTime(currentTime)}
            </button>
          )}
          {onSetTrimEnd && (
            <button
              onClick={() => onSetTrimEnd(currentTime)}
              className="px-2.5 py-1 rounded-lg bg-black/60 hover:bg-[#53fc18] hover:text-black border border-white/10 text-white text-xs font-semibold transition-all flex items-center gap-1"
              title="Şu anki saniyeyi Bitiş noktası yap"
            >
              <Scissors className="w-3 h-3" />
              Bitiş Yap: {formatTime(currentTime)}
            </button>
          )}
        </div>
      </div>

      {/* Bottom Controls Overlay */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col gap-2 transition-opacity duration-300 z-20 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress bar container with trim window preview */}
        <div className="relative w-full h-3 flex items-center group/scrubber cursor-pointer">
          {/* Background Track */}
          <div className="absolute inset-x-0 h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
            {/* Trim window highlight */}
            <div
              className="absolute top-0 bottom-0 bg-[#53fc18]/40 border-l border-r border-[#53fc18]"
              style={{
                left: `${trimLeftPercent}%`,
                right: `${trimRightPercent}%`,
              }}
            />
          </div>

          {/* Current Played Bar */}
          <div
            className="absolute left-0 h-1.5 bg-[#53fc18] rounded-full pointer-events-none"
            style={{ width: `${(currentTime / total) * 100}%` }}
          />

          {/* Range Slider for Scrubbing */}
          <input
            type="range"
            min={0}
            max={total}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        {/* Action Controls Row */}
        <div className="flex items-center justify-between text-white text-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white hover:text-[#53fc18]"
              title={isPlaying ? 'Duraklat' : 'Oynat'}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
            </button>

            {/* Volume */}
            <div className="flex items-center gap-1.5 group/vol">
              <button
                onClick={toggleMute}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white hover:text-[#53fc18]"
                title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5 text-red-400" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 accent-[#53fc18] cursor-pointer opacity-70 group-hover/vol:opacity-100 transition-opacity"
              />
            </div>

            {/* Time display */}
            <div className="font-mono text-xs text-slate-300">
              <span className="text-white font-semibold">{formatTime(currentTime)}</span>
              <span className="text-slate-500 mx-1">/</span>
              <span>{formatTime(total)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Speed toggle */}
            <button
              onClick={handleSpeedChange}
              className="px-2 py-1 rounded-md text-xs font-bold bg-white/10 hover:bg-white/20 transition-colors"
              title="Oynatma Hızı"
            >
              {playbackRate}x
            </button>

            {/* Loop toggle */}
            <button
              onClick={() => setIsLooping(!isLooping)}
              className={`p-1.5 rounded-lg transition-colors ${
                isLooping ? 'bg-[#53fc18]/20 text-[#53fc18]' : 'hover:bg-white/10 text-slate-300'
              }`}
              title={isLooping ? 'Döngü Açık' : 'Döngü Kapalı'}
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-300 hover:text-white"
              title="Tam Ekran"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

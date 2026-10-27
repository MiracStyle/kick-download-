import React, { useState, useEffect } from 'react';
import {
  Radio,
  Download,
  Search,
  Sparkles,
  Clock,
  Eye,
  Film,
  Music,
  Scissors,
  Terminal,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  Play,
  Calendar,
  Users,
  ChevronRight,
  ShieldCheck,
  Tv,
  ArrowLeft,
  Flame,
  Gauge,
  Layers,
  HardDrive,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { VodData, ChannelData, ChannelVodSummary } from '../types';

interface VodDownloaderProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
  initialChannel?: string;
  initialVodUuid?: string;
  onNavigateToClips?: (urlOrChannel?: string) => void;
}

export const VodDownloader: React.FC<VodDownloaderProps> = ({
  onShowToast,
  initialChannel,
  initialVodUuid,
  onNavigateToClips,
}) => {
  const [searchInput, setSearchInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [channelData, setChannelData] = useState<ChannelData | null>(null);
  const [selectedVod, setSelectedVod] = useState<VodData | null>(null);
  const [activeMode, setActiveMode] = useState<'full' | 'segment' | 'external'>('full');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [detectedClipUrl, setDetectedClipUrl] = useState<string | null>(null);

  // Download states
  const [selectedQuality, setSelectedQuality] = useState<string>('1080p');
  const [selectedFormat, setSelectedFormat] = useState<'mp4' | 'webm' | 'avi' | 'mkv' | 'mp3' | 'm4a'>('mp4');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadProgressText, setDownloadProgressText] = useState<string>('');
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Segment inputs (in seconds)
  const [segmentStart, setSegmentStart] = useState<string>('00:00:00');
  const [segmentEnd, setSegmentEnd] = useState<string>('00:30:00');

  // Streamer presets
  const streamerPresets = [
    { name: 'xQc (Yayın Arşivi)', slug: 'xqc', badge: 'Global VOD' },
    { name: 'Elraenn (Kanal & Canlı)', slug: 'elraenn', badge: 'TR Top' },
    { name: 'Adin Ross (Geçmiş Yayınlar)', slug: 'adinross', badge: 'Popüler' },
    { name: 'Westcol', slug: 'westcol', badge: 'Canlı' },
  ];

  // Load initial VOD or channel if provided
  useEffect(() => {
    if (initialVodUuid) {
      handleFetchVod(initialVodUuid);
    } else if (initialChannel) {
      handleFetchChannel(initialChannel);
    }
  }, [initialVodUuid, initialChannel]);

  // Convert HH:MM:SS to seconds
  const parseTimeToSeconds = (timeStr: string): number => {
    const parts = timeStr.trim().split(':').map((p) => parseInt(p, 10) || 0);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 1) {
      return parts[0];
    }
    return 0;
  };

  // Convert seconds to HH:MM:SS
  const formatSecondsToTime = (totalSeconds: number): string => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  // Format readable duration (e.g. "4 saat 12 dk")
  const formatReadableDuration = (totalSeconds: number): string => {
    if (!totalSeconds || totalSeconds <= 0) return 'Canlı / Belirsiz';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours} saat ${minutes > 0 ? `${minutes} dk` : ''}`;
    }
    if (minutes > 0) {
      return `${minutes} dk ${seconds > 0 ? `${seconds} sn` : ''}`;
    }
    return `${seconds} saniye`;
  };

  // Calculate estimated file size with accurate bitrate models
  const getEstimatedSize = (seconds: number, quality: string, format: string): string => {
    const hours = Math.max(0.01, seconds / 3600);
    if (format === 'mp3' || format === 'm4a') {
      if (quality === '320k') {
        const mb = Math.round(hours * 140);
        return mb > 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`;
      }
      if (quality === '64k') {
        const mb = Math.round(hours * 28);
        return `${mb} MB`;
      }
      if (quality === '128k') {
        const mb = Math.round(hours * 58);
        return `${mb} MB`;
      }
      const mb = Math.round(hours * 86); // ~192kbps
      return mb > 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`;
    }

    if (quality === '1080p') {
      const gb = hours * 3.8;
      return `${gb.toFixed(1)} GB`;
    } else if (quality === '720p') {
      const gb = hours * 1.6;
      return `${gb.toFixed(1)} GB`;
    } else if (quality === '720p_eco') {
      const mb = hours * 750;
      return mb > 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${Math.round(mb)} MB`;
    } else if (quality === '480p') {
      const mb = hours * 450;
      return mb > 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${Math.round(mb)} MB`;
    } else if (quality === '360p') {
      const mb = hours * 250;
      return `${Math.round(mb)} MB`;
    } else if (quality === '240p') {
      const mb = hours * 120;
      return `${Math.round(mb)} MB`;
    } else {
      const mb = hours * 350;
      return `${Math.round(mb)} MB`;
    }
  };

  // Direct selection of VOD from channel list (0 network latency, 0 risk of 404)
  const handleSelectVod = (vod: ChannelVodSummary) => {
    setSearchError(null);
    setDetectedClipUrl(null);

    if (vod.source) {
      const baseUrl = vod.source.replace(/\/master\.m3u8.*$/, '');
      setSelectedVod({
        uuid: vod.uuid,
        id: vod.id,
        title: vod.title || 'Kick Yayını',
        channel: {
          username: channelData?.username || 'Kick Streamer',
          slug: channelData?.slug || '',
          profile_picture: channelData?.profile_picture,
        },
        duration: vod.duration || 0,
        created_at: vod.created_at || new Date().toISOString(),
        views: vod.views || 0,
        thumbnail_url: vod.thumbnail_url,
        source: vod.source,
        is_live: false,
        qualities: [
          { id: '1080p', label: '1080p60 Full HD', resolution: '1920x1080', url: `${baseUrl}/1080p60/playlist.m3u8` },
          { id: '720p', label: '720p60 HD', resolution: '1280x720', url: `${baseUrl}/720p60/playlist.m3u8` },
          { id: '480p', label: '480p SD', resolution: '852x480', url: `${baseUrl}/480p30/playlist.m3u8` },
          { id: '360p', label: '360p Hafif', resolution: '640x360', url: `${baseUrl}/360p30/playlist.m3u8` },
          { id: 'mp3', label: 'MP3 Ses Kaydı', resolution: '192 kbps', url: vod.source },
        ],
      });

      if (vod.duration > 0) {
        setSegmentStart('00:00:00');
        const endLimit = Math.min(vod.duration, 1800);
        setSegmentEnd(formatSecondsToTime(endLimit));
      }
      onShowToast(`"${vod.title}" yayını hazırlandı!`, 'success');
      return;
    }

    // Fallback: fetch with channel hint
    handleFetchVod(vod.uuid, channelData?.slug);
  };

  // Main search handler (handles VOD URL or Channel URL)
  const handleSearch = async (override?: string) => {
    const query = (override || searchInput).trim();
    if (!query) return;

    setIsLoading(true);
    setSearchError(null);
    setDetectedClipUrl(null);
    setDownloadError(null);

    try {
      // 1. Clip query check
      const isClip =
        query.match(/[?&]clip=(clip_[A-Za-z0-9]+)/i) ||
        query.match(/\/clips?\/(clip_[A-Za-z0-9]+)/i) ||
        query.startsWith('clip_');

      if (isClip) {
        setDetectedClipUrl(query);
        setSearchError('Bu girdi bir Kick Klip bağlantısıdır. Klipleri indirmek için Klip İndirici aracını kullanabilirsiniz.');
        setIsLoading(false);
        return;
      }

      // 2. Channel VOD url: kick.com/[channel]/videos/[id_or_slug]
      const channelVodMatch = query.match(/kick\.com\/([a-zA-Z0-9_-]+)\/videos\/([a-zA-Z0-9_\-]+)/i);
      if (channelVodMatch) {
        const channel = channelVodMatch[1];
        const vodId = channelVodMatch[2];
        try {
          await handleFetchVod(vodId, channel);
          return;
        } catch {
          // Fallback to loading the channel if specific VOD expired
          await handleFetchChannel(channel);
          setSearchError(`Belirtilen yayın linkinin süresi dolmuş veya arşivden kalkmış olabilir. @${channel} kanalının mevcut yayınları aşağıda listelendi.`);
          return;
        }
      }

      // 3. Direct VOD UUID
      const isVodUuid = query.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
      if (isVodUuid && (query.includes('/video/') || query.length === 36)) {
        await handleFetchVod(isVodUuid[1]);
        return;
      }

      // 4. Direct VOD URL: kick.com/video/[id]
      const directVodUrlMatch = query.match(/kick\.com\/video\/([a-zA-Z0-9_\-]+)/i);
      if (directVodUrlMatch) {
        await handleFetchVod(directVodUrlMatch[1]);
        return;
      }

      // 5. Treat as channel
      let channelName = query
        .replace(/^https?:\/\/(?:www\.)?kick\.com\//i, '')
        .replace(/^@/, '')
        .replace(/\/videos\/?$/, '')
        .split('/')[0]
        .split('?')[0];

      if (!channelName) channelName = 'xqc';
      await handleFetchChannel(channelName);
    } catch (err: any) {
      console.warn('Search error in VOD downloader:', err);
      const msg = err.message || 'Yayın veya kanal bilgileri bulunamadı.';
      setSearchError(msg);
      onShowToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch VOD details
  const handleFetchVod = async (targetId: string, channelHint?: string) => {
    setIsLoading(true);
    setSearchError(null);
    try {
      const params = new URLSearchParams({ id: targetId });
      if (channelHint) params.set('channel', channelHint);

      const res = await fetch(`/api/vod/info?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || 'Yayın (VOD) bilgileri bulunamadı veya bağlantı geçersiz.');
      }
      setSelectedVod(json.data);
      if (json.data.duration > 0) {
        setSegmentStart('00:00:00');
        const endLimit = Math.min(json.data.duration, 1800); // default to 30 mins segment
        setSegmentEnd(formatSecondsToTime(endLimit));
      }
      onShowToast(`"${json.data.title}" yayını hazırlandı!`, 'success');
    } catch (err: any) {
      console.warn('handleFetchVod error:', err);
      const msg = err.message || 'Yayın bilgileri alınamadı.';
      setSearchError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Channel details
  const handleFetchChannel = async (slug: string) => {
    setIsLoading(true);
    setSearchError(null);
    try {
      const res = await fetch(`/api/channel/info?channel=${encodeURIComponent(slug)}`);
      const json = await res.json();
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || 'Kanal bulunamadı.');
      }
      setChannelData(json.data);
      setSelectedVod(null); // Return to channel vods list
      onShowToast(`@${json.data.username} kanal yayınları yüklendi!`, 'success');
    } catch (err: any) {
      console.warn('handleFetchChannel error:', err);
      const msg = err.message || 'Kanal bulunamadı.';
      setSearchError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Download Handler (Blob download with progress & fallback)
  const handleDownloadVod = async () => {
    if (!selectedVod) return;

    setIsDownloading(true);
    setDownloadError(null);
    setDownloadProgress(0);
    setDownloadProgressText('1/3: Yayın sunucuda hazırlanıyor & paketleniyor...');

    try {
      const startSec = activeMode === 'segment' ? parseTimeToSeconds(segmentStart) : 0;
      const endSec =
        activeMode === 'segment'
          ? parseTimeToSeconds(segmentEnd)
          : selectedVod.duration > 0
          ? selectedVod.duration
          : 0;
      const durationSec = endSec > startSec ? endSec - startSec : 0;

      const params = new URLSearchParams({
        url: selectedVod.source,
        uuid: selectedVod.uuid,
        title: selectedVod.title || 'kick_yayin',
        format: selectedFormat,
        quality: selectedQuality,
      });

      if (startSec > 0) params.set('start', startSec.toString());
      if (durationSec > 0) params.set('duration', durationSec.toString());

      const downloadEndpoint = `/api/vod/download?${params.toString()}`;
      const response = await fetch(downloadEndpoint);

      if (!response.ok) {
        let errMessage = 'Yayın indirilemedi.';
        try {
          const errData = await response.json();
          if (errData && errData.error) errMessage = errData.error;
        } catch {
          // ignore
        }
        throw new Error(errMessage);
      }

      setDownloadProgressText('2/3: Tarayıcınıza aktarılıyor...');

      const contentLengthHeader = response.headers.get('Content-Length');
      const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;

      let filename = `${(selectedVod.title || 'Kick_Yayin').replace(/[\\/:*?"<>|]/g, '_')}_${selectedFormat === 'mp3' ? 'Audio.mp3' : `${selectedQuality}.mp4`}`;
      const disp = response.headers.get('Content-Disposition');
      if (disp) {
        const utfMatch = disp.match(/filename\*=UTF-8''([^;]+)/i);
        if (utfMatch && utfMatch[1]) {
          filename = decodeURIComponent(utfMatch[1]);
        } else {
          const stdMatch = disp.match(/filename="?([^";]+)"?/i);
          if (stdMatch && stdMatch[1]) {
            filename = stdMatch[1];
          }
        }
      }

      let blob: Blob;

      if (response.body && totalBytes > 0) {
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let receivedBytes = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          receivedBytes += value.length;
          const percent = Math.min(100, Math.round((receivedBytes / totalBytes) * 100));
          const mbReceived = (receivedBytes / (1024 * 1024)).toFixed(1);
          const mbTotal = (totalBytes / (1024 * 1024)).toFixed(1);
          setDownloadProgress(percent);
          setDownloadProgressText(`2/3: Cihaza aktarılıyor: %${percent} (${mbReceived} MB / ${mbTotal} MB)`);
        }

        const mimeTypes: Record<string, string> = {
          mp4: 'video/mp4',
          webm: 'video/webm',
          avi: 'video/x-msvideo',
          mkv: 'video/x-matroska',
          mp3: 'audio/mpeg',
          m4a: 'audio/mp4',
        };
        const mime = mimeTypes[selectedFormat] || 'video/mp4';
        blob = new Blob(chunks as unknown as BlobPart[], { type: mime });
      } else {
        blob = await response.blob();
      }

      setDownloadProgress(100);
      setDownloadProgressText('3/3: Tamamlandı! Yayın cihazınıza kaydedildi.');

      const objectUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#53fc18', '#00ff88', '#ffffff', '#22c55e'],
      });

      setTimeout(() => {
        document.body.removeChild(anchor);
        window.URL.revokeObjectURL(objectUrl);
        setIsDownloading(false);
        setDownloadProgressText('');
        setDownloadProgress(0);
      }, 3000);
    } catch (err: any) {
      console.error('VOD Download error:', err);
      setDownloadError(err.message || 'Yayın indirme işlemi başarısız oldu.');
      setIsDownloading(false);
      setDownloadProgressText('');
    }
  };

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(label);
      onShowToast(`${label} kopyalandı!`, 'info');
      setTimeout(() => setCopiedText(null), 2500);
    });
  };

  // Build direct download link
  const getDirectDownloadHref = (): string => {
    if (!selectedVod) return '';
    const startSec = activeMode === 'segment' ? parseTimeToSeconds(segmentStart) : 0;
    const endSec =
      activeMode === 'segment'
        ? parseTimeToSeconds(segmentEnd)
        : selectedVod.duration > 0
        ? selectedVod.duration
        : 0;
    const durationSec = endSec > startSec ? endSec - startSec : 0;

    const params = new URLSearchParams({
      url: selectedVod.source,
      uuid: selectedVod.uuid,
      title: selectedVod.title || 'kick_yayin',
      format: selectedFormat,
      quality: selectedQuality,
    });

    if (startSec > 0) params.set('start', startSec.toString());
    if (durationSec > 0) params.set('duration', durationSec.toString());

    return `/api/vod/download?${params.toString()}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#53fc18]/10 via-black/40 to-black/80 border border-[#53fc18]/20 p-6 sm:p-8 backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#53fc18]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#53fc18]/20 border border-[#53fc18]/40 text-[#53fc18] text-xs font-bold uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            Yeni Özellik: Tam Yayın (VOD) İndirici
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Kick Yayınlarını <span className="text-[#53fc18]">Bütün Olarak</span> veya İstediğin Bölümü İndir
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Saatlerce süren Kick canlı yayınlarını, geçmiş yayın arşivlerini (VOD) 1080p60 Full HD, 720p veya MP3 formatında anında indirin. Dilerseniz sadece istediğiniz dakika aralığını kırparak cihazınıza kaydedin!
          </p>

          {/* Search Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="pt-2"
          >
            <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-[#0e131d]/90 border border-white/15 focus-within:border-[#53fc18] rounded-2xl p-2 shadow-2xl transition-all">
              <div className="flex items-center gap-3 px-3 flex-1 min-w-0">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Yayıncı adı veya VOD linki girin (Örn: xqc, kick.com/elraenn veya video UUID...)"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="py-3 px-6 rounded-xl bg-[#53fc18] hover:bg-[#46d614] text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#53fc18]/25 transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Yayın Aranıyor...</span>
                  </>
                ) : (
                  <>
                    <Tv className="w-4 h-4" />
                    <span>Yayınları Getir</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Streamer Presets */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Popüler Yayıncılar:
            </span>
            {streamerPresets.map((preset) => (
              <button
                key={preset.slug}
                onClick={() => {
                  setSearchInput(preset.slug);
                  handleSearch(preset.slug);
                }}
                className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 hover:border-[#53fc18]/40 transition-all flex items-center gap-1.5"
              >
                <span>{preset.name}</span>
                <span className="text-[10px] text-[#53fc18] font-bold">({preset.badge})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Error Alert Banner with Recovery Actions */}
      {searchError && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block mb-0.5">Yayın Bildirimi</span>
              <p className="text-slate-300 leading-relaxed">{searchError}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto shrink-0">
            {detectedClipUrl && onNavigateToClips && (
              <button
                onClick={() => onNavigateToClips(detectedClipUrl)}
                className="px-3.5 py-1.5 rounded-xl bg-[#53fc18] hover:bg-[#46d614] text-black font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#53fc18]/20 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Klip İndiricide Aç</span>
              </button>
            )}
            <button
              onClick={() => setSearchError(null)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-xs transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      {/* Selected VOD Download View */}
      {selectedVod ? (
        <div className="space-y-6">
          {/* Back button */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedVod(null)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Yayın Listesine / Kanal Bilgisine Dön</span>
            </button>

            {selectedVod.channel.slug && (
              <span className="text-xs text-slate-400">
                Yayıncı: <span className="text-[#53fc18] font-bold">@{selectedVod.channel.username}</span>
              </span>
            )}
          </div>

          {/* VOD Main Header Card */}
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 backdrop-blur-md grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Thumbnail / Poster */}
            <div className="lg:col-span-5 relative group overflow-hidden rounded-2xl border border-white/10 bg-black/60 aspect-video flex items-center justify-center">
              {selectedVod.thumbnail_url ? (
                <img
                  src={selectedVod.thumbnail_url}
                  alt={selectedVod.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                  <Film className="w-12 h-12 text-[#53fc18]" />
                  <span className="text-xs">Kick Yayın Akışı</span>
                </div>
              )}

              {/* Duration badge */}
              <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md border border-white/10 text-xs font-mono font-bold text-white flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#53fc18]" />
                {formatReadableDuration(selectedVod.duration)}
              </div>
            </div>

            {/* VOD Info & Meta */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#53fc18]/20 border border-[#53fc18]/40 text-[#53fc18] font-extrabold text-[10px] uppercase tracking-wider">
                  Tam Kick Yayını (VOD)
                </span>
                {selectedVod.is_live && (
                  <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 font-extrabold text-[10px] uppercase tracking-wider animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                    Canlı
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
                {selectedVod.title}
              </h2>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1 border-t border-white/5">
                <div className="flex items-center gap-2">
                  {selectedVod.channel.profile_picture ? (
                    <img
                      src={selectedVod.channel.profile_picture}
                      alt={selectedVod.channel.username}
                      className="w-6 h-6 rounded-full object-cover border border-white/10"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#53fc18] text-black font-black flex items-center justify-center text-xs">
                      {selectedVod.channel.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="font-semibold text-white">@{selectedVod.channel.username}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Süre: {formatReadableDuration(selectedVod.duration)}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>{selectedVod.views?.toLocaleString('tr-TR') || 0} İzlenme</span>
                </div>

                {selectedVod.created_at && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{new Date(selectedVod.created_at).toLocaleDateString('tr-TR')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Download Options Section */}
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 backdrop-blur-md space-y-6">
            {/* Mode Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
              <button
                onClick={() => setActiveMode('full')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeMode === 'full'
                    ? 'bg-[#53fc18] text-black shadow-lg shadow-[#53fc18]/20'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>1. Tüm Yayını İndir</span>
              </button>

              <button
                onClick={() => setActiveMode('segment')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeMode === 'segment'
                    ? 'bg-[#53fc18] text-black shadow-lg shadow-[#53fc18]/20'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Scissors className="w-4 h-4" />
                <span>2. Zaman Aralığı / Bölüm Kırp</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-[#53fc18]">
                  Önerilen
                </span>
              </button>

              <button
                onClick={() => setActiveMode('external')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeMode === 'external'
                    ? 'bg-[#53fc18] text-black shadow-lg shadow-[#53fc18]/20'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Terminal className="w-4 h-4" />
                <span>3. IDM / VLC / FFmpeg Linkleri</span>
              </button>
            </div>

            {/* Mode 1: Full VOD Download */}
            {activeMode === 'full' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Format Tabs */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-[#53fc18]" />
                      Format Seçin
                    </h4>
                    <span className="text-xs text-slate-400">
                      Seçili: <strong className="text-[#53fc18]">{selectedFormat.toUpperCase()}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {[
                      { id: 'mp4', name: 'MP4 Video', badge: 'Evrensel', icon: Film, desc: 'H.264 / AAC' },
                      { id: 'webm', name: 'WebM Video', badge: 'Yeni / Web', icon: Layers, desc: 'VP9 Yüksek Sıkıştırma' },
                      { id: 'avi', name: 'AVI Video', badge: 'Yeni / Montaj', icon: HardDrive, desc: 'Klasik Masaüstü & Düzenleme' },
                      { id: 'mkv', name: 'MKV Video', badge: 'Matroska', icon: Film, desc: 'Kayıpsız / Çoklu Akış' },
                      { id: 'mp3', name: 'MP3 Ses', badge: 'Ses Kaydı', icon: Music, desc: 'Tüm Cihazlarla Uyumlu' },
                      { id: 'm4a', name: 'M4A Ses', badge: 'Apple / AAC', icon: Music, desc: 'Yüksek Kalite / Hafif' },
                    ].map((tab) => {
                      const isActive = selectedFormat === tab.id;
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setSelectedFormat(tab.id as any);
                            if (tab.id === 'mp3' || tab.id === 'm4a') {
                              setSelectedQuality('192k');
                            } else if (selectedFormat === 'mp3' || selectedFormat === 'm4a') {
                              setSelectedQuality('1080p');
                            }
                          }}
                          className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                            isActive
                              ? 'bg-[#53fc18]/15 border-[#53fc18] shadow-md shadow-[#53fc18]/10 text-white'
                              : 'bg-black/40 border-white/5 hover:border-white/20 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#53fc18]' : 'text-slate-400'}`} />
                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${isActive ? 'bg-[#53fc18] text-black font-extrabold' : 'bg-white/5 text-slate-400'}`}>
                              {tab.badge}
                            </span>
                          </div>
                          <div className="font-bold text-xs">{tab.name}</div>
                          <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{tab.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Low Bitrate Notice */}
                <div className="bg-gradient-to-r from-emerald-500/10 via-black/40 to-cyan-500/10 border border-emerald-500/20 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-300">
                    <Gauge className="w-4 h-4 text-[#53fc18]" />
                    <span>
                      <strong className="text-white">Daha Düşük Bit Hızı Seçenekleri: </strong>
                      Saatlerce süren Kick yayınlarında kota ve depolama tasarrufu için <strong>720p Eco</strong>, <strong>360p</strong> veya <strong>240p</strong> kullanabilirsiniz (Dosya boyutu %80'e kadar küçülür).
                    </span>
                  </div>
                </div>

                {/* Quality options grid */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-[#53fc18]" />
                    {selectedFormat === 'mp3' || selectedFormat === 'm4a' ? 'Ses Bit Hızı Kalitesi' : 'Çözünürlük & Bit Hızı Seviyesi'}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(selectedFormat === 'mp3' || selectedFormat === 'm4a'
                      ? [
                          { id: '320k', name: '320 kbps Hi-Fi Ses', desc: 'En yüksek stüdyo ses netliği', badge: 'STÜDYO', isLow: false },
                          { id: '192k', name: '192 kbps Standart', desc: 'Yüksek kaliteli dengeli ses', badge: 'ÖNERİLEN', isLow: false },
                          { id: '128k', name: '128 kbps Düşük Bit Hızı', desc: 'Net diyaloglar, hafif dosya', badge: 'HAFİF', isLow: true },
                          { id: '64k', name: '64 kbps Ultra Düşük Bit Hızı', desc: 'Replik ve konuşma için minimum boyut', badge: 'MİNİMUM BOYUT', isLow: true },
                        ]
                      : [
                          { id: '1080p', name: '1080p60 Full HD', desc: 'Orijinal kaynak yayını (~6 Mbps)', badge: 'MAKSİMUM', isLow: false },
                          { id: '720p', name: '720p60 HD Standart', desc: 'Akıcı HD görüntü (~2.5 Mbps)', badge: 'DENGELİ', isLow: false },
                          { id: '720p_eco', name: '720p HD Eco (Düşük Bit Hızı)', desc: 'Kota dostu HD (~1.2 Mbps)', badge: 'KOTA DOSTU', isLow: true },
                          { id: '480p', name: '480p SD Standart', desc: 'Hızlı & mobil uyumlu (~800 kbps)', badge: 'HAFİF', isLow: false },
                          { id: '360p', name: '360p Düşük Bit Hızı', desc: 'Hafif veri & hızlı indirme (~450 kbps)', badge: 'DÜŞÜK VERİ', isLow: true },
                          { id: '240p', name: '240p Ultra Düşük Bit Hızı', desc: 'Minimum dosya boyutu (~200 kbps)', badge: 'MİNİMUM BOYUT', isLow: true },
                        ]
                    ).map((item) => {
                      const isSelected = selectedQuality === item.id;
                      const estSize = getEstimatedSize(selectedVod.duration, item.id, selectedFormat);
                      const Icon = selectedFormat === 'mp3' || selectedFormat === 'm4a' ? Music : Film;

                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedQuality(item.id)}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'bg-[#53fc18]/10 border-[#53fc18] shadow-lg shadow-[#53fc18]/15 ring-1 ring-[#53fc18]/30'
                              : 'bg-black/30 border-white/5 hover:border-white/20'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-[#53fc18] text-black' : 'bg-slate-800 text-slate-300'}`}>
                                  <Icon className="w-3.5 h-3.5" />
                                </div>
                                <h5 className="text-xs font-bold text-white">{item.name}</h5>
                              </div>
                              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-extrabold ${isSelected ? 'bg-[#53fc18] text-black' : item.isLow ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-slate-400'}`}>
                                {item.badge}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 pl-7 block">{item.desc}</span>
                          </div>

                          <div className="mt-3 pt-2 pl-7 border-t border-white/5 flex items-center justify-between text-xs">
                            <span className="text-slate-500 text-[11px]">Tahmini Boyut:</span>
                            <span className="font-mono font-bold text-[#53fc18]">{estSize}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Mode 2: Segment / Trimming */}
            {activeMode === 'segment' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-xs text-emerald-300 flex items-start gap-3">
                  <Scissors className="w-5 h-5 text-[#53fc18] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white">Neden Bölüm Kırpma? </span>
                    Kick yayınları genellikle 4 ila 10 saat arasında sürer (15-40 GB). Tüm yayını indirmek yerine sadece izlemek veya paylaşmak istediğiniz bölümü seçerek saniyeler içinde indirebilirsiniz!
                  </div>
                </div>

                {/* Time Range Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#53fc18]" />
                      Başlangıç Zamanı (SS:DD:SN)
                    </label>
                    <input
                      type="text"
                      value={segmentStart}
                      onChange={(e) => setSegmentStart(e.target.value)}
                      placeholder="00:00:00"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-[#53fc18]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#53fc18]" />
                      Bitiş Zamanı (SS:DD:SN)
                    </label>
                    <input
                      type="text"
                      value={segmentEnd}
                      onChange={(e) => setSegmentEnd(e.target.value)}
                      placeholder="00:30:00"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-[#53fc18]"
                    />
                  </div>
                </div>

                {/* Quick Presets for Segment */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="text-slate-400 font-semibold">Hızlı Aralıklar:</span>
                  {[
                    { label: 'İlk 15 Dk', start: 0, end: 900 },
                    { label: 'İlk 30 Dk', start: 0, end: 1800 },
                    { label: 'İlk 1 Saat', start: 0, end: 3600 },
                    { label: '01:00:00 - 01:30:00', start: 3600, end: 5400 },
                    { label: 'Son 30 Dk', start: Math.max(0, selectedVod.duration - 1800), end: selectedVod.duration },
                  ].map((p) => (
                    <button
                      key={p.label}
                      onClick={() => {
                        setSegmentStart(formatSecondsToTime(p.start));
                        setSegmentEnd(formatSecondsToTime(p.end));
                      }}
                      className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 transition-colors cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Format selection */}
                <div className="space-y-2 pt-1">
                  <span className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#53fc18]" />
                    Format Seçin:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { id: 'mp4', name: 'MP4 Video' },
                      { id: 'webm', name: 'WebM Video (Yeni)' },
                      { id: 'avi', name: 'AVI Video (Yeni)' },
                      { id: 'mkv', name: 'MKV Video' },
                      { id: 'mp3', name: 'MP3 Ses' },
                      { id: 'm4a', name: 'M4A Ses' },
                    ].map((fmt) => (
                      <button
                        key={fmt.id}
                        onClick={() => {
                          setSelectedFormat(fmt.id as any);
                          if (fmt.id === 'mp3' || fmt.id === 'm4a') {
                            setSelectedQuality('192k');
                          } else if (selectedFormat === 'mp3' || selectedFormat === 'm4a') {
                            setSelectedQuality('1080p');
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedFormat === fmt.id
                            ? 'bg-[#53fc18] text-black shadow-md shadow-[#53fc18]/20'
                            : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {fmt.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quality & Bitrate for Segment */}
                <div className="space-y-2 pt-1">
                  <span className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-[#53fc18]" />
                    Kalite & Bit Hızı:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {(selectedFormat === 'mp3' || selectedFormat === 'm4a'
                      ? [
                          { id: '320k', label: '320 kbps (Hi-Fi)' },
                          { id: '192k', label: '192 kbps (Standart)' },
                          { id: '128k', label: '128 kbps (Düşük Bit Hızı)' },
                          { id: '64k', label: '64 kbps (Minimum Boyut)' },
                        ]
                      : [
                          { id: '1080p', label: '1080p60 Full HD' },
                          { id: '720p', label: '720p HD Standart' },
                          { id: '720p_eco', label: '720p Eco (Düşük Bit Hızı)' },
                          { id: '480p', label: '480p SD' },
                          { id: '360p', label: '360p (Düşük Veri)' },
                          { id: '240p', label: '240p (Ultra Düşük Bit Hızı)' },
                        ]
                    ).map((q) => (
                      <button
                        key={q.id}
                        onClick={() => setSelectedQuality(q.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedQuality === q.id
                            ? 'bg-[#53fc18] text-black shadow-md shadow-[#53fc18]/20'
                            : 'bg-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Mode 3: External Tools (IDM / VLC / FFmpeg) */}
            {activeMode === 'external' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="text-xs text-slate-400">
                  Çok büyük dosyaları (10 GB+) Internet Download Manager (IDM), Free Download Manager (FDM), VLC Player veya terminal ile indirmek için hazır komutlar ve bağlantılar:
                </div>

                {/* Master M3U8 */}
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Tv className="w-4 h-4 text-[#53fc18]" />
                      Doğrudan HLS Akış Bağlantısı (Master M3U8)
                    </span>
                    <button
                      onClick={() => handleCopy(selectedVod.source, 'M3U8 Linki')}
                      className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white flex items-center gap-1 transition-colors"
                    >
                      {copiedText === 'M3U8 Linki' ? <Check className="w-3.5 h-3.5 text-[#53fc18]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedText === 'M3U8 Linki' ? 'Kopyalandı' : 'Kopyala'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={selectedVod.source}
                    className="w-full bg-black/60 border border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-slate-400 select-all"
                  />
                  <p className="text-[11px] text-slate-500">
                    VLC Media Player'da "Ağ Akışı Aç" veya IDM'de "URL Ekle" yaparak doğrudan indirebilirsiniz.
                  </p>
                </div>

                {/* FFmpeg Command */}
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Terminal className="w-4 h-4 text-[#53fc18]" />
                      FFmpeg Terminal Komutu (Tek Satırda Hızlı Kaydetme)
                    </span>
                    <button
                      onClick={() =>
                        handleCopy(
                          `ffmpeg -i "${selectedVod.source}" -c copy -bsf:a aac_adtstoasc "${selectedVod.title.replace(/\s+/g, '_')}.mp4"`,
                          'FFmpeg Komutu'
                        )
                      }
                      className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white flex items-center gap-1 transition-colors"
                    >
                      {copiedText === 'FFmpeg Komutu' ? <Check className="w-3.5 h-3.5 text-[#53fc18]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedText === 'FFmpeg Komutu' ? 'Kopyalandı' : 'Kopyala'}</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-black/80 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap border border-white/5">
                    {`ffmpeg -i "${selectedVod.source}" -c copy -bsf:a aac_adtstoasc "${selectedVod.title.replace(/\s+/g, '_')}.mp4"`}
                  </pre>
                </div>
              </div>
            )}

            {/* Action & Progress Area */}
            {activeMode !== 'external' && (
              <div className="space-y-4 pt-4 border-t border-white/10">
                {/* Progress bar */}
                {isDownloading && (
                  <div className="space-y-2 p-4 rounded-2xl bg-black/50 border border-[#53fc18]/30">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-2 text-[#53fc18]">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {downloadProgressText || 'Yayın hazırlanıyor...'}
                      </span>
                      <span className="font-mono text-white font-bold">
                        {downloadProgress > 0 ? `%${downloadProgress}` : 'İşleniyor'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-white/5">
                      <div
                        className="bg-gradient-to-r from-[#53fc18] to-emerald-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${downloadProgress > 0 ? downloadProgress : 15}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {downloadError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-200 space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="font-bold text-white">İndirme Başarısız: </span>
                        <span>{downloadError}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={handleDownloadVod}
                        className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-white rounded-lg font-semibold transition-colors"
                      >
                        Yeniden Dene
                      </button>
                      <a
                        href={getDirectDownloadHref()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-colors flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-[#53fc18]" />
                        Yeni Sekmede Aç
                      </a>
                    </div>
                  </div>
                )}

                {/* Main Download Button */}
                <button
                  onClick={handleDownloadVod}
                  disabled={isDownloading}
                  className="w-full py-4 px-6 rounded-2xl bg-[#53fc18] hover:bg-[#46d614] text-black font-black text-base tracking-wide flex items-center justify-center gap-3 shadow-xl shadow-[#53fc18]/25 hover:shadow-[#53fc18]/40 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-75 disabled:cursor-wait"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin text-black" />
                      <span>{downloadProgressText || 'Yayın İndiriliyor...'}</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-6 h-6 stroke-[2.5]" />
                      <span>
                        {activeMode === 'segment'
                          ? `Seçilen Bölümü İndir (${segmentStart} - ${segmentEnd})`
                          : selectedFormat === 'mp3'
                          ? 'Tüm Yayının MP3 Ses Dosyasını İndir'
                          : `Tüm Yayını İndir (${selectedQuality.toUpperCase()})`}
                      </span>
                    </>
                  )}
                </button>

                {/* Direct alternative download link */}
                <div className="text-center">
                  <a
                    href={getDirectDownloadHref()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#53fc18] transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#53fc18]" />
                    <span>Alternatif İndirme Linki (Yeni Sekmede Doğrudan İndir)</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : channelData ? (
        /* Channel Profile & Past Broadcasts (VODs) List */
        <div className="space-y-8">
          {/* Channel Header Banner */}
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden">
            {channelData.banner_image && (
              <div className="absolute inset-0 opacity-15 overflow-hidden">
                <img src={channelData.banner_image} alt="Banner" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                {channelData.profile_picture ? (
                  <img
                    src={channelData.profile_picture}
                    alt={channelData.username}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-[#53fc18] shadow-lg shadow-[#53fc18]/20"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-[#53fc18] text-black font-black text-2xl flex items-center justify-center">
                    {channelData.username.charAt(0).toUpperCase()}
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-white">{channelData.username}</h2>
                    <span className="px-2 py-0.5 rounded-full bg-[#53fc18]/20 text-[#53fc18] text-[10px] font-bold border border-[#53fc18]/40">
                      Doğrulanmış Kanal
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {channelData.followers_count?.toLocaleString('tr-TR') || 0} Takipçi • kick.com/{channelData.slug}
                  </p>
                </div>
              </div>

              {/* Live status badge */}
              {channelData.is_live ? (
                <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-red-500/15 border border-red-500/30">
                  <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
                  <div>
                    <div className="text-xs font-black text-red-400 uppercase tracking-wider">Şu An Canlı Yayında</div>
                    <div className="text-[11px] text-slate-300">
                      {channelData.live_session?.viewer_count?.toLocaleString('tr-TR')} İzleyici
                    </div>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-400">
                  Yayıncı Çevrimdışı (Geçmiş Yayınlar Mevcut)
                </div>
              )}
            </div>
          </div>

          {/* Active Live Stream Card if Live */}
          {channelData.is_live && channelData.live_session && (
            <div className="p-6 rounded-3xl bg-gradient-to-r from-red-950/40 via-red-900/20 to-black/60 border border-red-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-black text-red-400 uppercase tracking-widest">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                  Canlı Yayın Bilgisi
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Kategori: {channelData.live_session.category}
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-white">
                {channelData.live_session.title}
              </h3>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                {channelData.live_playback_url && (
                  <button
                    onClick={() => handleCopy(channelData.live_playback_url || '', 'Canlı Akış M3U8 Linki')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
                  >
                    <Tv className="w-4 h-4 text-[#53fc18]" />
                    <span>Canlı Yayın Akış Linkini Al (VLC için)</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Past Broadcasts (VODs) Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Film className="w-5 h-5 text-[#53fc18]" />
                  Geçmiş Yayınlar ({channelData.vods.length})
                </h3>
                <p className="text-xs text-slate-400">
                  İndirmek istediğiniz tam yayını seçin ve kalite/zaman aralığını belirleyin.
                </p>
              </div>
            </div>

            {channelData.vods.length === 0 ? (
              <div className="p-8 bg-white/[0.03] border border-white/10 rounded-3xl text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">
                    @{channelData.username} Kanalında Kayıtlı Yayın (VOD) Bulunamadı
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    Bu yayıncı Kick geçmiş yayın arşivini (VOD) kaydetmeyi kapatmış veya yayınların süresi dolmuş olabilir. Yayıncının popüler kliplerini indirebilirsiniz.
                  </p>
                </div>
                {onNavigateToClips && (
                  <div className="pt-2">
                    <button
                      onClick={() => onNavigateToClips(channelData.slug)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#53fc18] hover:bg-[#45dc12] text-black font-bold text-xs shadow-lg shadow-[#53fc18]/20 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>@{channelData.username} Kanalının Popüler Kliplerini İndir</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {channelData.vods.map((vod) => (
                  <div
                    key={vod.uuid}
                    onClick={() => handleSelectVod(vod)}
                    className="group bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-[#53fc18]/50 rounded-2xl p-4 transition-all cursor-pointer flex flex-col justify-between space-y-3"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-black/60 border border-white/5">
                      {vod.thumbnail_url ? (
                        <img
                          src={vod.thumbnail_url}
                          alt={vod.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                          <Film className="w-8 h-8" />
                        </div>
                      )}

                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 font-mono text-[11px] font-bold text-white flex items-center gap-1 border border-white/10">
                        <Clock className="w-3 h-3 text-[#53fc18]" />
                        {formatReadableDuration(vod.duration)}
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="space-y-1.5 flex-1">
                      <h4 className="text-sm font-bold text-white group-hover:text-[#53fc18] transition-colors line-clamp-2">
                        {vod.title}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>{vod.views?.toLocaleString('tr-TR') || 0} İzlenme</span>
                        {vod.created_at && <span>{new Date(vod.created_at).toLocaleDateString('tr-TR')}</span>}
                      </div>
                    </div>

                    {/* Action button */}
                    <button className="w-full py-2.5 px-4 rounded-xl bg-white/10 group-hover:bg-[#53fc18] group-hover:text-black text-white text-xs font-bold transition-all flex items-center justify-center gap-2">
                      <Download className="w-3.5 h-3.5" />
                      <span>Bu Yayını İndir</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty State / How it works */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#53fc18]/10 text-[#53fc18] flex items-center justify-center font-bold">
              1
            </div>
            <h4 className="text-base font-bold text-white">Yayıncı veya VOD Linki Yapıştırın</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              İster <code>kick.com/xqc</code> gibi bir kanal linki, ister doğrudan <code>kick.com/video/...</code> linki yapıştırın.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#53fc18]/10 text-[#53fc18] flex items-center justify-center font-bold">
              2
            </div>
            <h4 className="text-base font-bold text-white">İstediğin Bölümü veya Tümünü Seç</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tüm yayını tek tıkla indirebilir ya da dakika seçerek sadece istediğiniz heyecanlı anı kırpabilirsiniz.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#53fc18]/10 text-[#53fc18] flex items-center justify-center font-bold">
              3
            </div>
            <h4 className="text-base font-bold text-white">Yüksek Hızda Doğrudan İndir</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              1080p60 Full HD kaynak kalitesinde ve filigransız olarak cihazınıza anında kaydedilir.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

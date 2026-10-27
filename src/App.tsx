import React, { useState, useEffect } from 'react';
import {
  Link as LinkIcon,
  Search,
  Clipboard,
  X,
  Sparkles,
  ArrowRight,
  Loader2,
  Film,
  ShieldCheck,
  Music,
  Zap,
  CheckCircle2,
  AlertCircle,
  Info,
  Radio,
} from 'lucide-react';
import { Header } from './components/Header';
import { VideoPlayer } from './components/VideoPlayer';
import { ClipTrimmer } from './components/ClipTrimmer';
import { DownloadOptions } from './components/DownloadOptions';
import { ExploreView } from './components/ExploreView';
import { HistoryView } from './components/HistoryView';
import { QueueView } from './components/QueueView';
import { FaqView } from './components/FaqView';
import { Footer } from './components/Footer';
import { QrCodeModal } from './components/QrCodeModal';
import { VodDownloader } from './components/VodDownloader';
import { ClipData, HistoryItem, QueueItem } from './types';

const STORAGE_KEY_HISTORY = 'kick_clips_history_v2';
const STORAGE_KEY_QUEUE = 'kick_clips_queue_v2';

export default function App() {
  const [activeTab, setActiveTab] = useState<'vod' | 'downloader' | 'queue' | 'history' | 'explore' | 'faq'>('vod');
  const [urlInput, setUrlInput] = useState<string>('');
  const [isLoadingClip, setIsLoadingClip] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentClip, setCurrentClip] = useState<ClipData | null>(null);
  const [vodInitialUuid, setVodInitialUuid] = useState<string | undefined>(undefined);
  const [vodInitialChannel, setVodInitialChannel] = useState<string | undefined>(undefined);

  // Trimming State
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(0);
  const [playerCurrentTime, setPlayerCurrentTime] = useState<number>(0);

  // History State
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_HISTORY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Queue State
  const [queue, setQueue] = useState<QueueItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_QUEUE);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isProcessingBatch, setIsProcessingBatch] = useState<boolean>(false);

  // QR Modal
  const [isQrOpen, setIsQrOpen] = useState<boolean>(false);

  // Trending / Explore
  const [trendingClips, setTrendingClips] = useState<any[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState<boolean>(false);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  };

  // Sync history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [history]);

  // Sync queue to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(queue));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [queue]);

  // Fetch trending clips on mount
  useEffect(() => {
    const fetchTrending = async () => {
      setIsLoadingTrending(true);
      try {
        const res = await fetch('/api/clip/trending');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setTrendingClips(data.data);
        }
      } catch (e) {
        console.warn('Trending fetch failed:', e);
      } finally {
        setIsLoadingTrending(false);
      }
    };
    fetchTrending();
  }, []);

  // Fetch clip by URL or ID
  const handleFetchClip = async (inputUrlOverride?: string) => {
    const target = (inputUrlOverride || urlInput).trim();
    if (!target) return;

    setIsLoadingClip(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/clip/info?url=${encodeURIComponent(target)}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Klip veya yayın bilgileri alınamadı.');
      }

      // If user provided a VOD link or Channel link
      if (json.type === 'vod' && json.data) {
        setVodInitialUuid(json.data.uuid);
        setVodInitialChannel(undefined);
        setActiveTab('vod');
        showToast(`"${json.data.title}" yayını açıldı!`, 'success');
        return;
      }

      if (json.type === 'channel' && json.data) {
        setVodInitialChannel(json.data.slug);
        setVodInitialUuid(undefined);
        setActiveTab('vod');
        showToast(`@${json.data.username} kanalı ve yayınları açıldı!`, 'success');
        return;
      }

      const clip: ClipData = json.data;
      setCurrentClip(clip);
      setTrimStart(0);
      setTrimEnd(clip.duration || 30);
      setActiveTab('downloader');

      // Add to history
      const newHistoryItem: HistoryItem = {
        id: `${clip.id}_${Date.now()}`,
        clipId: clip.id,
        title: clip.title,
        channel: clip.channel?.username || 'Kick Streamer',
        channelAvatar: clip.channel?.profile_picture,
        thumbnail: clip.thumbnail_url,
        duration: clip.duration,
        views: clip.views,
        timestamp: Date.now(),
        streamUrl: clip.clip_url || clip.video_url,
      };

      setHistory((prev) => {
        const filtered = prev.filter((h) => h.clipId !== clip.id);
        return [newHistoryItem, ...filtered].slice(0, 40);
      });

      showToast(`"${clip.title}" başarıyla yüklendi!`, 'success');

      // Smooth scroll to video section
      setTimeout(() => {
        const el = document.getElementById('player-download-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Klip bulunamadı.');
      showToast(err.message || 'Klip bulunamadı', 'error');
    } finally {
      setIsLoadingClip(false);
    }
  };

  // Paste from clipboard
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrlInput(text.trim());
        showToast('Link panodan yapıştırıldı!', 'info');
      }
    } catch (err) {
      console.warn('Clipboard read error:', err);
    }
  };

  // Add current clip to queue
  const handleAddToQueue = (quality: string, format: any) => {
    if (!currentClip) return;
    const newItem: QueueItem = {
      id: `${currentClip.id}_${Date.now()}_${Math.random()}`,
      url: currentClip.clip_url || currentClip.video_url,
      clip: currentClip,
      quality,
      format,
      status: 'pending',
    };
    setQueue((prev) => [...prev, newItem]);
    showToast(`"${currentClip.title}" indirme kuyruğuna eklendi!`, 'info');
  };

  // Add external URL to queue
  const handleAddUrlToQueue = async (urlToAdd: string) => {
    try {
      const res = await fetch(`/api/clip/info?url=${encodeURIComponent(urlToAdd)}`);
      const json = await res.json();
      if (json.success && json.data) {
        const newItem: QueueItem = {
          id: `${json.data.id}_${Date.now()}_${Math.random()}`,
          url: json.data.clip_url || json.data.video_url,
          clip: json.data,
          quality: '1080p',
          format: 'mp4',
          status: 'ready',
        };
        setQueue((prev) => [...prev, newItem]);
        showToast(`"${json.data.title}" kuyruğa eklendi!`, 'success');
      } else {
        showToast('Klip bilgileri alınamadı.', 'error');
      }
    } catch {
      showToast('Kuyruğa eklenirken hata oluştu.', 'error');
    }
  };

  // Download single queue item
  const handleDownloadQueueItem = async (item: QueueItem) => {
    setQueue((prev) =>
      prev.map((q) => (q.id === item.id ? { ...q, status: 'downloading' } : q))
    );

    try {
      const params = new URLSearchParams({
        url: item.url,
        title: item.clip?.title || 'kick_klip',
        format: item.format,
        quality: item.quality,
      });

      const downloadUrl = `/api/clip/download?${params.toString()}`;
      const response = await fetch(downloadUrl);

      if (!response.ok) {
        throw new Error('İndirme başarısız oldu.');
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const cleanTitle = (item.clip?.title || 'kick_klip').replace(/[\\/:*?"<>|]/g, '_');
      const filename = `${cleanTitle}_${item.format === 'mp3' ? 'Audio.mp3' : `${item.quality}.mp4`}`;

      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();

      setTimeout(() => {
        document.body.removeChild(anchor);
        window.URL.revokeObjectURL(objectUrl);
      }, 2000);

      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'done' } : q))
      );
    } catch (err: any) {
      console.error('Queue download error:', err);
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'error', error: err.message } : q))
      );
      showToast(`${item.clip?.title || 'Klip'} indirilemedi.`, 'error');
    }
  };

  // Download all queue items sequentially
  const handleDownloadAllQueue = async () => {
    if (queue.length === 0 || isProcessingBatch) return;
    setIsProcessingBatch(true);

    for (const item of queue) {
      if (item.status === 'done') continue;
      await handleDownloadQueueItem(item);
      await new Promise((r) => setTimeout(r, 1600));
    }

    setIsProcessingBatch(false);
    showToast('Tüm kuyruk indirmeleri başlatıldı!', 'success');
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col font-sans selection:bg-[#53fc18] selection:text-black">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        queueCount={queue.filter((q) => q.status !== 'done').length}
        historyCount={history.length}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {activeTab === 'downloader' && (
          <div className="space-y-10">
            {/* Hero Input Section */}
            <div className="relative pt-4 pb-8 max-w-4xl mx-auto text-center space-y-6">
              {/* Background Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#53fc18]/10 rounded-full blur-[140px] pointer-events-none -z-10" />

              <div className="flex flex-wrap items-center justify-center gap-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#53fc18]/15 border border-[#53fc18]/30 text-xs font-bold text-[#53fc18]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Kick.com İçin Özel Geliştirilmiş Klip İndirici</span>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('vod')}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-bold text-white transition-all cursor-pointer group"
                >
                  <Radio className="w-3.5 h-3.5 text-[#53fc18] animate-pulse" />
                  <span>Tüm Kick Yayını (VOD) İndir</span>
                  <span className="text-[#53fc18] group-hover:translate-x-0.5 transition-transform font-bold">→</span>
                </button>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                Kick Kliplerini <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#53fc18] via-[#7dff4c] to-[#22c55e]">Filigransız & 1080p60</span> İndirin
              </h1>

              <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto font-normal">
                Kick yayınlarındaki anları 1080p Full HD MP4 ve yüksek kaliteli MP3 ses formatında anında cihazınıza kaydedin.
              </p>

              {/* URL Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleFetchClip();
                }}
                className="max-w-3xl mx-auto"
              >
                <div className="relative flex flex-col sm:flex-row items-center bg-[#121824] border-2 border-white/10 hover:border-[#53fc18]/50 focus-within:border-[#53fc18] focus-within:shadow-[0_0_35px_rgba(83,252,24,0.3)] rounded-2xl p-2 transition-all gap-2">
                  <div className="hidden sm:flex items-center pl-3 text-slate-400">
                    <LinkIcon className="w-5 h-5 text-[#53fc18]" />
                  </div>

                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="Kick klip linki, VOD veya kanal linki yapıştırın..."
                    className="w-full bg-transparent text-white placeholder-slate-500 text-sm sm:text-base px-3 py-2.5 focus:outline-none font-medium"
                    disabled={isLoadingClip}
                  />

                  <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end pr-1">
                    {urlInput && (
                      <button
                        type="button"
                        onClick={() => setUrlInput('')}
                        className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                        title="Temizle"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handlePaste}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#1a2332] hover:bg-[#222e42] border border-white/10 text-slate-300 transition-colors"
                      title="Panodan Yapıştır"
                    >
                      <Clipboard className="w-3.5 h-3.5" />
                      <span>Yapıştır</span>
                    </button>

                    <button
                      type="submit"
                      disabled={isLoadingClip || !urlInput.trim()}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#53fc18] hover:bg-[#43d412] active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-black font-extrabold text-sm shadow-[0_0_20px_rgba(83,252,24,0.35)] transition-all whitespace-nowrap cursor-pointer"
                    >
                      {isLoadingClip ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Getiriliyor...</span>
                        </>
                      ) : (
                        <>
                          <span>Klibi Getir</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {errorMessage && (
                  <div className="mt-3 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs sm:text-sm flex items-center gap-2 text-left">
                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
                    <span>{errorMessage}</span>
                  </div>
                )}

              </form>

              {/* Feature Badges Grid */}
              <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#121824]/60 border border-white/5">
                  <div className="w-8 h-8 rounded-lg bg-[#53fc18]/10 text-[#53fc18] flex items-center justify-center shrink-0">
                    <Film className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">1080p 60FPS</div>
                    <div className="text-[11px] text-slate-400">Orijinal Kalite</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#121824]/60 border border-white/5">
                  <div className="w-8 h-8 rounded-lg bg-[#53fc18]/10 text-[#53fc18] flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Filigransız</div>
                    <div className="text-[11px] text-slate-400">Temiz MP4 İndirme</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#121824]/60 border border-white/5">
                  <div className="w-8 h-8 rounded-lg bg-[#53fc18]/10 text-[#53fc18] flex items-center justify-center shrink-0">
                    <Music className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">MP3 Ses Çıkarıcı</div>
                    <div className="text-[11px] text-slate-400">192 Kbps Ses</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#121824]/60 border border-white/5">
                  <div className="w-8 h-8 rounded-lg bg-[#53fc18]/10 text-[#53fc18] flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Işık Hızında</div>
                    <div className="text-[11px] text-slate-400">FFmpeg Gücüyle</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Video Player, Trimmer & Download Options Section */}
            {currentClip && (
              <div id="player-download-section" className="space-y-6 max-w-5xl mx-auto">
                {/* Channel Header Banner */}
                <div className="bg-[#121824] border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {currentClip.channel?.profile_picture ? (
                      <img
                        src={currentClip.channel.profile_picture}
                        alt={currentClip.channel.username}
                        className="w-12 h-12 rounded-xl object-cover border-2 border-[#53fc18]"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-[#53fc18] text-black font-extrabold flex items-center justify-center text-lg">
                        {currentClip.channel?.username?.slice(0, 1) || 'K'}
                      </div>
                    )}
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                        <span>{currentClip.title}</span>
                      </h2>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="font-semibold text-[#53fc18]">
                          @{currentClip.channel?.username || 'Kick'}
                        </span>
                        {currentClip.category?.name && (
                          <>
                            <span>•</span>
                            <span className="px-2 py-0.5 rounded bg-white/5 text-[11px]">
                              {currentClip.category.name}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span>{currentClip.views.toLocaleString('tr-TR')} görüntülenme</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Player */}
                <VideoPlayer
                  streamUrl={currentClip.clip_url || currentClip.video_url}
                  thumbnailUrl={currentClip.thumbnail_url}
                  duration={currentClip.duration}
                  trimStart={trimStart}
                  trimEnd={trimEnd}
                  onCurrentTimeChange={(time) => setPlayerCurrentTime(time)}
                  onSetTrimStart={(time) => setTrimStart(Math.max(0, Math.floor(time)))}
                  onSetTrimEnd={(time) => setTrimEnd(Math.ceil(time))}
                />

                {/* Clip Trimmer Tool */}
                <ClipTrimmer
                  duration={currentClip.duration}
                  trimStart={trimStart}
                  trimEnd={trimEnd}
                  currentTime={playerCurrentTime}
                  onTrimChange={(start, end) => {
                    setTrimStart(start);
                    setTrimEnd(end);
                  }}
                  onSeekTo={() => {}}
                />

                {/* Download Options */}
                <DownloadOptions
                  clip={currentClip}
                  trimStart={trimStart}
                  trimEnd={trimEnd}
                  onAddToQueue={handleAddToQueue}
                  onOpenQr={() => setIsQrOpen(true)}
                />
              </div>
            )}

            {/* Trending Clips Grid on Downloader Page */}
            <div className="pt-10">
              <ExploreView
                trendingClips={trendingClips}
                isLoadingTrending={isLoadingTrending}
                onSelectClipId={(id) => {
                  const clipUrl = `https://kick.com/xqc?clip=${id}`;
                  setUrlInput(clipUrl);
                  handleFetchClip(clipUrl);
                }}
              />
            </div>

            {/* FAQ & How-To */}
            <FaqView />
          </div>
        )}

        {/* VOD / Full Broadcast Downloader Tab */}
        {activeTab === 'vod' && (
          <VodDownloader
            onShowToast={showToast}
            initialVodUuid={vodInitialUuid}
            initialChannel={vodInitialChannel}
            onNavigateToClips={(query) => {
              if (query) {
                setUrlInput(query);
                handleFetchClip(query);
              }
              setActiveTab('downloader');
            }}
          />
        )}

        {/* Explore View Tab */}
        {activeTab === 'explore' && (
          <ExploreView
            trendingClips={trendingClips}
            isLoadingTrending={isLoadingTrending}
            onSelectClipId={(id) => {
              const clipUrl = `https://kick.com/xqc?clip=${id}`;
              setUrlInput(clipUrl);
              handleFetchClip(clipUrl);
            }}
          />
        )}

        {/* Queue View Tab */}
        {activeTab === 'queue' && (
          <QueueView
            queue={queue}
            onRemoveFromQueue={(id) => setQueue((prev) => prev.filter((q) => q.id !== id))}
            onClearCompleted={() => setQueue((prev) => prev.filter((q) => q.status !== 'done'))}
            onAddUrlToQueue={handleAddUrlToQueue}
            onDownloadItem={handleDownloadQueueItem}
            onDownloadAll={handleDownloadAllQueue}
            isProcessingBatch={isProcessingBatch}
          />
        )}

        {/* History View Tab */}
        {activeTab === 'history' && (
          <HistoryView
            history={history}
            onSelectClip={(streamUrl, clipId) => {
              const clipUrl = `https://kick.com/elraenn?clip=${clipId}`;
              setUrlInput(clipUrl);
              handleFetchClip(clipUrl);
            }}
            onRemoveItem={(id) => setHistory((prev) => prev.filter((h) => h.id !== id))}
            onClearHistory={() => setHistory([])}
          />
        )}

        {/* FAQ View Tab */}
        {activeTab === 'faq' && <FaqView />}
      </main>

      {/* Footer */}
      <Footer />

      {/* QR Code Modal for Phone Downloading */}
      {currentClip && (
        <QrCodeModal
          isOpen={isQrOpen}
          onClose={() => setIsQrOpen(false)}
          title={currentClip.title}
          downloadUrl={`/api/clip/download?url=${encodeURIComponent(
            currentClip.clip_url || currentClip.video_url
          )}&title=${encodeURIComponent(currentClip.title)}&format=mp4&quality=1080p${
            trimStart > 0 ? `&start=${trimStart}` : ''
          }${trimEnd > 0 && trimEnd > trimStart ? `&end=${trimEnd}` : ''}`}
        />
      )}

      {/* Toast Overlay */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div
            className={`flex items-center gap-3 p-3.5 rounded-2xl border shadow-2xl backdrop-blur-md text-xs sm:text-sm font-semibold ${
              toast.type === 'success'
                ? 'bg-[#0e1610] border-[#53fc18]/50 text-[#53fc18] shadow-[0_0_20px_rgba(83,252,24,0.2)]'
                : toast.type === 'error'
                ? 'bg-[#1c0f12] border-red-500/50 text-red-300'
                : 'bg-[#101520] border-blue-500/50 text-blue-300'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-[#53fc18]" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />}
            {toast.type === 'info' && <Info className="w-4 h-4 shrink-0 text-blue-400" />}
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

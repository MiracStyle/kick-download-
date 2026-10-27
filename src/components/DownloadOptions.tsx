import React, { useState } from 'react';
import {
  Download,
  Film,
  Music,
  Image,
  Check,
  Copy,
  QrCode,
  Plus,
  Loader2,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Sliders,
  Wifi,
  Gauge,
  Layers,
  HardDrive,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ClipData } from '../types';

export type DownloadFormat = 'mp4' | 'webm' | 'avi' | 'mkv' | 'mp3' | 'm4a' | 'thumb';

interface DownloadOptionsProps {
  clip: ClipData;
  trimStart: number;
  trimEnd: number;
  onAddToQueue: (quality: string, format: any) => void;
  onOpenQr: () => void;
}

interface QualityItem {
  id: string;
  name: string;
  bitrateLabel: string;
  bitrateValue?: string;
  badge: string;
  badgeColor?: string;
  desc: string;
  speed: string;
  sizeRateMbPerSec: number;
  isLowBitrate?: boolean;
}

export const DownloadOptions: React.FC<DownloadOptionsProps> = ({
  clip,
  trimStart,
  trimEnd,
  onAddToQueue,
  onOpenQr,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<DownloadFormat>('mp4');
  const [selectedQuality, setSelectedQuality] = useState<string>('1080p');
  const [isEditOptimized, setIsEditOptimized] = useState<boolean>(true);
  const [showEditWarningModal, setShowEditWarningModal] = useState<boolean>(false);
  const [customBitrate, setCustomBitrate] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadProgressText, setDownloadProgressText] = useState<string>('');
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const handleToggleEditOptimized = () => {
    if (isEditOptimized) {
      setShowEditWarningModal(true);
    } else {
      setIsEditOptimized(true);
    }
  };

  // Calculate effective duration for trimming
  const clipDuration = clip.duration || 30;
  const effectiveDuration =
    trimEnd > 0 && trimEnd > trimStart ? trimEnd - trimStart : clipDuration;

  // Video Qualities & Bitrates
  const videoQualities: QualityItem[] = [
    {
      id: '1080p',
      name: '1080p60 Full HD',
      bitrateLabel: '~6000 kbps (Kaynak)',
      badge: 'MAKSİMUM KALİTE',
      desc: 'Orijinal kaynak yayını, sıfır kalite kaybı, kristal netlik',
      speed: 'Yıldırım Hızında (Doğrudan Kopyalama)',
      sizeRateMbPerSec: 0.75,
    },
    {
      id: '720p',
      name: '720p60 HD Standart',
      bitrateLabel: '~2500 kbps',
      badge: 'DENGELİ HD',
      desc: 'Yüksek kaliteli akıcı görüntü ve dengeli dosya boyutu',
      speed: 'Hızlı İşleme',
      sizeRateMbPerSec: 0.32,
    },
    {
      id: '720p_eco',
      name: '720p HD Eco (Düşük Bit Hızı)',
      bitrateLabel: '~1200 kbps (Tasarruf)',
      bitrateValue: '1200k',
      badge: 'KOTA DOSTU HD',
      badgeColor: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
      desc: 'HD çözünürlüğü korurken %60 daha az veri tüketimi',
      speed: 'Hafif & Hızlı',
      sizeRateMbPerSec: 0.16,
      isLowBitrate: true,
    },
    {
      id: '480p',
      name: '480p SD Standart',
      bitrateLabel: '~800 kbps',
      badge: 'MOBİL UYUMLU',
      desc: 'Mobil veri, WhatsApp ve Discord paylaşımları için ideal',
      speed: 'Hafif',
      sizeRateMbPerSec: 0.10,
    },
    {
      id: '360p',
      name: '360p Düşük Bit Hızı',
      bitrateLabel: '~450 kbps (Düşük Veri)',
      bitrateValue: '450k',
      badge: 'DÜŞÜK BİT HIZI',
      badgeColor: 'text-amber-300 bg-amber-500/20 border-amber-500/30',
      desc: 'Hızlı indirme, kotalı internet ve mobil tarayıcılar için',
      speed: 'Çok Hafif',
      sizeRateMbPerSec: 0.058,
      isLowBitrate: true,
    },
    {
      id: '240p',
      name: '240p Ultra Düşük Bit Hızı',
      bitrateLabel: '~200 kbps (Minimum Boyut)',
      bitrateValue: '200k',
      badge: 'KOTA TASARRUFU',
      badgeColor: 'text-cyan-300 bg-cyan-500/20 border-cyan-500/30',
      desc: 'Zayıf bağlantılarda anında iner, minimum disk ve veri alanı',
      speed: 'Ultra Hafif',
      sizeRateMbPerSec: 0.028,
      isLowBitrate: true,
    },
  ];

  // Audio Bitrates (MP3 / M4A)
  const audioQualities: QualityItem[] = [
    {
      id: '320k',
      name: '320 kbps Hi-Fi',
      bitrateLabel: '320 kbps',
      bitrateValue: '320k',
      badge: 'STÜDYO KALİTESİ',
      desc: 'Kayıpsıza yakın en yüksek MP3/M4A ses kalitesi',
      speed: 'Yüksek Kalite',
      sizeRateMbPerSec: 0.04,
    },
    {
      id: '192k',
      name: '192 kbps Standart',
      bitrateLabel: '192 kbps',
      bitrateValue: '192k',
      badge: 'ÖNERİLEN SES',
      desc: 'Müzik ve podcastler için endüstri standardı',
      speed: 'Dengeli',
      sizeRateMbPerSec: 0.024,
    },
    {
      id: '128k',
      name: '128 kbps Düşük Bit Hızı',
      bitrateLabel: '128 kbps',
      bitrateValue: '128k',
      badge: 'HAFİF SES',
      badgeColor: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30',
      desc: 'Net ses ve diyaloglar, düşük dosya boyutu',
      speed: 'Hafif',
      sizeRateMbPerSec: 0.016,
      isLowBitrate: true,
    },
    {
      id: '64k',
      name: '64 kbps Ultra Düşük Bit Hızı',
      bitrateLabel: '64 kbps',
      bitrateValue: '64k',
      badge: 'MİNİMUM BOYUT',
      badgeColor: 'text-amber-300 bg-amber-500/20 border-amber-500/30',
      desc: 'Sadece konuşma, replik ve ses notları için ultra küçük dosya',
      speed: 'Ultra Hafif',
      sizeRateMbPerSec: 0.008,
      isLowBitrate: true,
    },
  ];

  const isAudioFormat = selectedFormat === 'mp3' || selectedFormat === 'm4a';
  const currentQualities = isAudioFormat ? audioQualities : videoQualities;

  // Size estimator helper
  const calculateEstimatedSize = (ratePerSec: number): string => {
    const totalMb = effectiveDuration * ratePerSec;
    if (totalMb < 1) {
      return `${Math.round(totalMb * 1024)} KB`;
    }
    return `${totalMb.toFixed(1)} MB`;
  };

  // Original size (1080p full) for savings comparison
  const originalSizeMb = effectiveDuration * 0.75;

  const getDownloadParams = () => {
    const activeQualityItem = currentQualities.find((q) => q.id === selectedQuality);
    const activeBitrate = customBitrate || activeQualityItem?.bitrateValue || '';

    const params = new URLSearchParams({
      url: clip.clip_url || clip.video_url,
      title: clip.title || 'kick_klip',
      format: selectedFormat === 'thumb' ? 'mp4' : selectedFormat,
      quality: selectedQuality,
    });

    if (isEditOptimized) {
      params.set('edit', 'true');
    }
    if (activeBitrate) {
      params.set('bitrate', activeBitrate);
    }
    if (trimStart > 0) {
      params.set('start', trimStart.toString());
    }
    if (trimEnd > 0 && trimEnd > trimStart) {
      params.set('end', trimEnd.toString());
    }
    return params;
  };

  const directDownloadHref = `/api/clip/download?${getDownloadParams().toString()}`;

  const handleDownload = async () => {
    setDownloadError(null);

    if (selectedFormat === 'thumb') {
      try {
        setIsDownloading(true);
        setDownloadProgressText('Kapak görseli hazırlanıyor...');
        const res = await fetch(clip.thumbnail_url);
        const blob = await res.blob();
        const objectUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        const cleanTitle = (clip.title || 'kick_klip').replace(/[\\/:*?"<>|]/g, '_');
        link.download = `${cleanTitle}_thumbnail.jpg`;
        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(objectUrl);
          setIsDownloading(false);
          setDownloadProgressText('');
        }, 1200);

        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#53fc18', '#00ff88', '#ffffff'],
        });
      } catch {
        window.open(clip.thumbnail_url, '_blank');
        setIsDownloading(false);
        setDownloadProgressText('');
      }
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadProgressText(`1/3: Sunucuda ${selectedFormat.toUpperCase()} (${selectedQuality}) olarak hazırlanıyor...`);

    try {
      const downloadUrl = directDownloadHref;
      const response = await fetch(downloadUrl);

      if (!response.ok) {
        let errMessage = 'İndirme işlemi başarısız oldu.';
        try {
          const errJson = await response.json();
          if (errJson && errJson.error) {
            errMessage = errJson.error;
          }
        } catch {
          // ignore
        }
        throw new Error(errMessage);
      }

      setDownloadProgressText('2/3: Tarayıcınıza aktarılıyor...');

      const contentLengthHeader = response.headers.get('Content-Length');
      const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;

      let filename = `${(clip.title || 'Kick_Klip').replace(/[\\/:*?"<>|]/g, '_')}_${selectedQuality}.${selectedFormat}`;
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
          setDownloadProgressText(`2/3: Cihaza indiriliyor: %${percent} (${mbReceived} MB / ${mbTotal} MB)`);
        }

        const mimeTypes: Record<string, string> = {
          mp4: 'video/mp4',
          webm: 'video/webm',
          avi: 'video/x-msvideo',
          mkv: 'video/x-matroska',
          mp3: 'audio/mpeg',
          m4a: 'audio/mp4',
        };
        blob = new Blob(chunks as unknown as BlobPart[], { type: mimeTypes[selectedFormat] || 'video/mp4' });
      } else {
        blob = await response.blob();
      }

      if (blob.size < 50000) {
        throw new Error('İndirilen klip dosyası eksik veya bağlantı kesildi. Lütfen tekrar deneyin.');
      }

      setDownloadProgress(100);
      setDownloadProgressText('3/3: Tamamlandı! Dosya İndirilenler klasörüne kaydedildi.');

      const objectUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();

      confetti({
        particleCount: 85,
        spread: 75,
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
      console.error('Download error:', err);
      setDownloadError(err.message || 'İndirme işlemi başarısız oldu.');
      setIsDownloading(false);
      setDownloadProgressText('');
    }
  };

  const handleCopyDirectLink = () => {
    const directUrl = `${window.location.origin}/api/clip/stream?url=${encodeURIComponent(
      clip.clip_url || clip.video_url
    )}`;
    navigator.clipboard.writeText(directUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  // Format definitions for top bar
  const formatTabs = [
    {
      id: 'mp4' as DownloadFormat,
      name: 'MP4 Video',
      badge: 'Evrensel',
      icon: Film,
      desc: 'H.264 / AAC en yaygın ve hızlı format',
    },
    {
      id: 'webm' as DownloadFormat,
      name: 'WebM Video',
      badge: 'Yeni / Discord',
      isNew: true,
      icon: Layers,
      desc: 'VP9 yüksek sıkıştırma, web ve Discord için ideal',
    },
    {
      id: 'avi' as DownloadFormat,
      name: 'AVI Video',
      badge: 'Yeni / Klasik',
      isNew: true,
      icon: HardDrive,
      desc: 'Masaüstü oynatıcılar ve video kurgu yazılımları için',
    },
    {
      id: 'mkv' as DownloadFormat,
      name: 'MKV Video',
      badge: 'Matroska',
      icon: Film,
      desc: 'Kayıpsız kopyalama ve çoklu akış desteği',
    },
    {
      id: 'mp3' as DownloadFormat,
      name: 'MP3 Ses',
      badge: 'Ses Kaydı',
      icon: Music,
      desc: 'Podcast, replik ve müzik çıkartma',
    },
    {
      id: 'm4a' as DownloadFormat,
      name: 'M4A (AAC)',
      badge: 'Apple / AAC',
      icon: Music,
      desc: 'Yüksek kaliteli hafif ses formatı',
    },
  ];

  const currentSelectedQualityItem = currentQualities.find((q) => q.id === selectedQuality) || currentQualities[0];
  const currentEstSize = calculateEstimatedSize(currentSelectedQualityItem.sizeRateMbPerSec);
  const currentSizeMb = effectiveDuration * currentSelectedQualityItem.sizeRateMbPerSec;
  const savingsPercent =
    originalSizeMb > 0 && currentSizeMb < originalSizeMb
      ? Math.round(((originalSizeMb - currentSizeMb) / originalSizeMb) * 100)
      : 0;

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-md space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#53fc18]" />
            İndirme Formatı & Bit Hızı Seçenekleri
          </h3>
          <p className="text-xs text-slate-400">
            MP4, WebM, AVI veya ses formatlarını seçin; kota dostu düşük bit hızlarıyla indirin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Direct Link Copy */}
          <button
            onClick={handleCopyDirectLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
            title="Doğrudan MP4 Akış Bağlantısını Kopyala"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#53fc18]" />
                <span className="text-[#53fc18]">Kopyalandı!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Video Linki Kopyala</span>
              </>
            )}
          </button>

          {/* QR Code for Mobile */}
          <button
            onClick={onOpenQr}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
            title="Telefonda İndirmek İçin QR Kod Aç"
          >
            <QrCode className="w-3.5 h-3.5 text-[#53fc18]" />
            <span className="hidden sm:inline">Telefonda İndir</span>
          </button>
        </div>
      </div>

      {/* CapCut / Premiere / DaVinci Timeline Scrubbing Fix Card */}
      <div className="bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-black/60 border border-purple-500/30 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0 mt-0.5">
            <Sliders className="w-4 h-4 text-purple-400" />
          </div>
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-xs font-black text-white">
                Montaj & Edit Programı Uyumlu Mod (CapCut, Premiere, DaVinci)
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[9px] font-extrabold border border-purple-500/40">
                Donmayan Timeline
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Video barında (timeline) sararken dona kalmayı önler. Saniyede 1 keyframe yerleştirerek montaj yazılımlarında kaymak gibi akıcı kurgu yapmanızı sağlar.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleEditOptimized}
          className="relative inline-flex items-center cursor-pointer shrink-0 self-end sm:self-center group"
        >
          <div className={`w-10 h-5 rounded-full transition-colors relative ${isEditOptimized ? 'bg-[#53fc18]' : 'bg-slate-800'}`}>
            <div className={`absolute top-[2px] left-[2px] bg-white rounded-full h-4 w-4 transition-transform ${isEditOptimized ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
          <span className="ml-2 text-xs font-bold text-white whitespace-nowrap">
            {isEditOptimized ? 'AÇIK (Kurgu Uyumlu)' : 'KAPALI (Riski Kabul Et)'}
          </span>
        </button>
      </div>

      {/* Warning Modal when turning OFF edit mode for clips */}
      {showEditWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#121824] border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  ⚠️ Montaj Modunu Kapatıyorsunuz!
                </h3>
                <span className="text-[11px] font-bold text-amber-400">
                  Kurgu Programlarında Donma Yaşanabilir
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed bg-black/40 p-4 rounded-2xl border border-white/5">
              <p>
                Bu ayarı kapattığınızda indirilen klip videoları <strong>CapCut, Adobe Premiere Pro, DaVinci Resolve veya Sony Vegas</strong> gibi programlarda video barını (timeline) sararken <strong>dona kalabilir veya kilitlenebilir.</strong>
              </p>
              <p className="text-amber-300 font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Eğer videoyu YouTube'a yükleyecek veya kurgulayacaksanız AÇIK tutmanız önerilir.</span>
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditOptimized(true);
                  setShowEditWarningModal(false);
                }}
                className="w-full py-3 px-4 rounded-xl bg-[#53fc18] hover:bg-[#46d614] text-black font-extrabold text-xs shadow-lg shadow-[#53fc18]/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Montaj Modunu AÇIK Tut (Önerilen)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsEditOptimized(false);
                  setShowEditWarningModal(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Yine de Kapat (Riskli / Sadece Düz İzleme)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Format Selection Tabs (MP4, WebM, AVI, MKV, MP3, M4A) */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[#53fc18]" />
          Format Seçin
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {formatTabs.map((tab) => {
            const isTabActive = selectedFormat === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedFormat(tab.id);
                  if (tab.id === 'mp3' || tab.id === 'm4a') {
                    setSelectedQuality('192k');
                  } else if (selectedFormat === 'mp3' || selectedFormat === 'm4a') {
                    setSelectedQuality('1080p');
                  }
                }}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  isTabActive
                    ? 'bg-[#53fc18]/15 border-[#53fc18] shadow-md shadow-[#53fc18]/10 text-white'
                    : 'bg-black/40 border-white/5 hover:border-white/20 text-slate-300 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Icon
                    className={`w-4 h-4 ${isTabActive ? 'text-[#53fc18]' : 'text-slate-400'}`}
                  />
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                      tab.isNew
                        ? 'bg-[#53fc18] text-black font-extrabold'
                        : isTabActive
                        ? 'bg-[#53fc18]/20 text-[#53fc18]'
                        : 'bg-white/5 text-slate-400'
                    }`}
                  >
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

      {/* 2. Low Bitrate Notice / Indicator */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-black/40 to-cyan-500/10 border border-emerald-500/20 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-emerald-300">
          <Gauge className="w-4 h-4 text-[#53fc18] shrink-0" />
          <span>
            <strong className="text-white">Daha Düşük Bit Hızları: </strong>
            Kota tasarrufu yapmak veya zayıf internette saniyeler içinde indirmek için <strong>720p Eco</strong>, <strong>360p</strong> veya <strong>240p</strong> seçeneklerini kullanabilirsiniz.
          </span>
        </div>
        {savingsPercent > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-[#53fc18]/20 border border-[#53fc18]/40 text-[#53fc18] text-[10px] font-mono font-bold shrink-0">
            %{savingsPercent} Veri Tasarrufu
          </span>
        )}
      </div>

      {/* 3. Resolution & Bitrate Cards Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-[#53fc18]" />
            {isAudioFormat ? 'Ses Bit Hızı Kalitesi' : 'Çözünürlük & Bit Hızı Seviyesi'}
          </label>
          <span className="text-[11px] font-mono text-slate-400">
            Seçili: <strong className="text-[#53fc18]">{selectedFormat.toUpperCase()}</strong> •{' '}
            <strong className="text-white">{currentSelectedQualityItem.name}</strong> • Tahmini: <strong className="text-[#53fc18]">{currentEstSize}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {currentQualities.map((item) => {
            const isSelected = selectedQuality === item.id;
            const estSize = calculateEstimatedSize(item.sizeRateMbPerSec);

            return (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedQuality(item.id);
                  if (item.bitrateValue) {
                    setCustomBitrate(item.bitrateValue);
                  } else {
                    setCustomBitrate('');
                  }
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#53fc18]/10 border-[#53fc18] shadow-lg shadow-[#53fc18]/15 ring-1 ring-[#53fc18]/40'
                    : 'bg-black/30 border-white/5 hover:border-white/20 hover:bg-black/50'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-[#53fc18] bg-[#53fc18]' : 'border-slate-600'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                      </div>
                      <h4 className="text-xs font-bold text-white group-hover:text-[#53fc18] transition-colors">
                        {item.name}
                      </h4>
                    </div>

                    <span
                      className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                        item.badgeColor
                          ? item.badgeColor
                          : isSelected
                          ? 'bg-[#53fc18] text-black'
                          : 'bg-white/10 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 pl-5 line-clamp-1">{item.desc}</p>
                </div>

                <div className="mt-3 pt-2 pl-5 border-t border-white/5 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-mono flex items-center gap-1">
                    <Gauge className="w-3 h-3 text-slate-500" />
                    {item.bitrateLabel}
                  </span>
                  <span className="font-mono font-bold text-[#53fc18]">
                    ~{estSize}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Thumbnail Download Optional Card */}
      {clip.thumbnail_url && (
        <div className="p-3 bg-black/20 border border-white/5 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={clip.thumbnail_url}
              alt="Thumbnail"
              className="w-14 h-9 object-cover rounded-md border border-white/10"
            />
            <div>
              <h5 className="text-xs font-bold text-white">HD Küçük Resim (Thumbnail)</h5>
              <p className="text-[11px] text-slate-400">1080p orijinal kapak görselini JPG olarak kaydet</p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedFormat('thumb');
              handleDownload();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            <Image className="w-3.5 h-3.5 text-[#53fc18]" />
            İndir (JPG)
          </button>
        </div>
      )}

      {/* 5. Primary Action Button */}
      <div className="space-y-3 pt-1">
        {/* Progress Bar */}
        {isDownloading && (
          <div className="space-y-1.5 p-3 rounded-xl bg-black/40 border border-[#53fc18]/20">
            <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
              <span className="flex items-center gap-1.5 text-[#53fc18]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {downloadProgressText || 'Dosya hazırlanıyor...'}
              </span>
              <span className="font-mono text-white font-bold">
                {downloadProgress > 0 ? `%${downloadProgress}` : 'İşleniyor'}
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-white/5">
              <div
                className="bg-gradient-to-r from-[#53fc18] to-emerald-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${downloadProgress > 0 ? downloadProgress : 15}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Banner */}
        {downloadError && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-200 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold text-white">İndirme Başlatılamadı: </span>
                <span>{downloadError}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleDownload}
                className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-white rounded-lg font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                Tekrar Dene
              </button>
              <a
                href={directDownloadHref}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-colors flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#53fc18]" />
                Yeni Sekmede Doğrudan Aç
              </a>
            </div>
          </div>
        )}

        {/* Main Download Button */}
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full py-4 px-6 rounded-2xl bg-[#53fc18] hover:bg-[#46d614] text-black font-extrabold text-base tracking-wide flex items-center justify-center gap-3 shadow-xl shadow-[#53fc18]/25 hover:shadow-[#53fc18]/40 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-75 disabled:cursor-wait"
        >
          {isDownloading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin text-black" />
              <span>{downloadProgressText || 'Dosya Hazırlanıyor...'}</span>
            </>
          ) : (
            <>
              <Download className="w-6 h-6 stroke-[2.5]" />
              <span>
                {selectedFormat.toUpperCase()} ({currentSelectedQualityItem.name}) İndir • {currentEstSize}
              </span>
            </>
          )}
        </button>

        {/* Alternate Direct Link */}
        <div className="text-center pt-0.5">
          <a
            href={directDownloadHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-[#53fc18] transition-colors"
          >
            <ExternalLink className="w-3 h-3 text-[#53fc18]" />
            <span>Alternatif İndirme Linki (Yeni Sekmede Doğrudan İndir)</span>
          </a>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 px-2 pt-1 border-t border-white/5">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#53fc18]" />
            <span>Filigransız, Reklamsız & Orijinal Akış</span>
          </div>

          <button
            onClick={() => onAddToQueue(selectedQuality, selectedFormat)}
            className="text-slate-300 hover:text-[#53fc18] flex items-center gap-1 font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Toplu İndirme Kuyruğuna Ekle
          </button>
        </div>
      </div>
    </div>
  );
};

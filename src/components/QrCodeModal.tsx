import React, { useState } from 'react';
import { X, Smartphone, Copy, Check, ExternalLink } from 'lucide-react';

export interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  downloadUrl: string;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  title,
  downloadUrl,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  if (!isOpen) return null;

  const fullUrl = downloadUrl.startsWith('http')
    ? downloadUrl
    : `${typeof window !== 'undefined' ? window.location.origin : ''}${downloadUrl}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&color=000000&bgcolor=ffffff&data=${encodeURIComponent(
    fullUrl
  )}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl bg-[#121721] border border-white/10 p-6 shadow-2xl space-y-5 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          title="Kapat"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-[#53fc18]/15 border border-[#53fc18]/30 flex items-center justify-center text-[#53fc18] mb-3">
            <Smartphone className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-extrabold text-white">Telefonda İndir</h3>
          <p className="text-xs text-slate-400 max-w-xs mt-1">
            Telefonunuzun kamerasını aşağıdaki QR koda tutarak klibi iPhone veya Android cihazınıza anında indirin.
          </p>
        </div>

        {/* QR Code Container */}
        <div className="flex justify-center">
          <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-[#53fc18]">
            <img
              src={qrImageUrl}
              alt="QR Code"
              className="w-52 h-52 object-contain rounded-lg"
              loading="lazy"
            />
          </div>
        </div>

        <div className="text-xs text-slate-300 font-medium truncate px-4">
          {title}
        </div>

        {/* Link actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleCopy}
            className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-[#53fc18]" />
                <span className="text-[#53fc18]">Link Kopyalandı</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Linki Kopyala</span>
              </>
            )}
          </button>

          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-4 rounded-xl bg-[#53fc18] hover:bg-[#45d413] text-black font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Aç</span>
          </a>
        </div>
      </div>
    </div>
  );
};

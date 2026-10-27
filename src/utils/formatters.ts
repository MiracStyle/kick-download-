export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(mins)}:${pad(secs)}`;
}

export function formatViews(num: number): string {
  if (isNaN(num)) return '0';
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace('.0', '') + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace('.0', '') + 'B';
  }
  return num.toLocaleString('tr-TR');
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Bilinmiyor';
    return d.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return 'Bilinmiyor';
  }
}

export function estimateSize(durationSec: number, quality: string, format: string): string {
  const d = Math.max(1, durationSec);
  if (format === 'mp3') {
    // 192 kbps = 24 KB/s
    const mb = (d * 24) / 1024;
    return `~${mb.toFixed(1)} MB`;
  }
  if (format === 'thumb') {
    return '~350 KB';
  }
  switch (quality) {
    case '1080p':
      // Average 8000 kbps = 1 MB/s
      return `~${(d * 1.05).toFixed(1)} MB`;
    case '720p':
      // Average 3500 kbps = ~450 KB/s
      return `~${(d * 0.45).toFixed(1)} MB`;
    case '480p':
      // Average 1500 kbps = ~200 KB/s
      return `~${(d * 0.2).toFixed(1)} MB`;
    default:
      return `~${(d * 0.8).toFixed(1)} MB`;
  }
}

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { exec, execFile } from 'child_process';
import os from 'os';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS and expose headers for downloads
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
  res.header('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length, Content-Range');
  if (_req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Helper to fetch JSON from Kick using native curl (HTTP/2 with Chrome TLS)
function curlJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    execFile(
      'curl',
      [
        '-s',
        url,
        '-H',
        'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        '-H',
        'Accept: application/json',
      ],
      { timeout: 10000, maxBuffer: 10 * 1024 * 1024 },
      (err, stdout) => {
        if (err) return reject(err);
        try {
          const json = JSON.parse(stdout);
          resolve(json);
        } catch {
          reject(new Error('Klip bilgileri alınamadı veya bağlantı geçersiz.'));
        }
      }
    );
  });
}

// In-memory cache for trending clips
let trendingCache: { timestamp: number; data: any[] } | null = null;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Helper to parse Kick URLs and IDs
export function parseKickInput(input: string): {
  type: 'clip' | 'vod' | 'channel' | 'invalid';
  id?: string;
  channel?: string;
} {
  if (!input || typeof input !== 'string') return { type: 'invalid' };
  const trimmed = input.trim();

  // 1. Clip query or direct
  const clipMatch =
    trimmed.match(/[?&]clip=(clip_[A-Za-z0-9]+)/i) ||
    trimmed.match(/\/clips?\/(clip_[A-Za-z0-9]+)/i) ||
    trimmed.match(/^(clip_[A-Za-z0-9]+)$/i) ||
    trimmed.match(/(clip_[A-Za-z0-9]+)\/playlist\.m3u8/i);
  if (clipMatch) {
    return { type: 'clip', id: clipMatch[1] };
  }

  // 2. Direct VOD UUID
  const directUuid = trimmed.match(/^([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i);
  if (directUuid) {
    return { type: 'vod', id: directUuid[1] };
  }

  // 3. VOD with channel: kick.com/[channel]/videos/[id_or_slug]
  const channelVodMatch = trimmed.match(/kick\.com\/([a-zA-Z0-9_-]+)\/videos\/([a-zA-Z0-9_\-]+)/i);
  if (channelVodMatch) {
    return { type: 'vod', channel: channelVodMatch[1], id: channelVodMatch[2] };
  }

  // 4. VOD direct url: kick.com/video/[id_or_slug]
  const directVodUrlMatch = trimmed.match(/kick\.com\/video\/([a-zA-Z0-9_\-]+)/i);
  if (directVodUrlMatch) {
    return { type: 'vod', id: directVodUrlMatch[1] };
  }

  // 5. Channel videos index: kick.com/[channel]/videos
  const channelVideosIndex = trimmed.match(/kick\.com\/([a-zA-Z0-9_-]+)\/videos\/?$/i);
  if (channelVideosIndex) {
    return { type: 'channel', channel: channelVideosIndex[1] };
  }

  // 6. Channel link: kick.com/[channel] or @[channel]
  const atMatch = trimmed.match(/^@([a-zA-Z0-9_-]+)$/);
  if (atMatch) return { type: 'channel', channel: atMatch[1] };

  const chMatch = trimmed.match(/kick\.com\/([a-zA-Z0-9_-]+)/i);
  if (chMatch && !['clips', 'video', 'categories', 'search', 'following'].includes(chMatch[1].toLowerCase())) {
    return { type: 'channel', channel: chMatch[1] };
  }

  // 7. Single word streamer name
  if (/^[a-zA-Z0-9_-]{2,30}$/.test(trimmed)) {
    return { type: 'channel', channel: trimmed };
  }

  return { type: 'invalid' };
}

// Fetch clip details from Kick API
async function fetchKickClip(clipId: string) {
  const url = `https://kick.com/api/v2/clips/${clipId}`;
  const json = await curlJson(url);
  const clip = json.clip || json;

  if (!clip || !clip.id) {
    throw new Error('Klip bilgileri bulunamadı. Bağlantının doğruluğunu kontrol edin.');
  }

  const videoUrl = clip.clip_url || clip.video_url;

  return {
    id: clip.id,
    title: clip.title || 'Kick Klibi',
    duration: Math.round(clip.duration || 30),
    views: clip.views || clip.view_count || 0,
    created_at: clip.created_at || clip.started_at || new Date().toISOString(),
    thumbnail_url: clip.thumbnail_url,
    clip_url: videoUrl,
    video_url: videoUrl,
    category: {
      name: clip.category?.name || 'Genel',
      slug: clip.category?.slug || 'general',
      banner: clip.category?.banner || null,
    },
    channel: {
      username: clip.channel?.username || 'Kick Streamer',
      slug: clip.channel?.slug || 'streamer',
      profile_picture: clip.channel?.profile_picture || null,
    },
    creator: {
      username: clip.creator?.username || clip.creator?.slug || 'Kullanıcı',
      profile_picture: clip.creator?.profile_picture || null,
    },
  };
}

// Fetch full VOD details from Kick API with channel fallback
async function fetchKickVod(targetId: string, channelHint?: string) {
  let vodData: any = null;
  let resolvedChannel = channelHint;

  // If targetId contains a Kick URL, parse it
  if (targetId.includes('kick.com')) {
    const parsed = parseKickInput(targetId);
    if (parsed.id) targetId = parsed.id;
    if (parsed.channel && !resolvedChannel) resolvedChannel = parsed.channel;
  }

  // 1. If targetId looks like a standard UUID, try v1/video endpoint first
  const isUuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(targetId);
  if (isUuid) {
    try {
      const v1Res = await curlJson(`https://kick.com/api/v1/video/${targetId}`);
      if (v1Res) {
        if (v1Res.livestream?.channel?.slug && !resolvedChannel) {
          resolvedChannel = v1Res.livestream.channel.slug;
        }
        if (!v1Res.cause && v1Res.source) {
          vodData = v1Res;
        }
      }
    } catch {
      // ignore
    }
  }

  // 2. If channel is known, search the channel's v2 videos list
  if ((!vodData || !vodData.source) && resolvedChannel) {
    try {
      const v2Videos = await curlJson(`https://kick.com/api/v2/channels/${resolvedChannel}/videos`);
      if (Array.isArray(v2Videos) && v2Videos.length > 0) {
        const found =
          v2Videos.find(
            (v: any) =>
              v.video?.uuid?.toLowerCase() === targetId.toLowerCase() ||
              v.slug?.toLowerCase() === targetId.toLowerCase() ||
              String(v.id) === targetId ||
              String(v.video?.id) === targetId
          ) || (targetId.toLowerCase() === resolvedChannel.toLowerCase() || targetId === 'latest' ? v2Videos[0] : null);

        if (found && found.source) {
          const rawDuration = found.duration || 0;
          const durationSec = rawDuration > 100000 ? Math.round(rawDuration / 1000) : Math.round(rawDuration);
          const masterUrl = found.source;
          const baseUrl = masterUrl.replace(/\/master\.m3u8.*$/, '');
          return {
            uuid: found.video?.uuid || found.slug || targetId,
            id: found.id,
            title: found.session_title || 'Kick Yayını',
            channel: {
              username: resolvedChannel,
              slug: resolvedChannel,
              profile_picture: null,
            },
            duration: durationSec,
            created_at: found.created_at || new Date().toISOString(),
            views: found.views || 0,
            thumbnail_url: found.thumbnail?.src || '',
            source: masterUrl,
            is_live: Boolean(found.is_live),
            qualities: [
              { id: '1080p', label: '1080p60 Full HD', resolution: '1920x1080', url: `${baseUrl}/1080p60/playlist.m3u8` },
              { id: '720p', label: '720p60 HD', resolution: '1280x720', url: `${baseUrl}/720p60/playlist.m3u8` },
              { id: '480p', label: '480p SD', resolution: '852x480', url: `${baseUrl}/480p30/playlist.m3u8` },
              { id: '360p', label: '360p Hafif', resolution: '640x360', url: `${baseUrl}/360p30/playlist.m3u8` },
              { id: 'mp3', label: 'MP3 Ses Kaydı', resolution: '192 kbps', url: masterUrl },
            ],
          };
        }
      }
    } catch {
      // ignore
    }
  }

  // 3. If vodData has valid source
  if (vodData && vodData.source) {
    const rawDuration = vodData.livestream?.duration || vodData.duration || 0;
    const durationSec = rawDuration > 100000 ? Math.round(rawDuration / 1000) : Math.round(rawDuration);
    const masterUrl = vodData.source;
    const baseUrl = masterUrl.replace(/\/master\.m3u8.*$/, '');

    return {
      uuid: vodData.uuid || targetId,
      id: vodData.id,
      title: vodData.livestream?.session_title || vodData.session_title || 'Kick Yayını',
      channel: {
        username: vodData.livestream?.channel?.user?.username || vodData.livestream?.channel?.slug || resolvedChannel || 'Kick Streamer',
        slug: vodData.livestream?.channel?.slug || resolvedChannel || 'streamer',
        profile_picture: vodData.livestream?.channel?.user?.profile_pic || vodData.livestream?.channel?.profile_picture || null,
      },
      duration: durationSec,
      created_at: vodData.created_at || vodData.livestream?.created_at || new Date().toISOString(),
      views: vodData.views || vodData.livestream?.views || 0,
      thumbnail_url: vodData.thumbnail?.src || vodData.livestream?.thumbnail?.src || '',
      source: masterUrl,
      is_live: Boolean(vodData.livestream?.is_live),
      qualities: [
        { id: '1080p', label: '1080p60 Full HD', resolution: '1920x1080', url: `${baseUrl}/1080p60/playlist.m3u8` },
        { id: '720p', label: '720p60 HD', resolution: '1280x720', url: `${baseUrl}/720p60/playlist.m3u8` },
        { id: '480p', label: '480p SD', resolution: '852x480', url: `${baseUrl}/480p30/playlist.m3u8` },
        { id: '360p', label: '360p Hafif', resolution: '640x360', url: `${baseUrl}/360p30/playlist.m3u8` },
        { id: 'mp3', label: 'MP3 Ses Kaydı', resolution: '192 kbps', url: masterUrl },
      ],
    };
  }

  const channelContext = resolvedChannel ? ` (@${resolvedChannel} kanalında)` : '';
  throw new Error(`Aradığınız yayın${channelContext} Kick sunucularından kaldırılmış, süresi dolmuş veya gizli olabilir.`);
}

// Fetch channel information, live status, and previous VODs
async function fetchKickChannel(channelSlug: string) {
  const [v1Res, v2Videos] = await Promise.allSettled([
    curlJson(`https://kick.com/api/v1/channels/${channelSlug}`),
    curlJson(`https://kick.com/api/v2/channels/${channelSlug}/videos`),
  ]);

  const json = v1Res.status === 'fulfilled' ? v1Res.value : null;
  const videosList = v2Videos.status === 'fulfilled' && Array.isArray(v2Videos.value) ? v2Videos.value : [];

  if (!json && videosList.length === 0) {
    throw new Error(`"${channelSlug}" adlı kanal veya yayıncı bulunamadı.`);
  }

  const vodsMap = new Map<string, any>();

  // 1. Add v2 videos first (they have verified working source URLs!)
  for (const v of videosList) {
    const uuid = v.video?.uuid || v.slug || String(v.id);
    if (!uuid) continue;
    const rawDuration = v.duration || 0;
    const durationSec = rawDuration > 100000 ? Math.round(rawDuration / 1000) : Math.round(rawDuration);
    vodsMap.set(uuid, {
      id: v.id,
      uuid: v.video?.uuid || uuid,
      title: v.session_title || 'Geçmiş Yayın',
      duration: durationSec,
      created_at: v.created_at,
      views: v.views || 0,
      thumbnail_url: v.thumbnail?.src || '',
      source: v.source || '',
      categories: (v.categories || []).map((c: any) => c.name),
    });
  }

  // 2. Add any v1 previous_livestreams
  if (json?.previous_livestreams) {
    for (const v of json.previous_livestreams) {
      const uuid = v.video?.uuid;
      if (uuid && !vodsMap.has(uuid)) {
        const rawDuration = v.duration || 0;
        const durationSec = rawDuration > 100000 ? Math.round(rawDuration / 1000) : Math.round(rawDuration);
        vodsMap.set(uuid, {
          id: v.id,
          uuid,
          title: v.session_title || 'Geçmiş Yayın',
          duration: durationSec,
          created_at: v.created_at,
          views: v.views || 0,
          thumbnail_url: v.thumbnail?.src || '',
          source: v.source || '',
          categories: (v.categories || []).map((c: any) => c.name),
        });
      }
    }
  }

  const vods = Array.from(vodsMap.values());
  const isLive = Boolean(json?.livestream && json.livestream.is_live);
  const liveSession = isLive
    ? {
        id: json.livestream.id,
        title: json.livestream.session_title,
        viewer_count: json.livestream.viewer_count || 0,
        start_time: json.livestream.start_time,
        category: json.livestream.categories?.[0]?.name || 'Canlı Yayın',
      }
    : null;

  return {
    id: json?.id || 0,
    username: json?.user?.username || json?.slug || channelSlug,
    slug: json?.slug || channelSlug,
    profile_picture: json?.user?.profile_pic || null,
    banner_image: json?.banner_image?.url || null,
    bio: json?.user?.bio || null,
    followers_count: json?.followersCount || 0,
    is_live: isLive,
    live_playback_url: json?.playback_url || null,
    live_session: liveSession,
    vods,
  };
}

// Clean filename
function sanitizeFilename(name: string): string {
  return name
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 60);
}

// Convert non-ASCII / Turkish characters to safe ASCII for HTTP Content-Disposition filename
function toSafeAscii(str: string): string {
  const trMap: Record<string, string> = {
    ç: 'c', Ç: 'C', ğ: 'g', Ğ: 'G', ı: 'i', İ: 'I',
    ö: 'o', Ö: 'O', ş: 's', Ş: 'S', ü: 'u', Ü: 'U',
  };
  return str
    .replace(/[çÇğĞıİöÖşŞüÜ]/g, (m) => trMap[m] || m)
    .replace(/[^a-zA-Z0-9_\-\.]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 60);
}

// API: Universal input handler (Clips, VODs, Channels)
app.get('/api/clip/info', async (req: Request, res: Response) => {
  try {
    const rawUrl = (req.query.url as string) || '';
    if (!rawUrl) {
      return res.status(400).json({ error: 'Lütfen bir Kick linki girin.' });
    }

    const parsed = parseKickInput(rawUrl);

    if (parsed.type === 'invalid') {
      return res.status(400).json({
        error: 'Geçersiz Kick bağlantısı. Örnek klip: kick.com/elraenn?clip=clip_... veya yayın: kick.com/xqc',
      });
    }

    // If user provided a full VOD link or UUID
    if (parsed.type === 'vod' && parsed.id) {
      const vodData = await fetchKickVod(parsed.id, parsed.channel);
      return res.json({ success: true, type: 'vod', is_vod: true, data: vodData });
    }

    // If user provided a channel name or link
    if (parsed.type === 'channel' && parsed.channel) {
      const isExplicitVideosUrl = rawUrl.includes('/videos');
      const channelData = await fetchKickChannel(parsed.channel).catch(() => null);

      if (isExplicitVideosUrl && channelData) {
        return res.json({ success: true, type: 'channel', is_channel: true, data: channelData });
      }

      // Check for channel clips first (so clip downloader receives a playable clip)
      try {
        const cJson = await curlJson(`https://kick.com/api/v2/channels/${parsed.channel}/clips?sort=view&time=all`);
        if (cJson.clips && cJson.clips.length > 0) {
          const clipData = await fetchKickClip(cJson.clips[0].id);
          return res.json({ success: true, type: 'clip', data: clipData, channelData: channelData || undefined, ...clipData });
        }
      } catch {
        // ignore
      }

      // If no clips were found but channel data exists
      if (channelData) {
        return res.json({ success: true, type: 'channel', is_channel: true, data: channelData });
      }
    }

    let clipId = parsed.id;
    if (!clipId) {
      return res.status(404).json({ error: 'Bu kanalda klip veya yayın bulunamadı.' });
    }

    const clipData = await fetchKickClip(clipId);
    return res.json({ success: true, type: 'clip', data: clipData, ...clipData });
  } catch (err: any) {
    console.error('Info query error:', err);
    return res.status(500).json({
      error: err.message || 'Bilgiler alınamadı. Lütfen bağlantıyı kontrol edin.',
    });
  }
});

// API: Dedicated VOD details
app.get('/api/vod/info', async (req: Request, res: Response) => {
  try {
    const id = (req.query.id as string) || (req.query.uuid as string) || (req.query.url as string) || '';
    if (!id) {
      return res.status(400).json({ error: 'VOD ID veya URL belirtilmedi.' });
    }

    const parsed = parseKickInput(id);
    let targetUuid = id;
    let channelHint = (req.query.channel as string) || undefined;

    if (parsed.type === 'vod' && parsed.id) {
      targetUuid = parsed.id;
      if (parsed.channel && !channelHint) channelHint = parsed.channel;
    } else if (parsed.type === 'channel' && parsed.channel) {
      targetUuid = 'latest';
      channelHint = parsed.channel;
    }

    const vodData = await fetchKickVod(targetUuid, channelHint);
    return res.json({ success: true, data: vodData });
  } catch (err: any) {
    console.error('VOD info error:', err);
    return res.status(500).json({ error: err.message || 'Yayın bilgileri alınamadı.' });
  }
});

// API: Dedicated Channel details
app.get('/api/channel/info', async (req: Request, res: Response) => {
  try {
    const channel = (req.query.channel as string) || (req.query.username as string) || '';
    if (!channel) {
      return res.status(400).json({ error: 'Kanal adı belirtilmedi.' });
    }

    const channelData = await fetchKickChannel(channel);
    return res.json({ success: true, data: channelData });
  } catch (err: any) {
    console.error('Channel info error:', err);
    return res.status(500).json({ error: err.message || 'Kanal bilgileri alınamadı.' });
  }
});

// API: Stream video for player preview
app.get('/api/clip/stream', async (req: Request, res: Response) => {
  try {
    let videoUrl = (req.query.url as string) || '';
    const clipId = (req.query.id as string) || '';

    if (!videoUrl && clipId) {
      const clip = await fetchKickClip(clipId);
      videoUrl = clip.video_url;
    }

    if (!videoUrl) {
      return res.status(400).send('Video URL belirtilmedi.');
    }

    // Cache key based on URL
    const urlHash = crypto.createHash('md5').update(videoUrl).digest('hex');
    const cachedFilePath = path.join(os.tmpdir(), `kick_stream_${urlHash}.mp4`);

    // If cached file exists, stream with HTTP Range support for scrubbing
    if (fs.existsSync(cachedFilePath)) {
      return res.sendFile(cachedFilePath);
    }

    // Otherwise transcode quickly using ffmpeg -c copy with timestamp fix and then serve
    exec(`ffmpeg -y -fflags +genpts+discardcorrupt -i "${videoUrl}" -c:v copy -c:a copy -bsf:a aac_adtstoasc -avoid_negative_ts make_zero -movflags +faststart "${cachedFilePath}"`, (err) => {
      if (err || !fs.existsSync(cachedFilePath)) {
        console.error('Stream transcode error:', err);
        return res.status(500).send('Video akışı hazırlanamadı.');
      }
      return res.sendFile(cachedFilePath);
    });
  } catch (err: any) {
    console.error('Stream error:', err);
    if (!res.headersSent) {
      res.status(500).send('Video yüklenemedi.');
    }
  }
});

// API: Direct file download
app.get('/api/clip/download', async (req: Request, res: Response) => {
  const tmpFilesToClean: string[] = [];

  const cleanup = () => {
    for (const f of tmpFilesToClean) {
      try {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      } catch (e) {
        // ignore
      }
    }
  };

  try {
    let videoUrl = (req.query.url as string) || '';
    const clipId = (req.query.id as string) || '';
    const format = ((req.query.format as string) || 'mp4').toLowerCase();
    const quality = (req.query.quality as string) || '1080p';
    const customBitrate = (req.query.bitrate as string) || '';
    const customTitle = (req.query.title as string) || 'Kick_Klip';
    const startSec = req.query.start ? parseFloat(req.query.start as string) : null;
    const endSec = req.query.end ? parseFloat(req.query.end as string) : null;

    if (!videoUrl && clipId) {
      const clip = await fetchKickClip(clipId);
      videoUrl = clip.video_url;
    }

    if (!videoUrl) {
      return res.status(400).json({ error: 'Video URL bulunamadı.' });
    }

    const isAudio = ['mp3', 'm4a', 'wav'].includes(format);
    const extMap: Record<string, string> = {
      mp4: 'mp4',
      webm: 'webm',
      avi: 'avi',
      mkv: 'mkv',
      mp3: 'mp3',
      m4a: 'm4a',
      wav: 'wav',
    };
    const ext = extMap[format] || 'mp4';

    const mimeMap: Record<string, string> = {
      mp4: 'video/mp4',
      webm: 'video/webm',
      avi: 'video/x-msvideo',
      mkv: 'video/x-matroska',
      mp3: 'audio/mpeg',
      m4a: 'audio/mp4',
      wav: 'audio/wav',
    };
    const contentType = mimeMap[format] || 'video/mp4';

    let qualitySuffix = quality;
    if (isAudio) {
      qualitySuffix = `Audio_${customBitrate || '192k'}`;
    } else if (customBitrate) {
      qualitySuffix = `${quality}_${customBitrate}`;
    }

    const safeTitle = sanitizeFilename(customTitle) || 'Kick_Klip';
    const outFilename = `${safeTitle}_${qualitySuffix}.${ext}`;
    const asciiFilename = `${toSafeAscii(safeTitle)}_${qualitySuffix}.${ext}`;
    const encodedUtf8Filename = encodeURIComponent(outFilename);

    const urlHash = crypto.createHash('md5').update(videoUrl).digest('hex');
    const cachedStreamFile = path.join(os.tmpdir(), `kick_stream_${urlHash}.mp4`);

    // Fast-path: If user wants 1080p full MP4 clip and it was already cached by player preview
    const isFull1080p = (quality === '1080p' || quality === 'original') && format === 'mp4' && !customBitrate && (!startSec || startSec <= 0) && (!endSec || endSec <= 0);

    if (isFull1080p && fs.existsSync(cachedStreamFile) && fs.statSync(cachedStreamFile).size > 1024) {
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedUtf8Filename}`);
      return res.sendFile(cachedStreamFile);
    }

    const uniqueId = crypto.randomBytes(6).toString('hex');
    const tempFilePath = path.join(os.tmpdir(), `kick_dl_${uniqueId}.${ext}`);
    tmpFilesToClean.push(tempFilePath);

    const mode = ((req.query.mode as string) || '').toLowerCase();
    const isEditMode = mode === 'edit' || req.query.edit === 'true' || req.query.edit === '1';

    let ffmpegCmd = `ffmpeg -nostdin -y -fflags +genpts+discardcorrupt -user_agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -headers "Referer: https://kick.com/\r\n" -rw_timeout 15000000 `;

    // Fast input seek if startSec > 0
    if (startSec !== null && !isNaN(startSec) && startSec > 0) {
      ffmpegCmd += `-ss ${startSec} `;
    }

    ffmpegCmd += `-i "${videoUrl}" `;

    // Output duration trimming (MUST be after -i)
    if (endSec !== null && !isNaN(endSec) && endSec > 0) {
      if (startSec !== null && !isNaN(startSec) && startSec > 0) {
        ffmpegCmd += `-t ${endSec - startSec} `;
      } else {
        ffmpegCmd += `-t ${endSec} `;
      }
    }

    if (format === 'mp3') {
      const audioBitrate = customBitrate || (quality === '64k' ? '64k' : quality === '128k' ? '128k' : quality === '320k' ? '320k' : '192k');
      ffmpegCmd += `-vn -c:a libmp3lame -b:a ${audioBitrate} "${tempFilePath}"`;
    } else if (format === 'm4a') {
      const audioBitrate = customBitrate || '192k';
      ffmpegCmd += `-vn -c:a aac -b:a ${audioBitrate} "${tempFilePath}"`;
    } else if (format === 'wav') {
      ffmpegCmd += `-vn -c:a pcm_s16le "${tempFilePath}"`;
    } else if (format === 'webm') {
      let scaleFilter = '';
      let videoBitrate = customBitrate || '1500k';
      let audioBitrate = '96k';

      if (quality === '1080p') {
        scaleFilter = '-vf scale=-2:1080';
        videoBitrate = customBitrate || '2800k';
        audioBitrate = '128k';
      } else if (quality === '720p') {
        scaleFilter = '-vf scale=-2:720';
        videoBitrate = customBitrate || '1600k';
      } else if (quality === '720p_eco') {
        scaleFilter = '-vf scale=-2:720';
        videoBitrate = customBitrate || '1000k';
        audioBitrate = '80k';
      } else if (quality === '480p') {
        scaleFilter = '-vf scale=-2:480';
        videoBitrate = customBitrate || '700k';
        audioBitrate = '64k';
      } else if (quality === '360p') {
        scaleFilter = '-vf scale=-2:360';
        videoBitrate = customBitrate || '400k';
        audioBitrate = '48k';
      } else if (quality === '240p') {
        scaleFilter = '-vf scale=-2:240';
        videoBitrate = customBitrate || '180k';
        audioBitrate = '32k';
      }

      ffmpegCmd += `${scaleFilter} -c:v libvpx-vp9 -b:v ${videoBitrate} -deadline realtime -cpu-used 8 -c:a libopus -b:a ${audioBitrate} "${tempFilePath}"`;
    } else if (format === 'avi') {
      let scaleFilter = '';
      let qscale = 3;
      let audioBitrate = '160k';

      if (quality === '1080p') {
        scaleFilter = '';
        qscale = 3;
        audioBitrate = '192k';
      } else if (quality === '720p') {
        scaleFilter = '-vf scale=-2:720';
        qscale = 4;
        audioBitrate = '160k';
      } else if (quality === '720p_eco') {
        scaleFilter = '-vf scale=-2:720';
        qscale = 6;
        audioBitrate = '128k';
      } else if (quality === '480p') {
        scaleFilter = '-vf scale=-2:480';
        qscale = 6;
        audioBitrate = '96k';
      } else if (quality === '360p') {
        scaleFilter = '-vf scale=-2:360';
        qscale = 8;
        audioBitrate = '64k';
      } else if (quality === '240p') {
        scaleFilter = '-vf scale=-2:240';
        qscale = 10;
        audioBitrate = '48k';
      }

      ffmpegCmd += `${scaleFilter} -c:v mpeg4 -qscale:v ${qscale} -c:a libmp3lame -b:a ${audioBitrate} "${tempFilePath}"`;
    } else if (format === 'mkv') {
      if (isEditMode) {
        ffmpegCmd += `-c:v libx264 -preset superfast -g 60 -keyint_min 30 -crf 20 -c:a aac -b:a 192k -avoid_negative_ts make_zero "${tempFilePath}"`;
      } else if (quality === '1080p' && !customBitrate && (!startSec || startSec <= 0) && (!endSec || endSec <= 0)) {
        ffmpegCmd += `-c:v copy -c:a copy -bsf:a aac_adtstoasc -avoid_negative_ts make_zero "${tempFilePath}"`;
      } else {
        const height = quality === '720p' || quality === '720p_eco' ? 720 : quality === '480p' ? 480 : quality === '360p' ? 360 : quality === '240p' ? 240 : 1080;
        ffmpegCmd += `-vf scale=-2:${height} -c:v libx264 -preset superfast -crf 22 -c:a aac -b:a 128k -avoid_negative_ts make_zero "${tempFilePath}"`;
      }
    } else {
      // Default: MP4 (H.264 / AAC)
      if (quality === '1080p' && !customBitrate) {
        ffmpegCmd += `-c:v copy -c:a copy -bsf:a aac_adtstoasc -avoid_negative_ts make_zero -movflags +faststart "${tempFilePath}"`;
      } else if (quality === '720p') {
        ffmpegCmd += `-vf scale=-2:720 -c:v libx264 -preset superfast ${customBitrate ? `-b:v ${customBitrate}` : '-crf 22'} -c:a aac -b:a 160k -avoid_negative_ts make_zero -movflags +faststart "${tempFilePath}"`;
      } else if (quality === '720p_eco') {
        ffmpegCmd += `-vf scale=-2:720 -c:v libx264 -preset superfast -b:v 1200k -maxrate 1500k -bufsize 2400k -c:a aac -b:a 96k -avoid_negative_ts make_zero -movflags +faststart "${tempFilePath}"`;
      } else if (quality === '480p') {
        ffmpegCmd += `-vf scale=-2:480 -c:v libx264 -preset superfast ${customBitrate ? `-b:v ${customBitrate}` : '-b:v 800k -maxrate 1000k -bufsize 1600k'} -c:a aac -b:a 96k -avoid_negative_ts make_zero -movflags +faststart "${tempFilePath}"`;
      } else if (quality === '360p') {
        ffmpegCmd += `-vf scale=-2:360 -c:v libx264 -preset superfast -b:v 450k -maxrate 600k -bufsize 900k -c:a aac -b:a 64k -avoid_negative_ts make_zero -movflags +faststart "${tempFilePath}"`;
      } else if (quality === '240p') {
        ffmpegCmd += `-vf scale=-2:240 -c:v libx264 -preset superfast -b:v 200k -maxrate 300k -bufsize 500k -c:a aac -b:a 48k -avoid_negative_ts make_zero -movflags +faststart "${tempFilePath}"`;
      } else {
        ffmpegCmd += `-c:v copy -c:a copy -bsf:a aac_adtstoasc -avoid_negative_ts make_zero -movflags +faststart "${tempFilePath}"`;
      }
    }

    exec(ffmpegCmd, (err) => {
      const fileExists = fs.existsSync(tempFilePath);
      const fileSize = fileExists ? fs.statSync(tempFilePath).size : 0;

      if (err || !fileExists || fileSize < 50000) {
        console.error('FFmpeg transcode error or truncated file (size:', fileSize, 'bytes):', err);
        cleanup();
        if (!res.headersSent) {
          return res.status(500).json({ error: 'Klip indirilemedi veya dosya eksik işlendi. Lütfen tekrar deneyin.' });
        }
        return;
      }

      if (isFull1080p && !fs.existsSync(cachedStreamFile)) {
        try {
          fs.copyFileSync(tempFilePath, cachedStreamFile);
        } catch (e) {
          // ignore cache copy error
        }
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedUtf8Filename}`);

      const fileStream = fs.createReadStream(tempFilePath);
      fileStream.on('close', () => {
        cleanup();
      });
      fileStream.on('error', (streamErr) => {
        console.error('Stream response error:', streamErr);
        cleanup();
      });
      fileStream.pipe(res);
    });
  } catch (err: any) {
    cleanup();
    console.error('Download error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'İndirme işlemi başarısız oldu.' });
    }
  }
});

// API: Stream VOD segment for player preview
app.get('/api/vod/stream', async (req: Request, res: Response) => {
  try {
    let sourceUrl = (req.query.url as string) || '';
    const vodUuid = (req.query.uuid as string) || (req.query.id as string) || '';

    if (!sourceUrl && vodUuid) {
      const vod = await fetchKickVod(vodUuid);
      sourceUrl = vod.source;
    }

    if (!sourceUrl) {
      return res.status(400).send('VOD URL belirtilmedi.');
    }

    const urlHash = crypto.createHash('md5').update(sourceUrl).digest('hex');
    const cachedFilePath = path.join(os.tmpdir(), `kick_vod_preview_${urlHash}.mp4`);

    if (fs.existsSync(cachedFilePath)) {
      return res.sendFile(cachedFilePath);
    }

    // Transcode first 60 seconds for smooth instant preview scrubbing
    exec(`ffmpeg -y -t 60 -i "${sourceUrl}" -c copy -movflags +faststart "${cachedFilePath}"`, (err) => {
      if (err || !fs.existsSync(cachedFilePath)) {
        console.error('VOD preview transcode error:', err);
        return res.status(500).send('Yayın önizlemesi hazırlanamadı.');
      }
      return res.sendFile(cachedFilePath);
    });
  } catch (err: any) {
    console.error('VOD stream error:', err);
    if (!res.headersSent) {
      res.status(500).send('Yayın önizlemesi yüklenemedi.');
    }
  }
});

// Helper to resolve exact variant subplaylist URL (e.g. 1080p60/playlist.m3u8) directly from master.m3u8
async function resolveKickVariantUrl(masterUrl: string, targetQuality: string): Promise<string> {
  if (!masterUrl || !masterUrl.includes('master.m3u8')) return masterUrl;
  const baseUrl = masterUrl.replace(/\/master\.m3u8.*$/, '');
  try {
    const masterText = await new Promise<string>((resolve) => {
      execFile(
        'curl',
        [
          '-s',
          masterUrl,
          '-H',
          'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          '-H',
          'Referer: https://kick.com/',
        ],
        { timeout: 5000 },
        (err, stdout) => {
          resolve(err ? '' : stdout);
        }
      );
    });

    if (masterText && masterText.includes('EXTM3U')) {
      const lines = masterText.split('\n').map((l) => l.trim());
      const qualityTag =
        targetQuality === '720p' || targetQuality === '720p_eco'
          ? '720'
          : targetQuality === '480p'
          ? '480'
          : targetQuality === '360p'
          ? '360'
          : targetQuality === '240p'
          ? '160'
          : '1080';

      // 1. Find matching quality stream line
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('EXT-X-STREAM-INF') && lines[i].includes(qualityTag)) {
          const nextLine = lines[i + 1];
          if (nextLine && !nextLine.startsWith('#')) {
            return nextLine.startsWith('http') ? nextLine : `${baseUrl}/${nextLine}`;
          }
        }
      }

      // 2. Fallback to first available video stream in playlist (highest quality)
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('EXT-X-STREAM-INF')) {
          const nextLine = lines[i + 1];
          if (nextLine && !nextLine.startsWith('#')) {
            return nextLine.startsWith('http') ? nextLine : `${baseUrl}/${nextLine}`;
          }
        }
      }
    }
  } catch (e) {
    console.warn('Error resolving master variant:', e);
  }

  if (targetQuality === '720p' || targetQuality === '720p_eco') {
    return `${baseUrl}/720p60/playlist.m3u8`;
  } else if (targetQuality === '480p') {
    return `${baseUrl}/480p30/playlist.m3u8`;
  } else if (targetQuality === '360p' || targetQuality === '240p') {
    return `${baseUrl}/360p30/playlist.m3u8`;
  }
  return `${baseUrl}/1080p60/playlist.m3u8`;
}

// API: VOD (Full Broadcast) Download
app.get('/api/vod/download', async (req: Request, res: Response) => {
  const tmpFilesToClean: string[] = [];

  const cleanup = () => {
    for (const f of tmpFilesToClean) {
      try {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      } catch (e) {
        // ignore
      }
    }
  };

  try {
    let sourceUrl = (req.query.url as string) || '';
    const vodUuid = (req.query.uuid as string) || (req.query.id as string) || '';
    const format = ((req.query.format as string) || 'mp4').toLowerCase();
    const quality = (req.query.quality as string) || '1080p';
    const customBitrate = (req.query.bitrate as string) || '';
    const customTitle = (req.query.title as string) || 'Kick_Yayin';
    const startSec = req.query.start ? parseFloat(req.query.start as string) : 0;
    const durationSec = req.query.duration ? parseFloat(req.query.duration as string) : null;
    const endSec = req.query.end ? parseFloat(req.query.end as string) : null;

    if (!sourceUrl && vodUuid) {
      const vod = await fetchKickVod(vodUuid);
      sourceUrl = vod.source;
    }

    if (!sourceUrl) {
      return res.status(400).json({ error: 'Yayın akış URL (m3u8) bulunamadı.' });
    }

    // Resolve exact variant subplaylist (e.g. 1080p60/playlist.m3u8) directly from master.m3u8
    const streamUrlToDownload = await resolveKickVariantUrl(sourceUrl, quality);

    const isAudio = ['mp3', 'm4a', 'wav'].includes(format);
    const extMap: Record<string, string> = {
      mp4: 'mp4',
      webm: 'webm',
      avi: 'avi',
      mkv: 'mkv',
      mp3: 'mp3',
      m4a: 'm4a',
      wav: 'wav',
    };
    const ext = extMap[format] || 'mp4';

    const mimeMap: Record<string, string> = {
      mp4: 'video/mp4',
      webm: 'video/webm',
      avi: 'video/x-msvideo',
      mkv: 'video/x-matroska',
      mp3: 'audio/mpeg',
      m4a: 'audio/mp4',
      wav: 'audio/wav',
    };
    const contentType = mimeMap[format] || 'video/mp4';

    const safeTitle = sanitizeFilename(customTitle) || 'Kick_Yayin';
    let qualitySuffix = quality;
    if (isAudio) {
      qualitySuffix = `Audio_${customBitrate || '192k'}`;
    } else if (customBitrate) {
      qualitySuffix = `${quality}_${customBitrate}`;
    }

    const hasRange = startSec > 0 || (durationSec && durationSec > 0) || (endSec && endSec > startSec);
    const rangeSuffix = hasRange ? '_Bolum' : '_Tam';
    const outFilename = `${safeTitle}${rangeSuffix}_${qualitySuffix}.${ext}`;
    const asciiFilename = `${toSafeAscii(safeTitle)}${rangeSuffix}_${qualitySuffix}.${ext}`;
    const encodedUtf8Filename = encodeURIComponent(outFilename);

    const uniqueId = crypto.randomBytes(6).toString('hex');
    const tempFilePath = path.join(os.tmpdir(), `kick_vod_${uniqueId}.${ext}`);
    tmpFilesToClean.push(tempFilePath);

    let ffmpegCmd = `ffmpeg -nostdin -y -fflags +genpts+discardcorrupt -user_agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -headers "Referer: https://kick.com/\r\n" -rw_timeout 15000000 `;

    // Fast input seek if startSec > 0
    if (startSec > 0) {
      ffmpegCmd += `-ss ${startSec} `;
    }

    ffmpegCmd += `-i "${streamUrlToDownload}" `;

    // Output duration trimming (MUST be after -i)
    if (durationSec && durationSec > 0) {
      ffmpegCmd += `-t ${durationSec} `;
    } else if (endSec && endSec > startSec) {
      ffmpegCmd += `-t ${endSec - startSec} `;
    }

    if (format === 'mp3') {
      const audioBitrate = customBitrate || (quality === '64k' ? '64k' : quality === '128k' ? '128k' : quality === '320k' ? '320k' : '192k');
      ffmpegCmd += `-vn -c:a libmp3lame -b:a ${audioBitrate} "${tempFilePath}"`;
    } else if (format === 'm4a') {
      const audioBitrate = customBitrate || '192k';
      ffmpegCmd += `-vn -c:a aac -b:a ${audioBitrate} "${tempFilePath}"`;
    } else if (format === 'wav') {
      ffmpegCmd += `-vn -c:a pcm_s16le "${tempFilePath}"`;
    } else if (format === 'webm') {
      const webmBitrate = customBitrate || (quality === '240p' ? '180k' : quality === '360p' ? '400k' : quality === '480p' ? '700k' : quality === '720p_eco' ? '1000k' : quality === '720p' ? '1600k' : '2800k');
      const scaleArg = quality === '240p' ? '-vf scale=-2:240' : '';
      ffmpegCmd += `${scaleArg} -c:v libvpx-vp9 -b:v ${webmBitrate} -deadline realtime -cpu-used 8 -c:a libopus -b:a 96k "${tempFilePath}"`;
    } else if (format === 'avi') {
      const qscale = quality === '240p' ? 10 : quality === '360p' ? 8 : quality === '480p' ? 6 : quality === '720p_eco' ? 6 : 4;
      const scaleArg = quality === '240p' ? '-vf scale=-2:240' : '';
      ffmpegCmd += `${scaleArg} -c:v mpeg4 -qscale:v ${qscale} -c:a libmp3lame -b:a 160k "${tempFilePath}"`;
    } else if (format === 'mkv') {
      ffmpegCmd += `-c:v copy -c:a copy -bsf:a aac_adtstoasc -avoid_negative_ts make_zero "${tempFilePath}"`;
    } else {
      // Default: MP4 (H.264 / AAC)
      // For VODs & long broadcasts (especially 1080p Full HD):
      // ALWAYS use high-speed direct stream copy with timestamp zeroing, AAC bitstream conversion, and faststart.
      // This runs at 20x-30x speed, uses 0% CPU, eliminates 100-sec timeouts, and guarantees smooth timeline scrubbing in CapCut/Premiere!
      ffmpegCmd += `-c:v copy -c:a copy -bsf:a aac_adtstoasc -avoid_negative_ts make_zero -movflags +faststart "${tempFilePath}"`;
    }

    // Generous timeout for VOD downloading
    exec(ffmpegCmd, { timeout: 600000 }, (err) => {
      const fileExists = fs.existsSync(tempFilePath);
      const fileSize = fileExists ? fs.statSync(tempFilePath).size : 0;

      if (err || !fileExists || fileSize < 50000) {
        console.error('VOD FFmpeg transcode error or truncated file (size:', fileSize, 'bytes):', err);
        cleanup();
        if (!res.headersSent) {
          return res.status(500).json({ error: 'Yayın indirilirken bir hata oluştu veya dosya eksik işlendi. Lütfen tekrar deneyin.' });
        }
        return;
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedUtf8Filename}`);

      const fileStream = fs.createReadStream(tempFilePath);
      fileStream.on('close', () => {
        cleanup();
      });
      fileStream.on('error', (streamErr) => {
        console.error('VOD Stream response error:', streamErr);
        cleanup();
      });
      fileStream.pipe(res);
    });
  } catch (err: any) {
    cleanup();
    console.error('VOD Download error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Yayın indirme işlemi başarısız oldu.' });
    }
  }
});

// API: Trending Clips
const handleTrending = async (_req: Request, res: Response) => {
  const now = Date.now();
  if (trendingCache && now - trendingCache.timestamp < CACHE_DURATION) {
    return res.json(trendingCache.data);
  }

  try {
    const channels = ['xqc', 'elraenn'];
    const clipPromises = channels.map(async (ch) => {
      try {
        const json = await curlJson(`https://kick.com/api/v2/channels/${ch}/clips?sort=view&time=all`);
        return (json.clips || []).slice(0, 4).map((c: any) => ({
          id: c.id,
          title: c.title || 'Kick Klibi',
          duration: Math.round(c.duration || 30),
          views: c.views || c.view_count || 0,
          thumbnail_url: c.thumbnail_url,
          clip_url: c.clip_url || c.video_url,
          video_url: c.clip_url || c.video_url,
          category: { name: c.category?.name || 'Oyun' },
          channel: {
            username: c.channel?.username || ch,
            slug: c.channel?.slug || ch,
            profile_picture: c.channel?.profile_picture || null
          }
        }));
      } catch (e) {
        return [];
      }
    });

    const results = await Promise.all(clipPromises);
    const combined = results.flat();

    // Fallback if network issue
    const finalClips = combined.length > 0 ? combined : [
      {
        id: 'clip_01H811MXG4FBR62FXPE1AXABDH',
        title: 'soda',
        duration: 33,
        views: 333847,
        thumbnail_url: 'https://clips.kick.com/clips/dh/clip_01H811MXG4FBR62FXPE1AXABDH/thumbnail.png',
        clip_url: 'https://clips.kick.com/clips/dh/clip_01H811MXG4FBR62FXPE1AXABDH/playlist.m3u8',
        video_url: 'https://clips.kick.com/clips/dh/clip_01H811MXG4FBR62FXPE1AXABDH/playlist.m3u8',
        category: { name: 'Just Chatting' },
        channel: { username: 'xQc', slug: 'xqc' }
      }
    ];

    trendingCache = {
      timestamp: now,
      data: finalClips
    };

    return res.json(finalClips);
  } catch (err: any) {
    console.error('Trending fetch error:', err);
    return res.json([]);
  }
};

app.get('/api/trending', handleTrending);
app.get('/api/clip/trending', handleTrending);

// Start Express Server
async function startServer() {
  const distPath = path.resolve(__dirname, 'dist');
  const indexPath = path.resolve(distPath, 'index.html');
  const hasDist = fs.existsSync(indexPath);

  if (process.env.NODE_ENV === 'production' && hasDist) {
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(indexPath);
    });
  } else {
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️ Uyarı: dist/index.html bulunamadı! Vite middleware moduna geçiliyor.');
    }
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Kick Klip Indirici server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

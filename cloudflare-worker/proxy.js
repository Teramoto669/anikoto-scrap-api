/**
 * Aonime Proxy — Cloudflare Worker
 *
 * Proxies ALL HLS requests (manifests, segments, subtitles) with Referer spoofing.
 * CF Workers free tier: 100K req/day, UNLIMITED bandwidth — safe for video proxying.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const { searchParams } = new URL(request.url);
    const target  = searchParams.get('url');
    const referer = searchParams.get('referer');

    if (!target) {
      return Response.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    // Build upstream headers with spoofed Referer
    const upstreamHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': '*/*',
    };
    if (referer) {
      upstreamHeaders['Referer'] = referer;
      try { upstreamHeaders['Origin'] = new URL(referer).origin; } catch (_) {}
    }

    let upstreamRes;
    try {
      upstreamRes = await fetch(target, { headers: upstreamHeaders });
    } catch (err) {
      return Response.json({ error: String(err) }, { status: 502 });
    }

    if (!upstreamRes.ok) {
      return Response.json({ error: `Upstream ${upstreamRes.status}` }, { status: upstreamRes.status });
    }

    const contentType = upstreamRes.headers.get('content-type') || '';
    const isManifest  = /\.m3u8/i.test(target) || contentType.includes('mpegurl');
    const isSubtitle  = /\.vtt/i.test(target) || contentType.includes('vtt');

    // ── Subtitle → proxy as-is ───────────────────────────────────────────────
    if (isSubtitle) {
      return new Response(upstreamRes.body, {
        status: upstreamRes.status,
        headers: { 'Content-Type': 'text/vtt; charset=utf-8', ...CORS_HEADERS },
      });
    }

    // ── Manifest → rewrite ALL URLs to go through this worker ────────────────
    if (isManifest) {
      const workerBase = new URL(request.url).origin;
      const text = await upstreamRes.text();
      const rewritten = text.split('\n').map(line => {
        // Rewrite URI attributes in tags (e.g. #EXT-X-KEY:URI="...", #EXT-X-MAP:URI="...")
        if (line.includes('URI=')) {
          line = line.replace(/URI=["']([^"']+)["']/g, (match, uri) => {
            let keyUrl = uri;
            try {
              if (!keyUrl.startsWith('http')) {
                keyUrl = new URL(keyUrl, target).toString();
              }
              let url = `${workerBase}/?url=${encodeURIComponent(keyUrl)}`;
              if (referer) url += `&referer=${encodeURIComponent(referer)}`;
              return `URI="${url}"`;
            } catch {
              return match;
            }
          });
        }

        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return line;
        try {
          const resolved = new URL(trimmed, target).toString();
          // ALL segment and sub-manifest URLs → through this worker
          let url = `${workerBase}/?url=${encodeURIComponent(resolved)}`;
          if (referer) url += `&referer=${encodeURIComponent(referer)}`;
          return url;
        } catch {
          return line;
        }
      }).join('\n');

      return new Response(rewritten, {
        status: upstreamRes.status,
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Cache-Control': 'no-store',
          ...CORS_HEADERS,
        },
      });
    }

    // ── Video segment → stream with corrected content-type ───────────────────
    // CDNs disguise .ts segments as image/jpg, image/png etc. to prevent hotlinking.
    // Force application/octet-stream so HLS.js decodes them correctly.
    const isRealMedia = contentType.includes('video') ||
                        contentType.includes('audio') ||
                        contentType.includes('octet-stream') ||
                        contentType.includes('mp4') ||
                        contentType.includes('mpegurl');

    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      headers: {
        'Content-Type': isRealMedia ? contentType : 'application/octet-stream',
        'Cache-Control': 'public, max-age=3600',
        ...CORS_HEADERS,
      },
    });
  },
};

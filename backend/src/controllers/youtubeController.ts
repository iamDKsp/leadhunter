import { Request, Response } from 'express';
import ytdl from 'ytdl-core';
import ytsr from 'ytsr';

// Configure ffmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export const streamYouTubeAudio = async (req: Request, res: Response) => {
    try {
        const query = req.query.q as string;

        if (!query) {
            return res.status(400).json({ error: 'Query parameter "q" is required' });
        }

        console.log(`[YouTube Audio] Searching for: ${query}`);

        // Search youtube
        const searchFilters = await ytsr.getFilters(query);
        const filter = searchFilters.get('Type')?.get('Video');

        if (!filter?.url) {
            return res.status(404).json({ error: 'Search failed' });
        }

        const searchResults = await ytsr(filter.url, { limit: 1 });

        if (!searchResults.items || searchResults.items.length === 0) {
            return res.status(404).json({ error: 'No video found' });
        }

        const video = searchResults.items[0] as any;
        console.log(`[YouTube Audio] Found: ${video.title} (${video.url})`);

        // Set headers for audio streaming
        res.setHeader('Content-Type', 'audio/webm'); // ytdl often gets webm or m4a, both are streamable
        res.setHeader('Transfer-Encoding', 'chunked');
        res.setHeader('Access-Control-Allow-Origin', '*'); // explicitly allow cross origin

        // Let the client know the name we found via custom header
        const safeTitle = encodeURIComponent(video.title || 'Unknown Title');
        res.setHeader('X-Track-Name', safeTitle);
        console.log(`[YouTube Audio] Found: ${video.title} (${video.url})`);

        console.log(`[YouTube Audio] Starting stream pipe conversion...`);

        // Get the audio-only stream from ytdl-core
        const audioStream = ytdl(video.url, {
            filter: 'audioonly',
            quality: 'highestaudio',
            highWaterMark: 1 << 25, // 32MB buffer
            requestOptions: {
                headers: {
                    // Impersonate a regular browser
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept-Language': 'en-US,en;q=0.9',
                }
            }
        });

        // Pipe directly to response since ytdl provides a streamable format (usually webm or m4a that most browsers support natively)
        // Note: Modern browsers support piping standard m4a/webm chunks.
        audioStream.pipe(res);

        audioStream.on('error', (err) => {
            console.error('[YouTube Audio] YTDL Error:', err.message);
            if (!res.headersSent) {
                res.status(500).end('Streaming conversion error');
            }
        });

        audioStream.on('finish', () => {
            console.log('[YouTube Audio] Stream finished');
        });

        // Handle client disconnect
        req.on('close', () => {
            console.log('[YouTube Audio] Client disconnected, killing stream');
            audioStream.destroy();
        });

    } catch (error: any) {
        console.error('[YouTube Audio] Error:', error.message || error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal streaming error', details: error.message });
        }
    }
};

const fetch = require('node-fetch');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    const rawUrl = req.query.url;
    if (!rawUrl) {
        return res.status(400).json({ error: 'Missing url parameter' });
    }

    try {
        const match = rawUrl.match(/id=([0-9]+)/);
        if (!match) {
            return res.status(400).json({ error: 'Could not find song id in url' });
        }
        const songId = match[1];

        // 只請求歌詞 API
        const lyricApi = `https://api-enhanced-endblue.vercel.app/lyric/new?id=${songId}`;
        const lyricRes = await fetch(lyricApi).catch(() => null);
        const lyricData = lyricRes && lyricRes.ok ? await lyricRes.json() : {};

        const lrcContent = lyricData.lrc?.lyric || lyricData.lyric || "";
        const yrcContent = lyricData.yrc?.lyric || "";

        // 嘗試從 LRC 標頭提取歌名和歌手 (若有 [ti:] 和 [ar:])
        let songName = "網易雲音樂";
        let artistName = "同步歌詞";

        if (lrcContent) {
            const tiMatch = lrcContent.match(/\[ti:(.*?)\]/);
            const arMatch = lrcContent.match(/\[ar:(.*?)\]/);
            if (tiMatch && tiMatch[1].trim()) songName = tiMatch[1].trim();
            if (arMatch && arMatch[1].trim()) artistName = arMatch[1].trim();
        }

        return res.status(200).json({
            success: true,
            songId: songId,
            name: songName,
            artist: artistName,
            lrc: lrcContent,
            yrc: yrcContent
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
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

        // 核心修正：將 song/detail 改用目前相容性最高的 song/detail 複數參數或 song 路由
        const detailApi = `https://api-enhanced-endblue.vercel.app/song/detail?ids=${songId}`;
        const lyricApi = `https://api-enhanced-endblue.vercel.app/lyric/new?id=${songId}`;

        const [detailRes, lyricRes] = await Promise.all([
            fetch(detailApi).catch(() => null),
            fetch(lyricApi).catch(() => null)
        ]);

        let detailData = {};
        if (detailRes && detailRes.ok) {
            detailData = await detailRes.json();
        }

        const lyricData = lyricRes && lyricRes.ok ? await lyricRes.json() : {};

        let songName = "";
        let artistName = "";

        // 解析網易雲常見的幾種 songs 回傳結構
        let songsList = detailData.songs || detailData.data || (detailData.name ? [detailData] : []);

        if (songsList.length > 0) {
            let songObj = songsList[0];
            songName = songObj.name || songObj.title || "";

            // 處理歌手陣列
            let artists = songObj.ar || songObj.artists || songObj.singer;
            if (Array.isArray(artists) && artists.length > 0) {
                artistName = artists.map(a => a.name).join(' / ');
            } else if (typeof songObj.artist === 'string') {
                artistName = songObj.artist;
            }
        }

        // 提取歌詞
        const lrcContent = lyricData.lrc?.lyric || lyricData.lyric || "";
        const yrcContent = lyricData.yrc?.lyric || "";

        return res.status(200).json({
            success: true,
            songId: songId,
            name: songName || "未知歌曲",
            artist: artistName || "未知歌手",
            lrc: lrcContent,
            yrc: yrcContent
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
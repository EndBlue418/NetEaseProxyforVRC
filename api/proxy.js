const fetch = require('node-fetch');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    const rawUrl = req.query.url; // 玩家輸入的完整網址
    if (!rawUrl) {
        return res.status(400).json({ error: 'Missing url parameter' });
    }

    try {
        // 從完整網址中自動用正则抓取 id (例如 id=3384000719)
        const match = rawUrl.match(/id=([0-9]+)/);
        if (!match) {
            return res.status(400).json({ error: 'Invalid NetEase Song ID in URL' });
        }
        const songId = match[1];

        // 自動拼湊你原本那套共用 API 的網址
        const detailApi = `https://api-enhanced-endblue.vercel.app/song/detail?id=${songId}`;
        const lyricApi = `https://api-enhanced-endblue.vercel.app/lyric/new?id=${songId}`;

        // 同時抓取詳情與歌詞
        const [detailRes, lyricRes] = await Promise.all([
            fetch(detailApi),
            fetch(lyricApi)
        ]);

        const detailData = await detailRes.json();
        const lyricData = await lyricRes.json();

        // 合併回傳給 Unity
        return res.status(200).json({
            songs: detailData.songs || detailData,
            lrc: lyricData.lrc || {},
            yrc: lyricData.yrc || {}
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
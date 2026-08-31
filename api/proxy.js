const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // 允許跨域
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    const rawUrl = req.query.url; // 玩家輸入的整串網址
    if (!rawUrl) {
        return res.status(400).json({ error: 'Missing url parameter' });
    }

    try {
        // 自動從任何網易雲或 biliplayer 網址中用正規表達式把 id 抓出來
        const match = rawUrl.match(/id=([0-9]+)/);
        if (!match) {
            return res.status(400).json({ error: 'Could not find song id in url' });
        }
        const songId = match[1];

        // 呼叫你原本那套共用的網易雲 API
        const detailApi = `https://api-enhanced-endblue.vercel.app/song/detail?id=${songId}`;
        const lyricApi = `https://api-enhanced-endblue.vercel.app/lyric/new?id=${songId}`;

        const [detailRes, lyricRes] = await Promise.all([
            fetch(detailApi),
            fetch(lyricApi)
        ]);

        const detailData = await detailRes.json();
        const lyricData = await lyricRes.json();

        // 整理並回傳乾淨的 JSON 給 VRChat
        return res.status(200).json({
            success: true,
            songId: songId,
            name: detailData.songs?.[0]?.name || detailData.name || "未知歌曲",
            artist: detailData.songs?.[0]?.ar?.[0]?.name || detailData.ar?.[0]?.name || "未知歌手",
            lrc: lyricData.lrc?.lyric || "",
            yrc: lyricData.yrc?.lyric || ""
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
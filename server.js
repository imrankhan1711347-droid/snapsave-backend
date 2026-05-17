process.env.PUPPETEER_CACHE_DIR = "/opt/render/.cache/puppeteer";

const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');

const app = express();

app.use(cors());
app.use(express.json());

app.post('/api', async (req, res) => {

  const url = req.body.url;

  if (!url) {
    return res.json({ error: 'No URL provided' });
  }

  let browser;

  try {

    browser = await puppeteer.launch({
      headless: "new",
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    const videoUrls = [];

    await page.setRequestInterception(true);

    page.on('request', req => req.continue());

    page.on('response', async response => {

      const resUrl = response.url();
      const ct = response.headers()['content-type'] || '';

      if (
        ct.includes('video') ||
        resUrl.match(/\.mp4|\.m3u8|\.webm|sc-cdn\.net/i)
      ) {
        if (!videoUrls.includes(resUrl)) {
          videoUrls.push(resUrl);
        }
      }
    });

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    );

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    await new Promise(r => setTimeout(r, 5000));

    const finalVideos = [...new Set(videoUrls)].filter(u =>
      u.startsWith('http') &&
      !u.match(/\.(jpg|jpeg|png|webp|gif)/i)
    );

    if (finalVideos.length === 0) {
      return res.json({
        error: 'No video found (Snap may be private or blocked)'
      });
    }

    return res.json({
      success: true,
      videoUrl: finalVideos[0]
    });

  } catch (e) {

    return res.json({
      error: e.message
    });

  } finally {

    if (browser) await browser.close();

  }

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('Server running');
});

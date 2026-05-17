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
      headless: 'new',

      // ✅ CRITICAL FIX (Render Chrome path auto detect)
      executablePath: process.env.CHROME_PATH || undefined,

      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--single-process',
        '--no-zygote'
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
        resUrl.match(/\.mp4|\.m3u8|\.webm/i)
      ) {
        if (!videoUrls.includes(resUrl)) {
          videoUrls.push(resUrl);
        }
      }
    });

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    await new Promise(r => setTimeout(r, 5000));

    if (videoUrls.length === 0) {
      return res.json({ error: 'No video found' });
    }

    return res.json({
      success: true,
      videoUrl: videoUrls[0]
    });

  } catch (e) {
    return res.json({ error: e.message });
  } finally {
    if (browser) await browser.close();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running'));

const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');

const app = express();

app.use(cors());
app.use(express.json());

app.post('/api', async (req, res) => {
  const url = req.body.url;

  if (!url) return res.json({ error: 'No URL provided' });

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    const page = await browser.newPage();
    const videoUrls = [];

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    const html = await page.content();

    const matches = html.match(/https?:\/\/[^"']+\.mp4[^"']*/g);

    if (matches && matches.length > 0) {
      videoUrls.push(...matches);
    }

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

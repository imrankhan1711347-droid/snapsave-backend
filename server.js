const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Snap Backend Running');
});

app.post('/api', async (req, res) => {
  const url = req.body.url;

  if (!url) {
    return res.json({ success: false, error: 'No URL provided' });
  }

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      // IMPORTANT: allow render auto chrome detection
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--single-process'
      ]
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'
    );

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    await page.waitForTimeout(5000);

    const html = await page.content();

    // extract video links
    const matches = html.match(/https?:\/\/[^"' ]+\.mp4[^"' ]*/g);

    if (!matches || matches.length === 0) {
      return res.json({ success: false, error: 'No video found' });
    }

    return res.json({
      success: true,
      videoUrl: matches[0]
    });

  } catch (e) {
    return res.json({
      success: false,
      error: e.message
    });
  } finally {
    if (browser) await browser.close();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running'));

function $(id) {
  return document.getElementById(id);
}

function setStatus(html) {
  $('status').innerHTML = html;
}

function loading(msg) {
  setStatus(`
    <div class="loading">
      <div class="spin"></div>
      <span>${msg}</span>
    </div>
  `);
}

function showErr(msg) {
  setStatus(`
    <div class="err-box">
      ${msg}
    </div>
  `);
}

function isSnapUrl(u) {
  try {
    return /snapchat\.com|snap\.com/.test(new URL(u).hostname);
  } catch {
    return false;
  }
}

function esc(s) {
  return String(s || '')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

async function handleFetch() {

  const raw = $('snapUrl').value.trim();
  const btn = $('fetchBtn');

  if (!raw) {
    showErr('Please paste Snapchat URL');
    return;
  }

  if (!isSnapUrl(raw)) {
    showErr('Invalid Snapchat URL');
    return;
  }

  btn.disabled = true;

  loading('Fetching video using server...');

  try {

    const res = await fetch('https://snapsave-backend-ekhr.onrender.com/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: raw })
    });

    const data = await res.json();

    if (!data.success) {
      showErr(data.error || 'No video found');
      btn.disabled = false;
      return;
    }

    setStatus(`
      <div class="result-wrap">

        <video class="single-media" controls playsinline preload="metadata">
          <source src="${esc(data.videoUrl)}" type="video/mp4">
        </video>

        <div class="single-foot">

          <div class="single-title">Snapchat Video</div>

          <div class="actions">
            <a href="${esc(data.videoUrl)}" download="snapvideo.mp4" class="btn-dl">
              Download Video
            </a>
          </div>

        </div>

      </div>
    `);

  } catch (e) {
    showErr('Server error: ' + e.message);
  }

  btn.disabled = false;
}

window.addEventListener('DOMContentLoaded', () => {

  $('fetchBtn').addEventListener('click', handleFetch);

  $('snapUrl').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleFetch();
  });

});

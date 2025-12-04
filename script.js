// QuickTube script
const urlInput = document.getElementById('urlInput');
const playBtn = document.getElementById('playBtn');
const playerWrapper = document.getElementById('playerWrapper');
const playerContainer = document.getElementById('playerContainer');
const copyPermalink = document.getElementById('copyPermalink');
const permText = document.getElementById('permText');
const autoplayCheckbox = document.getElementById('autoplay');
const nocookieCheckbox = document.getElementById('nocookie');
const startAtInput = document.getElementById('startAt');

function extractYouTubeID(urlOrId){
  if(!urlOrId) return null;
  urlOrId = urlOrId.trim();

  // If it looks like an ID (11 chars typical, allow more flex)
  const possibleId = urlOrId.match(/^[A-Za-z0-9_-]{6,20}$/);
  if(possibleId) return possibleId[0];

  // Common URL forms:
  // - https://www.youtube.com/watch?v=VIDEOID
  // - https://youtu.be/VIDEOID
  // - https://www.youtube.com/embed/VIDEOID
  // - any query string containing v=
  try {
    const u = new URL(urlOrId);
    // youtu.be short link
    if(u.hostname.includes('youtu.be')){
      const p = u.pathname.split('/');
      return p.filter(Boolean)[0] || null;
    }
    // youtube.com
    if(u.searchParams && u.searchParams.get('v')){
      return u.searchParams.get('v');
    }
    // /embed/VIDEOID or /v/VIDEOID
    const embedMatch = u.pathname.match(/\/(?:embed|v)\/([A-Za-z0-9_-]{6,20})/);
    if(embedMatch) return embedMatch[1];

    // fallback: last path segment
    const segs = u.pathname.split('/').filter(Boolean);
    if(segs.length) {
      const last = segs[segs.length - 1];
      if(/[A-Za-z0-9_-]{6,20}/.test(last)) return last;
    }
  } catch (e) {
    // Not a valid URL - maybe the user pasted "watch?v=ID"
    const vMatch = urlOrId.match(/v=([A-Za-z0-9_-]{6,20})/);
    if(vMatch) return vMatch[1];
  }
  return null;
}

function buildEmbedUrl(videoId, {autoplay=false, start=0, nocookie=true}){
  const domain = nocookie ? 'https://www.youtube-nocookie.com/embed/' : 'https://www.youtube.com/embed/';
  const params = new URLSearchParams({
    rel: '0', // don't show related videos from other channels
    modestbranding: '1',
    playsinline: '1'
  });
  if(autoplay) params.set('autoplay', '1');
  if(start && start > 0) params.set('start', String(Math.floor(start)));
  return domain + encodeURIComponent(videoId) + '?' + params.toString();
}

function showPlayerFor(videoId){
  const autoplay = autoplayCheckbox.checked;
  const nocookie = nocookieCheckbox.checked;
  const start = Number(startAtInput.value) || 0;
  const embed = buildEmbedUrl(videoId, {autoplay, start, nocookie});

  playerContainer.innerHTML = `<iframe src="${embed}" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  playerWrapper.classList.remove('hidden');

  // update permalink
  const newUrl = new URL(window.location.href);
  newUrl.searchParams.set('v', videoId);
  if(autoplay) newUrl.searchParams.set('autoplay', '1');
  if(start && start > 0) newUrl.searchParams.set('start', String(Math.floor(start)));
  newUrl.searchParams.set('nocookie', nocookie ? '1' : '0');
  history.replaceState({}, '', newUrl.toString());
  permText.textContent = newUrl.toString();
}

function handlePlay(){
  const raw = urlInput.value;
  const id = extractYouTubeID(raw);
  if(!id){
    alert('Could not find a valid YouTube video ID in that input. Try pasting the full URL or the 11-character ID.');
    return;
  }
  showPlayerFor(id);
}

playBtn.addEventListener('click', handlePlay);
urlInput.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') handlePlay(); });

copyPermalink.addEventListener('click', async ()=>{
  const text = permText.textContent || window.location.href;
  try{
    await navigator.clipboard.writeText(text);
    copyPermalink.textContent = 'Copied!';
    setTimeout(()=> copyPermalink.textContent = 'Copy permalink', 1500);
  }catch(e){
    alert('Could not copy automatically — select and copy the URL manually: ' + text);
  }
});

// On load: if ?v=VIDEOID present, auto-load it.
(function initFromUrl(){
  const params = new URLSearchParams(window.location.search);
  const v = params.get('v') || params.get('video');
  if(v){
    urlInput.value = v;
    // set options from URL if present
    if(params.get('autoplay') === '1' || params.get('autoplay') === 'true') autoplayCheckbox.checked = true;
    if(params.get('nocookie') === '0') nocookieCheckbox.checked = false;
    const start = parseInt(params.get('start') || '0', 10);
    if(!isNaN(start) && start > 0) startAtInput.value = String(start);
    showPlayerFor(v);
  }
})();

// -----------------------------------------------------------
//  INSERT YOUR API KEY HERE
// -----------------------------------------------------------
const API_KEY = "AIzaSyARcD-x5JeRFI0zmjQu3FGWJwLAQFjcTi8";
// -----------------------------------------------------------

const urlInput = document.getElementById("urlInput");
const playBtn = document.getElementById("playBtn");
const playerWrapper = document.getElementById("playerWrapper");
const playerContainer = document.getElementById("playerContainer");

const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const trendingList = document.getElementById("trendingList");

const autoplayCheckbox = document.getElementById("autoplay");
const nocookieCheckbox = document.getElementById("nocookie");
const startAtInput = document.getElementById("startAt");


// --------------------------
// Extract Video ID
// --------------------------
function extractYouTubeID(urlOrId) {
  if (!urlOrId) return null;
  urlOrId = urlOrId.trim();

  const possibleId = urlOrId.match(/^[A-Za-z0-9_-]{6,20}$/);
  if (possibleId) return possibleId[0];

  try {
    const u = new URL(urlOrId);

    if (u.hostname.includes("youtu.be"))
      return u.pathname.split("/")[1];

    if (u.searchParams.get("v"))
      return u.searchParams.get("v");

    const embed = u.pathname.match(/\/embed\/([A-Za-z0-9_-]+)/);
    if (embed) return embed[1];

  } catch {}

  return null;
}


// --------------------------
// Build Embed URL
// --------------------------
function buildEmbedUrl(videoId) {
  const autoplay = autoplayCheckbox.checked;
  const nocookie = nocookieCheckbox.checked;
  const start = Number(startAtInput.value) || 0;

  const domain = nocookie
    ? "https://www.youtube-nocookie.com/embed/"
    : "https://www.youtube.com/embed/";

  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1"
  });

  if (autoplay) params.set("autoplay", "1");
  if (start > 0) params.set("start", String(start));

  return `${domain}${videoId}?${params.toString()}`;
}


// --------------------------
// Load video into player
// --------------------------
function showPlayer(videoId) {
  const embedUrl = buildEmbedUrl(videoId);

  playerContainer.innerHTML =
    `<iframe src="${embedUrl}" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;

  playerWrapper.classList.remove("hidden");
}


// --------------------------
// URL → Play Button
// --------------------------
function handlePlay() {
  const id = extractYouTubeID(urlInput.value);
  if (!id) {
    alert("Invalid YouTube link or ID.");
    return;
  }
  showPlayer(id);
}

playBtn.addEventListener("click", handlePlay);
urlInput.addEventListener("keydown", e => {
  if (e.key === "Enter") handlePlay();
});


// -----------------------------------------------------------
// SEARCH FEATURE
// -----------------------------------------------------------
async function searchYouTube(query) {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=12&q=${encodeURIComponent(query)}&key=${API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();
  return data.items || [];
}

function renderVideoList(container, items) {
  container.innerHTML = "";

  items.forEach(v => {
    const id = v.id.videoId || v.id;
    const sn = v.snippet;

    const item = document.createElement("div");
    item.className = "video-item";

    item.innerHTML = `
      <div class="video-thumb">
        <img src="${sn.thumbnails.medium.url}">
      </div>
      <div class="video-info">
        <h3>${sn.title}</h3>
        <p>${sn.channelTitle}</p>
      </div>
      <button class="play-mini">Play</button>
    `;

    item.querySelector(".play-mini").onclick = () => showPlayer(id);

    container.appendChild(item);
  });
}

searchBtn.addEventListener("click", async () => {
  const q = searchInput.value.trim();
  if (!q) return;

  searchResults.innerHTML = "<p>Searching…</p>";
  const results = await searchYouTube(q);
  renderVideoList(searchResults, results);
});

searchInput.addEventListener("keydown", e => {
  if (e.key === "Enter") searchBtn.click();
});


// -----------------------------------------------------------
// TRENDING VIDEOS
// -----------------------------------------------------------
async function loadTrending() {
  const url =
    `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&maxResults=12&regionCode=US&key=${API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  renderVideoList(trendingList, data.items || []);
}

loadTrending();

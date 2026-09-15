(() => {
  "use strict";

  const views = ["loadingView", "setupView", "readyView", "scannerView", "playingView", "answerView"];
  const $ = (id) => document.getElementById(id);
  const redirectUri = `${location.origin}${location.pathname}`;
  const tokenKey = "moonshot_spotify_tokens";
  const clientKey = "moonshot_spotify_client_id";
  const verifierKey = "moonshot_spotify_verifier";
  const stateKey = "moonshot_spotify_state";

  let tracks = [];
  let tracksById = new Map();
  let tokens = null;
  let player = null;
  let deviceId = null;
  let scanner = null;
  let currentTrack = null;
  let isPlaying = true;

  function showView(id) {
    views.forEach((viewId) => $(viewId).classList.toggle("hidden", viewId !== id));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showError(id, message) {
    const element = $(id);
    element.textContent = message;
    element.classList.toggle("hidden", !message);
  }

  function getClientId() {
    return localStorage.getItem(clientKey)?.trim() || "";
  }

  function saveTokens(value) {
    tokens = value;
    sessionStorage.setItem(tokenKey, JSON.stringify(value));
  }

  function readTokens() {
    try {
      return JSON.parse(sessionStorage.getItem(tokenKey) || "null");
    } catch {
      return null;
    }
  }

  function base64Url(bytes) {
    return btoa(String.fromCharCode(...bytes))
      .replaceAll("+", "-")
      .replaceAll("/", "_")
      .replaceAll("=", "");
  }

  async function sha256(value) {
    const data = new TextEncoder().encode(value);
    return new Uint8Array(await crypto.subtle.digest("SHA-256", data));
  }

  function randomString(length = 64) {
    const values = new Uint8Array(length);
    crypto.getRandomValues(values);
    return base64Url(values);
  }

  async function connectSpotify() {
    const clientId = $("clientId").value.trim();
    if (!/^[a-zA-Z0-9]{20,64}$/.test(clientId)) {
      showError("setupError", "Controleer de Client ID en probeer opnieuw.");
      return;
    }

    localStorage.setItem(clientKey, clientId);
    const verifier = randomString(64);
    const state = randomString(24);
    sessionStorage.setItem(verifierKey, verifier);
    sessionStorage.setItem(stateKey, state);
    const challenge = base64Url(await sha256(verifier));

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: redirectUri,
      code_challenge_method: "S256",
      code_challenge: challenge,
      state,
      scope: "streaming user-read-email user-read-private user-read-playback-state user-modify-playback-state"
    });
    location.assign(`https://accounts.spotify.com/authorize?${params}`);
  }

  async function exchangeCode(code) {
    const clientId = getClientId();
    const verifier = sessionStorage.getItem(verifierKey);
    const expectedState = sessionStorage.getItem(stateKey);
    const params = new URLSearchParams(location.search);
    if (!clientId || !verifier || params.get("state") !== expectedState) {
      throw new Error("De Spotify-aanmelding kon niet worden gecontroleerd. Start de koppeling opnieuw.");
    }

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        code_verifier: verifier
      })
    });
    if (!response.ok) throw new Error("Spotify kon de aanmelding niet afronden.");
    const result = await response.json();
    saveTokens({
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      expires_at: Date.now() + (result.expires_in - 60) * 1000
    });
    sessionStorage.removeItem(verifierKey);
    sessionStorage.removeItem(stateKey);
    history.replaceState({}, "", redirectUri);
  }

  async function refreshAccessToken() {
    if (!tokens?.refresh_token) throw new Error("Meld opnieuw aan bij Spotify.");
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: getClientId(),
        grant_type: "refresh_token",
        refresh_token: tokens.refresh_token
      })
    });
    if (!response.ok) throw new Error("De Spotify-sessie is verlopen. Meld opnieuw aan.");
    const result = await response.json();
    saveTokens({
      access_token: result.access_token,
      refresh_token: result.refresh_token || tokens.refresh_token,
      expires_at: Date.now() + (result.expires_in - 60) * 1000
    });
    return tokens.access_token;
  }

  async function accessToken() {
    if (!tokens) throw new Error("Meld eerst aan bij Spotify.");
    if (Date.now() >= tokens.expires_at) return refreshAccessToken();
    return tokens.access_token;
  }

  function waitForSpotifySdk() {
    return new Promise((resolve, reject) => {
      if (window.Spotify) return resolve();
      const timeout = setTimeout(() => reject(new Error("De Spotify-speler kon niet worden geladen.")), 12000);
      window.onSpotifyWebPlaybackSDKReady = () => {
        clearTimeout(timeout);
        resolve();
      };
    });
  }

  async function createPlayer() {
    if (player) return;
    await waitForSpotifySdk();
    player = new Spotify.Player({
      name: "Moonshot Hitster",
      getOAuthToken: async (callback) => callback(await accessToken()),
      volume: 0.78,
      enableMediaSession: false
    });

    player.addListener("ready", ({ device_id }) => { deviceId = device_id; });
    player.addListener("not_ready", () => { deviceId = null; });
    player.addListener("account_error", () => showError("playError", "Voor volledige nummers is Spotify Premium nodig."));
    player.addListener("authentication_error", () => showError("playError", "De Spotify-sessie is verlopen. Koppel opnieuw."));
    player.addListener("playback_error", () => showError("playError", "Dit nummer kon niet worden afgespeeld."));
    player.addListener("player_state_changed", (state) => {
      if (!state) return;
      isPlaying = !state.paused;
      $("togglePlayback").textContent = isPlaying ? "Ⅱ" : "▶";
      $("togglePlayback").setAttribute("aria-label", isPlaying ? "Pauzeren" : "Afspelen");
      $("record").classList.toggle("paused", !isPlaying);
    });
    await player.connect();
  }

  async function waitForDevice() {
    for (let attempt = 0; attempt < 30 && !deviceId; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    if (!deviceId) throw new Error("De Spotify-speler is nog niet klaar. Probeer opnieuw.");
  }

  async function spotifyRequest(path, options = {}) {
    let response = await fetch(`https://api.spotify.com/v1${path}`, {
      ...options,
      headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json", ...(options.headers || {}) }
    });
    if (response.status === 401) {
      await refreshAccessToken();
      response = await fetch(`https://api.spotify.com/v1${path}`, {
        ...options,
        headers: { Authorization: `Bearer ${tokens.access_token}`, "Content-Type": "application/json", ...(options.headers || {}) }
      });
    }
    if (!response.ok && response.status !== 204) throw new Error(`Spotify-fout ${response.status}`);
    return response;
  }

  async function activatePlayer() {
    await createPlayer();
    await player.activateElement();
    await waitForDevice();
    await spotifyRequest("/me/player", { method: "PUT", body: JSON.stringify({ device_ids: [deviceId], play: false }) });
  }

  function trackIdFromQr(value) {
    const input = String(value || "").trim();
    const urlMatch = input.match(/open\.spotify\.com\/track\/([A-Za-z0-9]{22})/i);
    const uriMatch = input.match(/^spotify:track:([A-Za-z0-9]{22})$/i);
    return urlMatch?.[1] || uriMatch?.[1] || null;
  }

  async function playTrack(trackId) {
    currentTrack = tracksById.get(trackId) || { spotify_id: trackId, title: "Onbekend nummer", artist: "Spotify", year: "—" };
    showView("playingView");
    showError("playError", "");
    try {
      await waitForDevice();
      await spotifyRequest(`/me/player/play?device_id=${encodeURIComponent(deviceId)}`, {
        method: "PUT",
        body: JSON.stringify({ uris: [`spotify:track:${trackId}`], position_ms: 0 })
      });
      isPlaying = true;
      $("record").classList.remove("paused");
      $("togglePlayback").textContent = "Ⅱ";
    } catch (error) {
      showError("playError", "Het nummer startte niet. Tik op afspelen of controleer je Premium-account.");
    }
  }

  async function stopScanner() {
    if (!scanner) return;
    try { await scanner.stop(); } catch { /* scanner was already stopped */ }
    try { await scanner.clear(); } catch { /* reader was already cleared */ }
    scanner = null;
  }

  async function startScanner() {
    showView("scannerView");
    showError("scanError", "");
    if (!window.Html5Qrcode) {
      showError("scanError", "De QR-scanner kon niet worden geladen. Controleer de internetverbinding.");
      return;
    }

    await stopScanner();
    scanner = new Html5Qrcode("qrReader");
    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 12, qrbox: (w, h) => ({ width: Math.floor(Math.min(w, h) * .67), height: Math.floor(Math.min(w, h) * .67) }) },
        async (decodedText) => {
          const trackId = trackIdFromQr(decodedText);
          if (!trackId) {
            showError("scanError", "Dit is geen geldige Spotify-nummercode.");
            return;
          }
          await stopScanner();
          await playTrack(trackId);
        },
        () => {}
      );
    } catch {
      showError("scanError", "Geef de browser toegang tot de camera en probeer opnieuw.");
    }
  }

  async function togglePlayback() {
    if (!player) return;
    await player.togglePlay();
  }

  async function restartTrack() {
    if (!currentTrack) return;
    await player.seek(0);
    const state = await player.getCurrentState();
    if (state?.paused) await player.resume();
  }

  async function revealAnswer() {
    if (!currentTrack) return;
    $("answerYear").textContent = currentTrack.year || "—";
    $("answerTitle").textContent = currentTrack.title || "Onbekend nummer";
    $("answerArtist").textContent = currentTrack.artist || "Onbekende artiest";
    showView("answerView");
  }

  async function resetConnection() {
    await stopScanner();
    try { player?.disconnect(); } catch { /* no active player */ }
    player = null;
    deviceId = null;
    tokens = null;
    currentTrack = null;
    sessionStorage.removeItem(tokenKey);
    localStorage.removeItem(clientKey);
    $("clientId").value = "";
    showView("setupView");
  }

  async function init() {
    $("redirectUri").value = redirectUri;
    $("clientId").value = getClientId();
    $("copyRedirect").addEventListener("click", async () => {
      await navigator.clipboard.writeText(redirectUri);
      $("copyRedirect").textContent = "Gekopieerd";
      setTimeout(() => { $("copyRedirect").textContent = "Kopieer"; }, 1600);
    });
    $("connectButton").addEventListener("click", connectSpotify);
    $("startButton").addEventListener("click", async () => {
      $("startButton").disabled = true;
      $("startButton").textContent = "Speler verbinden…";
      try {
        await activatePlayer();
        await startScanner();
      } catch (error) {
        showView("readyView");
        alert(error.message || "De Spotify-speler kon niet starten.");
      } finally {
        $("startButton").disabled = false;
        $("startButton").textContent = "Start het spel";
      }
    });
    $("resetButton").addEventListener("click", resetConnection);
    $("closeScanner").addEventListener("click", async () => { await stopScanner(); showView("readyView"); });
    $("togglePlayback").addEventListener("click", togglePlayback);
    $("restartTrack").addEventListener("click", restartTrack);
    $("revealButton").addEventListener("click", revealAnswer);
    $("stopAndScan").addEventListener("click", async () => { try { await player.pause(); } catch {} await startScanner(); });
    $("nextCard").addEventListener("click", async () => { try { await player.pause(); } catch {} await startScanner(); });
    $("replayFromAnswer").addEventListener("click", async () => { await restartTrack(); showView("playingView"); });
    document.addEventListener("visibilitychange", () => { if (document.hidden && scanner) stopScanner(); });

    try {
      const response = await fetch("./tracks.json");
      tracks = await response.json();
      tracksById = new Map(tracks.map((track) => [track.spotify_id, track]));
      if (tracks.length !== 95) throw new Error("De nummerlijst is niet compleet.");

      const params = new URLSearchParams(location.search);
      if (params.get("error")) {
        history.replaceState({}, "", redirectUri);
        throw new Error("Spotify-aanmelding geannuleerd.");
      }
      if (params.get("code")) await exchangeCode(params.get("code"));
      else tokens = readTokens();

      if (!tokens || !getClientId()) {
        showView("setupView");
        return;
      }
      await createPlayer();
      showView("readyView");
    } catch (error) {
      showView("setupView");
      showError("setupError", error.message || "De scanner kon niet worden voorbereid.");
    }
  }

  init();
})();

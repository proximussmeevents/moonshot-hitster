(() => {
  "use strict";

  const views = ["loadingView", "setupView", "readyView", "scannerView", "playingView", "answerView"];
  const $ = (id) => document.getElementById(id);
  const redirectUri = `${location.origin}${location.pathname}`;
  const tokenKey = "moonshot_spotify_tokens";
  const clientKey = "moonshot_spotify_client_id";
  const verifierKey = "moonshot_spotify_verifier";
  const stateKey = "moonshot_spotify_state";
  const languageKey = "moonshot_language";

  const translations = {
    nl: {
      pageTitle: "Moonshot Hitster",
      pageDescription: "Scan de Moonshot-muziekkaarten en speel ze direct af in je browser.",
      loading: "Missie wordt klaargezet…",
      setupEyebrow: "Eenmalige voorbereiding",
      setupTitle: "Koppel Spotify",
      setupLead: "Daarna spelen alle nummers binnen deze scanner. Je hoeft tijdens het spel niet meer naar Spotify te wisselen.",
      stepCreate: "Maak een app aan in het Spotify Developer Dashboard.",
      stepRedirect: "Voeg onderstaande terugkeerlink toe bij Redirect URIs.",
      stepClient: "Plak de Client ID en verbind je Premium-account.",
      redirectLabel: "Terugkeerlink",
      copy: "Kopieer",
      copied: "Gekopieerd",
      copyAria: "Kopieer terugkeerlink",
      clientPlaceholder: "Plak hier de Client ID",
      connect: "Verbind met Spotify",
      continueWithoutLinking: "Ga verder zonder koppeling",
      continueWithoutLinkingNote: "Scan een kaart en open het nummer rechtstreeks in Spotify.",
      or: "of",
      openDashboard: "Open Spotify Developer Dashboard",
      downloadRules: "Download spelregels & scoreblad",
      readyEyebrow: "{count} nummers klaar",
      readyTitle: "Klaar voor de lancering?",
      readyLead: "Tik eenmaal op start. Daarna scan je alle kaarten vanuit dit scherm.",
      startGame: "Start het spel",
      connecting: "Speler verbinden…",
      changeConnection: "Spotify-koppeling wijzigen",
      nextCardEyebrow: "Volgende kaart",
      scanTitle: "Scan de QR-code",
      closeScannerAria: "Scanner sluiten",
      scanHelp: "Houd de kaart stil binnen het kader.",
      playingEyebrow: "Nummer speelt",
      playingTitle: "Luister. Weet jij wanneer?",
      restartAria: "Nummer opnieuw starten",
      pauseAria: "Pauzeren",
      playAria: "Afspelen",
      reveal: "Onthul het antwoord",
      stopAndScan: "Stop en scan een andere kaart",
      answerEyebrow: "Het antwoord",
      scanNext: "Scan volgende kaart",
      replay: "Nummer opnieuw afspelen",
      invalidClient: "Controleer de Client ID en probeer opnieuw.",
      loginVerify: "De Spotify-aanmelding kon niet worden gecontroleerd. Start de koppeling opnieuw.",
      loginFailed: "Spotify kon de aanmelding niet afronden.",
      loginAgain: "Meld opnieuw aan bij Spotify.",
      sessionExpired: "De Spotify-sessie is verlopen. Meld opnieuw aan.",
      loginFirst: "Meld eerst aan bij Spotify.",
      sdkFailed: "De Spotify-speler kon niet worden geladen.",
      premiumRequired: "Voor volledige nummers is Spotify Premium nodig.",
      reconnect: "De Spotify-sessie is verlopen. Koppel opnieuw.",
      playbackFailed: "Dit nummer kon niet worden afgespeeld.",
      apiError: "Spotify-fout",
      playerNotReady: "De Spotify-speler is nog niet klaar. Probeer opnieuw.",
      unknownTrack: "Onbekend nummer",
      unknownArtist: "Onbekende artiest",
      trackStartFailed: "Het nummer startte niet. Tik op afspelen of controleer je Premium-account.",
      scannerLoadFailed: "De QR-scanner kon niet worden geladen. Controleer de internetverbinding.",
      invalidQr: "Dit is geen geldige Spotify-nummercode.",
      cameraPermission: "Geef de browser toegang tot de camera en probeer opnieuw.",
      playerStartFailed: "De Spotify-speler kon niet starten.",
      incompleteTracks: "De nummerlijst is niet compleet.",
      loginCancelled: "Spotify-aanmelding geannuleerd.",
      scannerPrepareFailed: "De scanner kon niet worden voorbereid."
    },
    fr: {
      pageTitle: "Moonshot Hitster",
      pageDescription: "Scannez les cartes musicales Moonshot et écoutez-les directement dans votre navigateur.",
      loading: "Préparation de la mission…",
      setupEyebrow: "Configuration unique",
      setupTitle: "Connecter Spotify",
      setupLead: "Ensuite, tous les morceaux seront lus dans ce scanner. Vous ne devrez plus passer à Spotify pendant le jeu.",
      stepCreate: "Créez une application dans le Spotify Developer Dashboard.",
      stepRedirect: "Ajoutez le lien de retour ci-dessous dans Redirect URIs.",
      stepClient: "Collez le Client ID et connectez votre compte Premium.",
      redirectLabel: "Lien de retour",
      copy: "Copier",
      copied: "Copié",
      copyAria: "Copier le lien de retour",
      clientPlaceholder: "Collez le Client ID ici",
      connect: "Se connecter à Spotify",
      continueWithoutLinking: "Continuer sans connexion",
      continueWithoutLinkingNote: "Scannez une carte et ouvrez le morceau directement dans Spotify.",
      or: "ou",
      openDashboard: "Ouvrir Spotify Developer Dashboard",
      downloadRules: "Télécharger les règles et la feuille de score",
      readyEyebrow: "{count} morceaux prêts",
      readyTitle: "Prêt pour le lancement ?",
      readyLead: "Appuyez une fois sur démarrer. Scannez ensuite toutes les cartes depuis cet écran.",
      startGame: "Démarrer le jeu",
      connecting: "Connexion du lecteur…",
      changeConnection: "Modifier la connexion Spotify",
      nextCardEyebrow: "Carte suivante",
      scanTitle: "Scanner le code QR",
      closeScannerAria: "Fermer le scanner",
      scanHelp: "Maintenez la carte immobile dans le cadre.",
      playingEyebrow: "Lecture en cours",
      playingTitle: "Écoutez. Savez-vous quand ?",
      restartAria: "Recommencer le morceau",
      pauseAria: "Pause",
      playAria: "Lecture",
      reveal: "Révéler la réponse",
      stopAndScan: "Arrêter et scanner une autre carte",
      answerEyebrow: "La réponse",
      scanNext: "Scanner la carte suivante",
      replay: "Réécouter le morceau",
      invalidClient: "Vérifiez le Client ID et réessayez.",
      loginVerify: "La connexion Spotify n'a pas pu être vérifiée. Recommencez la connexion.",
      loginFailed: "Spotify n'a pas pu terminer la connexion.",
      loginAgain: "Reconnectez-vous à Spotify.",
      sessionExpired: "La session Spotify a expiré. Reconnectez-vous.",
      loginFirst: "Connectez-vous d'abord à Spotify.",
      sdkFailed: "Le lecteur Spotify n'a pas pu être chargé.",
      premiumRequired: "Spotify Premium est requis pour écouter les morceaux complets.",
      reconnect: "La session Spotify a expiré. Reconnectez le compte.",
      playbackFailed: "Ce morceau n'a pas pu être lu.",
      apiError: "Erreur Spotify",
      playerNotReady: "Le lecteur Spotify n'est pas encore prêt. Réessayez.",
      unknownTrack: "Morceau inconnu",
      unknownArtist: "Artiste inconnu",
      trackStartFailed: "Le morceau n'a pas démarré. Appuyez sur lecture ou vérifiez votre compte Premium.",
      scannerLoadFailed: "Le scanner QR n'a pas pu être chargé. Vérifiez la connexion internet.",
      invalidQr: "Ce code n'est pas un code de morceau Spotify valide.",
      cameraPermission: "Autorisez l'accès à la caméra dans le navigateur et réessayez.",
      playerStartFailed: "Le lecteur Spotify n'a pas pu démarrer.",
      incompleteTracks: "La liste des morceaux est incomplète.",
      loginCancelled: "Connexion Spotify annulée.",
      scannerPrepareFailed: "Le scanner n'a pas pu être préparé."
    },
    en: {
      pageTitle: "Moonshot Hitster",
      pageDescription: "Scan the Moonshot music cards and play them directly in your browser.",
      loading: "Preparing the mission…",
      setupEyebrow: "One-time setup",
      setupTitle: "Connect Spotify",
      setupLead: "Afterwards, every track plays inside this scanner. You will not need to switch to Spotify during the game.",
      stepCreate: "Create an app in the Spotify Developer Dashboard.",
      stepRedirect: "Add the return link below under Redirect URIs.",
      stepClient: "Paste the Client ID and connect your Premium account.",
      redirectLabel: "Return link",
      copy: "Copy",
      copied: "Copied",
      copyAria: "Copy return link",
      clientPlaceholder: "Paste the Client ID here",
      connect: "Connect to Spotify",
      continueWithoutLinking: "Continue without linking",
      continueWithoutLinkingNote: "Scan a card and open the track directly in Spotify.",
      or: "or",
      openDashboard: "Open Spotify Developer Dashboard",
      downloadRules: "Download rules & score sheet",
      readyEyebrow: "{count} tracks ready",
      readyTitle: "Ready for launch?",
      readyLead: "Tap start once. You can then scan every card from this screen.",
      startGame: "Start the game",
      connecting: "Connecting player…",
      changeConnection: "Change Spotify connection",
      nextCardEyebrow: "Next card",
      scanTitle: "Scan the QR code",
      closeScannerAria: "Close scanner",
      scanHelp: "Hold the card steady inside the frame.",
      playingEyebrow: "Track playing",
      playingTitle: "Listen. Do you know when?",
      restartAria: "Restart track",
      pauseAria: "Pause",
      playAria: "Play",
      reveal: "Reveal the answer",
      stopAndScan: "Stop and scan another card",
      answerEyebrow: "The answer",
      scanNext: "Scan next card",
      replay: "Play the track again",
      invalidClient: "Check the Client ID and try again.",
      loginVerify: "The Spotify sign-in could not be verified. Start the connection again.",
      loginFailed: "Spotify could not complete the sign-in.",
      loginAgain: "Sign in to Spotify again.",
      sessionExpired: "The Spotify session has expired. Sign in again.",
      loginFirst: "Sign in to Spotify first.",
      sdkFailed: "The Spotify player could not be loaded.",
      premiumRequired: "Spotify Premium is required for full tracks.",
      reconnect: "The Spotify session has expired. Reconnect the account.",
      playbackFailed: "This track could not be played.",
      apiError: "Spotify error",
      playerNotReady: "The Spotify player is not ready yet. Try again.",
      unknownTrack: "Unknown track",
      unknownArtist: "Unknown artist",
      trackStartFailed: "The track did not start. Tap play or check your Premium account.",
      scannerLoadFailed: "The QR scanner could not be loaded. Check the internet connection.",
      invalidQr: "This is not a valid Spotify track code.",
      cameraPermission: "Allow camera access in the browser and try again.",
      playerStartFailed: "The Spotify player could not start.",
      incompleteTracks: "The track list is incomplete.",
      loginCancelled: "Spotify sign-in cancelled.",
      scannerPrepareFailed: "The scanner could not be prepared."
    }
  };

  let tracks = [];
  let tracksById = new Map();
  let tokens = null;
  let player = null;
  let deviceId = null;
  let scanner = null;
  let currentTrack = null;
  let isPlaying = true;
  let openInSpotifyMode = false;
  let language = localStorage.getItem(languageKey) || "nl";

  function t(key) {
    const value = translations[language]?.[key] || translations.nl[key] || key;
    return value.replace("{count}", tracks.length ? String(tracks.length) : "…");
  }

  function applyLanguage(nextLanguage) {
    language = translations[nextLanguage] ? nextLanguage : "nl";
    localStorage.setItem(languageKey, language);
    document.documentElement.lang = language;
    document.title = t("pageTitle");
    document.querySelector('meta[name="description"]').setAttribute("content", t("pageDescription"));
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      element.textContent = t(element.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      element.setAttribute("placeholder", t(element.dataset.i18nPlaceholder));
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
      element.setAttribute("aria-label", t(element.dataset.i18nAria));
    });
    document.querySelectorAll("[data-language]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.language === language));
    });
    $("togglePlayback").setAttribute("aria-label", isPlaying ? t("pauseAria") : t("playAria"));
  }

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
    localStorage.setItem(tokenKey, JSON.stringify(value));
    sessionStorage.removeItem(tokenKey);
  }

  function readTokens() {
    try {
      const stored = localStorage.getItem(tokenKey);
      if (stored) return JSON.parse(stored);

      // Migrate sessions created by the earlier version of the scanner.
      const previousSession = sessionStorage.getItem(tokenKey);
      if (!previousSession) return null;
      const migrated = JSON.parse(previousSession);
      localStorage.setItem(tokenKey, previousSession);
      sessionStorage.removeItem(tokenKey);
      return migrated;
    } catch {
      localStorage.removeItem(tokenKey);
      sessionStorage.removeItem(tokenKey);
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
      showError("setupError", t("invalidClient"));
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
      throw new Error(t("loginVerify"));
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
    if (!response.ok) throw new Error(t("loginFailed"));
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
    if (!tokens?.refresh_token) throw new Error(t("loginAgain"));
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: getClientId(),
        grant_type: "refresh_token",
        refresh_token: tokens.refresh_token
      })
    });
    if (!response.ok) throw new Error(t("sessionExpired"));
    const result = await response.json();
    saveTokens({
      access_token: result.access_token,
      refresh_token: result.refresh_token || tokens.refresh_token,
      expires_at: Date.now() + (result.expires_in - 60) * 1000
    });
    return tokens.access_token;
  }

  async function accessToken() {
    if (!tokens) throw new Error(t("loginFirst"));
    if (Date.now() >= tokens.expires_at) return refreshAccessToken();
    return tokens.access_token;
  }

  function waitForSpotifySdk() {
    return new Promise((resolve, reject) => {
      if (window.Spotify) return resolve();
      const timeout = setTimeout(() => reject(new Error(t("sdkFailed"))), 12000);
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
    player.addListener("account_error", () => showError("playError", t("premiumRequired")));
    player.addListener("authentication_error", () => showError("playError", t("reconnect")));
    player.addListener("playback_error", () => showError("playError", t("playbackFailed")));
    player.addListener("player_state_changed", (state) => {
      if (!state) return;
      isPlaying = !state.paused;
      $("togglePlayback").textContent = isPlaying ? "Ⅱ" : "▶";
      $("togglePlayback").setAttribute("aria-label", isPlaying ? t("pauseAria") : t("playAria"));
      $("record").classList.toggle("paused", !isPlaying);
    });
    await player.connect();
  }

  async function waitForDevice() {
    for (let attempt = 0; attempt < 30 && !deviceId; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    if (!deviceId) throw new Error(t("playerNotReady"));
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
    if (!response.ok && response.status !== 204) throw new Error(`${t("apiError")} ${response.status}`);
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

  function openTrackInSpotify(trackId) {
    openInSpotifyMode = false;
    showView("setupView");
    location.assign(`https://open.spotify.com/track/${encodeURIComponent(trackId)}`);
  }

  async function playTrack(trackId) {
    currentTrack = tracksById.get(trackId) || { spotify_id: trackId, title: t("unknownTrack"), artist: "Spotify", year: "—" };
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
      showError("playError", t("trackStartFailed"));
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
      showError("scanError", t("scannerLoadFailed"));
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
            showError("scanError", t("invalidQr"));
            return;
          }
          await stopScanner();
          if (openInSpotifyMode) openTrackInSpotify(trackId);
          else await playTrack(trackId);
        },
        () => {}
      );
    } catch {
      showError("scanError", t("cameraPermission"));
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
    $("answerTitle").textContent = currentTrack.title || t("unknownTrack");
    $("answerArtist").textContent = currentTrack.artist || t("unknownArtist");
    showView("answerView");
  }

  async function resetConnection() {
    await stopScanner();
    try { player?.disconnect(); } catch { /* no active player */ }
    player = null;
    deviceId = null;
    tokens = null;
    currentTrack = null;
    localStorage.removeItem(tokenKey);
    sessionStorage.removeItem(tokenKey);
    localStorage.removeItem(clientKey);
    $("clientId").value = "";
    showView("setupView");
  }

  async function init() {
    document.querySelectorAll("[data-language]").forEach((button) => {
      button.addEventListener("click", () => applyLanguage(button.dataset.language));
    });
    applyLanguage(language);
    $("redirectUri").value = redirectUri;
    $("clientId").value = getClientId();
    $("copyRedirect").addEventListener("click", async () => {
      await navigator.clipboard.writeText(redirectUri);
      $("copyRedirect").textContent = t("copied");
      setTimeout(() => { $("copyRedirect").textContent = t("copy"); }, 1600);
    });
    $("connectButton").addEventListener("click", connectSpotify);
    $("continueWithoutLinking").addEventListener("click", async () => {
      openInSpotifyMode = true;
      await startScanner();
    });
    $("startButton").addEventListener("click", async () => {
      $("startButton").disabled = true;
      $("startButton").textContent = t("connecting");
      try {
        await activatePlayer();
        await startScanner();
      } catch (error) {
        showView("readyView");
        alert(error.message || t("playerStartFailed"));
      } finally {
        $("startButton").disabled = false;
        $("startButton").textContent = t("startGame");
      }
    });
    $("resetButton").addEventListener("click", resetConnection);
    $("closeScanner").addEventListener("click", async () => {
      const returnView = openInSpotifyMode ? "setupView" : "readyView";
      openInSpotifyMode = false;
      showView(returnView);
      await stopScanner();
    });
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
      const ids = tracks.map((track) => track.spotify_id);
      const numbers = tracks.map((track) => track.nr);
      if (!tracks.length || new Set(ids).size !== tracks.length || numbers.some((number, index) => number !== index + 1)) {
        throw new Error(t("incompleteTracks"));
      }
      applyLanguage(language);

      const params = new URLSearchParams(location.search);
      if (params.get("error")) {
        history.replaceState({}, "", redirectUri);
        throw new Error(t("loginCancelled"));
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
      showError("setupError", error.message || t("scannerPrepareFailed"));
    }
  }

  init();
})();

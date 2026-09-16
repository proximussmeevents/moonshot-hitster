# Moonshot Hitster

Mobiele scanner voor de 95 muziekkaarten van SME Moonshot 2026. De site scant de QR-code van een Spotify-track, speelt het nummer af via Spotify Premium en onthult daarna titel, artiest en jaar.

## Gebruik

1. Open de GitHub Pages-link.
2. Maak of open een app in het [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
3. Voeg de terugkeerlink toe die de site toont bij **Redirect URIs**.
4. Plak de Spotify Client ID in de site en verbind een Spotify Premium-account.

De Client ID en Spotify-sessie worden alleen lokaal in de browser bewaard. Er staan geen Spotify-geheimen in deze repository.

## Publicatie

Elke push naar `main` publiceert de inhoud van `dist/` automatisch via GitHub Pages.

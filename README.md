# Moonshot Hitster

Mobiele scanner voor de 95 muziekkaarten van SME Moonshot 2026. De site scant de QR-code van een Spotify-track, speelt het nummer af via Spotify Premium en onthult daarna titel, artiest en jaar.

## Gebruik

1. Open de GitHub Pages-link.
2. Kies **Ga verder zonder koppeling** om een kaart te scannen en de track rechtstreeks in Spotify te openen.

Wil je tijdens het hele spel in de scanner blijven, koppel dan een Spotify Premium-account:

1. Maak of open een app in het [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Voeg de terugkeerlink toe die de site toont bij **Redirect URIs**.
3. Plak de Spotify Client ID in de site en verbind je account.

De Client ID en Spotify-sessie worden alleen lokaal in de browser bewaard. Er staan geen Spotify-geheimen in deze repository.

## Publicatie

Elke push naar `main` publiceert de inhoud van `dist/` automatisch via GitHub Pages.

# Moonshot Hitster

Mobiele scanner voor de actuele muziekkaarten van SME Moonshot 2026. De site scant de QR-code van een Spotify-track, speelt het nummer af via Spotify Premium en onthult daarna titel, artiest en jaar.

De huidige set is gebaseerd op de 53 nummers in de Spotify-playlist `4NMdgZIwG41bxhcUj5oiKN`. De printklare kaarten, brondata en synchronisatiescripts staan in `print/` en `tools/`.

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

## Playlist en kaartjes bijwerken

```bash
python3 tools/sync_playlist.py
python3 tools/build_cards.py
```

`sync_playlist.py` leest de openbare Spotify-playlist, bewaart directe tracklinks en corrigeert bekende heruitgavejaren voor Hitster. `build_cards.py` maakt een dubbelzijdige A4-PDF met 63 × 88 mm kaarten en gespiegeld gelegde achterkanten voor dubbelzijdig printen langs de lange zijde.

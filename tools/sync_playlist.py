#!/usr/bin/env python3
"""Synchronise the public Moonshot Spotify playlist with app and print data."""

import argparse
import csv
import json
import subprocess
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PLAYLIST_ID = "4NMdgZIwG41bxhcUj5oiKN"
TRACKS_JSON = ROOT / "dist" / "tracks.json"
PRINT_DATA = ROOT / "print" / "spotify_tracks_with_years.json"
LINKS_CSV = ROOT / "print" / "hitster_spotify_korte_links.csv"

# Spotify sometimes reports the release date of a reissue or compilation.
# Hitster needs the year in which this recording/song first appeared.
YEAR_OVERRIDES = {
    "0D2t9hxLR86LXCTjSngqyC": 1993,  # Pet Shop Boys - Go West
    "7o7E1nrHWncYY7PY94gCiX": 1979,  # The Buggles - Video Killed The Radio Star
    "1WCKy73PbWKCJyYYb3f0MD": 1995,  # Sinatra / Strait duet
    "4z3MsHyPX0VidXquBi9PWP": 1960,  # The Platters recording
    "7qQzkUWsbvoTDbNpW3FHQu": 1976,  # Tavares original single
    "35g4rTuhADuucoPzq01UIk": 1935,  # Fred Astaire original recording
    "4z8ssgZfs5TzKiO8HaGWXO": 2010,  # Katy Perry album recording
    "1u9AMKIYx6O0q9KHCnfBj1": 1986,  # Europe original single
    "47IaFTwoFbuMJd2sL1ZfMt": 1972,  # Claude Francois original single
}


class NextDataParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.capture = False
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag == "script" and dict(attrs).get("id") == "__NEXT_DATA__":
            self.capture = True

    def handle_endtag(self, tag):
        if tag == "script" and self.capture:
            self.capture = False

    def handle_data(self, data):
        if self.capture:
            self.parts.append(data)


def fetch_json(url):
    result = subprocess.run(
        ["curl", "-L", "--max-time", "30", "--retry", "2", "-sS", url],
        check=True,
        capture_output=True,
        text=True,
    )
    parser = NextDataParser()
    parser.feed(result.stdout)
    if not parser.parts:
        raise RuntimeError(f"Spotify __NEXT_DATA__ ontbreekt voor {url}")
    return json.loads("".join(parser.parts))


def entity(payload):
    return payload["props"]["pageProps"]["state"]["data"]["entity"]


def fetch_track(item):
    number, playlist_track = item
    spotify_id = playlist_track["uri"].rsplit(":", 1)[-1]
    track_entity = entity(fetch_json(f"https://open.spotify.com/embed/track/{spotify_id}"))
    iso_date = track_entity["releaseDate"]["isoString"][:10]
    return {
        "nr": number,
        "title": playlist_track["title"],
        "artist": playlist_track["subtitle"].replace("\u00a0", " "),
        "url": f"https://open.spotify.com/track/{spotify_id}",
        "spotify_id": spotify_id,
        "release_date": iso_date,
        "year": YEAR_OVERRIDES.get(spotify_id, int(iso_date[:4])),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--playlist-id", default=DEFAULT_PLAYLIST_ID)
    args = parser.parse_args()

    playlist = entity(fetch_json(f"https://open.spotify.com/embed/playlist/{args.playlist_id}"))
    source = playlist["trackList"]
    spotify_ids = [track["uri"].rsplit(":", 1)[-1] for track in source]
    if not source or len(spotify_ids) != len(set(spotify_ids)):
        raise RuntimeError("De playlist is leeg of bevat dubbele Spotify-track-ID's")

    with ThreadPoolExecutor(max_workers=8) as pool:
        tracks = list(pool.map(fetch_track, enumerate(source, 1)))
    tracks.sort(key=lambda item: item["nr"])

    if [track["nr"] for track in tracks] != list(range(1, len(tracks) + 1)):
        raise RuntimeError("Tracknummers zijn niet aaneensluitend")

    TRACKS_JSON.write_text(json.dumps(tracks, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    PRINT_DATA.parent.mkdir(parents=True, exist_ok=True)
    PRINT_DATA.write_text(json.dumps(tracks, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    with LINKS_CSV.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.writer(stream, delimiter=";")
        writer.writerow(["Nr", "Titel", "Artiest", "Korte Spotify-link"])
        for track in tracks:
            writer.writerow([track["nr"], track["title"], track["artist"], track["url"]])

    print(json.dumps({
        "playlist": playlist["name"],
        "playlist_id": args.playlist_id,
        "count": len(tracks),
        "overrides_used": {
            track["spotify_id"]: track["year"]
            for track in tracks if track["spotify_id"] in YEAR_OVERRIDES
        },
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()

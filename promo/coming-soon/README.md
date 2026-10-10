# RentaraH: "Coming Soon" promo video

A 45-second, 16:9 promotional video for Facebook, built as a code-driven animation. Every frame is drawn on a canvas from the timeline, so the in-browser preview, scrubbing and the MP4 export all produce exactly the same picture.

- **Output:** MP4 (H.264 High + AAC 48 kHz stereo), 3840×2160 or 1920×1080, 30 fps, 45 s
- **Style:** anime-inspired vehicles and environments with holographic UI. No people, faces or hands.
- **Energy:** inspired by everyday-app ads in the style of Grab: phone-first app demo, bold type on colour blocks, upbeat 112 BPM bed. Only RentaraH's own branding is used, with no other company's marks, colours or names.
- **Brand:** official RentaraH lockup (`src/assets/rentara.png`), recoloured for dark backgrounds at load time
- **Not shown anywhere:** rentarah.com or the GitHub Pages URL. The browser frames have no address bar.

## Quick start

```bash
node promo/coming-soon/tools/serve.mjs
```

Open http://127.0.0.1:4780/ in Chrome or Edge to get Play, Replay, a timeline scrubber with scene markers, a voice-over toggle and in-browser **Export MP4** (1080p or 4K). Press Space to play or pause.

To render headlessly (uses your installed Chrome; no npm packages needed):

```bash
node promo/coming-soon/tools/render-mp4.mjs 4k
node promo/coming-soon/tools/render-mp4.mjs 4k --no-vo
node promo/coming-soon/tools/render-mp4.mjs 1080p
```

The files are written to `promo/coming-soon/dist/`, which git ignores. A 4K export renders in about a minute.

## Storyboard as built

| Time | Scene | On-screen text | Voice-over (ElevenLabs) |
|---|---|---|---|
| 0–7 | **The Challenge.** Metro Manila-inspired skyline at golden hour above a jammed expressway: cars, SUVs and vans crawl with brake lights glowing while motorbikes and scooters weave through. A holographic search types "Car or motorcycle for this weekend", spins, and returns "No vehicles available". Sixteen listing cards (motorcycles, scooters, sedans, SUVs, vans) fly in stamped *Unavailable*, *No reply*, *Fully booked*, *Searching…* or *Price on request*, jitter, then collapse into a single cyan light. | "Your journey deserves better." | "Finding the perfect ride shouldn't be complicated." |
| 7–15 | **Introducing RentaraH.** Light-flash into a digital space. Light streaks reveal the logo, which then docks top-left. A phone rises with the **real mobile app**: a tap on *Search available vehicles* opens the results, which scroll to a car; a tap on the car opens its detail page and booking card. Callout chips pop beside the phone, and a sedan materialises and drives off into the next scene. | "MEET RentaraH", "Discover a new way to rent." Chips: "Search by city & dates", "Compare daily rates", "See the trip total first". | "Introducing RentaraH. A new way to discover your next ride." |
| 15–25 | **Explore.** Sedan through a BGC-inspired night city (15–17.2). SUV on a Tagaytay-inspired ridge above a lake and volcano island (17.2–19.4). Compact car parked outside a café with a holographic sign (19.4–21.4). Then the phone again (21.4–25): car specs, then a push to the **rental map**, with a tap on the vehicle-type filter. | "EXPLORE." "DISCOVER." "GO FURTHER." then "Search. Compare. Go." Chips: "Specs at a glance", "Cars & motorcycles", "Rentals on the map". | "For everyday drives, weekend escapes, and every adventure in between." |
| 25–36 | **Every Journey Has a Story.** Golden coastal highway with palms and sun glitter. SUV on a misty mountain road past rice terraces. Sedan driving toward a futuristic business district. | "More freedom." "More possibilities." "More journeys ahead." | "Because every destination holds a story. And every journey begins with a choice." |
| 36–45 | **Brand Reveal.** Black frame, cyan and gold light streaks, particles converge on the logo, shimmer, closing audio signature. | RentaraH · Your Journey. Your Choice. · COMING SOON · BY MOMENTRA LABS | "RentaraH. Your journey. Your choice. Coming soon. By Momentra Labs." |

## Art direction

One sunny day, in a 2D side-view style. Every scene has a clear blue sky, drifting clouds, slowly turning sun rays and soft haze on distant layers. Buildings are sunlit and outlined, with glass floors reflecting the sky. Trees and palms sway, and the café awning ripples in the breeze. The cars keep their outlined 2D look, with paint that reflects the sky and the horizon, a moving sun glint and contact shadows under the tyres. The hero sedan has the same paint in every shot, and the SUV is pearl white on both the ridge and the mountain road.

Car motion is driven by speed profiles. The cars accelerate and brake, the wheels turn at the real road speed and blur when fast, and the body squats under throttle, dives under braking and settles after stopping. Dust puffs trail the rear tyre. The café car pulls in and parks, and the finale sedan does the same beneath the logo.

## Motion

- **Camera on every shot:** each shot has its own slow push or pull, a horizontal track and a gentle float, with no shake.
- **Transitions:** the montage cuts are whip pans with real motion blur (16-sample smear). The other cuts are a light-flash, a warm light-leak and crossfades.
- **Phone demo:** the phone spins in, and the camera zooms in on each tap and back out again.
- **Type:** headlines pop in letter by letter on sliding colour blocks.
- **Depth:** motion-blurred posts whip past in front of the city and ridge drives.
- **End card:** the cards in scene 1 fly in from the lens. The logo lands with a zoom blur and expanding cyan and gold rings, then the tagline lines animate in letter by letter.

## What is real and what is stylised

- **Real interface:** `assets/screens-mobile/*.png` (phone, used in the video) and `assets/screens/*.png` (desktop) are screenshots of this repo's web app (`npm run dev`, mock mode), taken by `tools/capture-screens.mjs`. Nothing is drawn over them.
- **Demo data:** in mock mode, the listings, prices, host names and ratings shown in the app are seed data. Every interface shot is therefore labelled **"Interface preview · demo data"**.
- **Removed from captures:** the hero's marketing figures ("2,400+ vehicles listed", "98% happy renters", "₱0 hidden fees") and the whole "Why RentaraH" block (insured trips, verified hosts, secure payments, flexible). They can't be verified before launch, so the capture script hides them, along with the first-run welcome modal and the location prompt.
- **Stylised:** the cars are generic shapes, not real models, and the café sign is invented. There are no third-party logos, testimonials, reviews or invented features.
- **Map tiles:** the app uses Esri tiles with attribution switched off (`attributionControl={false}`). The promo adds "Map tiles © Esri" on the map shot.

## Audio

`src/audio.js` composes the soundtrack procedurally at render time with an `OfflineAudioContext`: an electronic bed (pads, arpeggios, four-on-the-floor drums during the montage), string-like swells and timpani in scene 4, whooshes and impacts on every cut, and a closing signature at 41.5 s. Music ducks automatically under each voice-over line. The master is normalised to −1 dBFS peak.

### Voice-over (ElevenLabs)

`tools/make-elevenlabs-vo.mjs` generates the five lines with ElevenLabs. It uses a confident male narration voice by default ("Brian") on `eleven_multilingual_v2`. It fits each take into its scene window, regenerating slightly faster if a take runs long, then writes `assets/vo/line1-5.mp3` and `manifest.json`. The next export picks those up automatically.

```bash
setx ELEVENLABS_API_KEY "your-key"
```

Run that in your own terminal, then open a new terminal. The key stays in your environment and never goes into the repo.

```bash
node promo/coming-soon/tools/make-elevenlabs-vo.mjs
```

To try a different voice, list your account's voices and pass the one you want:

```bash
node promo/coming-soon/tools/make-elevenlabs-vo.mjs --list
```

```bash
node promo/coming-soon/tools/make-elevenlabs-vo.mjs --voice <voice_id>
```

Then re-render:

```bash
node promo/coming-soon/tools/render-mp4.mjs 4k
```

Commercial use of ElevenLabs audio in an ad requires a paid ElevenLabs plan.

Until then, `assets/vo/` holds a **scratch** track from the Windows speech engine (`tools/make-scratch-vo.ps1`), for timing only. To use a human recording instead, save it as `line1…line5` (WAV or MP3) and adjust `start` in `manifest.json`.

## Updating the interface screenshots

```bash
npm run dev
```

```bash
node promo/coming-soon/tools/capture-screens.mjs
```

Run the second command from the repo root, in a second terminal. It also records where the tapped buttons are (`screens-mobile/hotspots.json`), so the tap animations follow the layout if it changes. Then reload the player or re-export. If a screenshot is missing, the video shows a clearly labelled placeholder instead of an invented screen.

## Files

```
index.html                 player, scrubber, export buttons
src/video.js               timeline, scenes, vehicles, environments, transitions
src/audio.js               procedural score + VO mixing/ducking
src/export.js              WebCodecs H.264/AAC → MP4 (mp4-muxer, MIT, vendored in src/vendor/)
assets/rentarah-logo.png   official lockup (copied from src/assets/rentara.png)
assets/screens-mobile/     real phone-size app captures + tap hotspots (used in the video)
assets/screens/            real desktop captures
assets/vo/                 scratch voice-over + manifest
tools/                     serve, capture-screens, render-mp4, verify-mp4, snap (stills),
                           make-elevenlabs-vo, make-scratch-vo
```

## Facebook upload notes

- Upload the 4K file. Facebook re-encodes, and 4K source gives the cleanest 1080p feed playback. The 1080p file is a lighter fallback.
- All text stays at least 6% in from the frame edges. Headlines are 54–150 px at 1080p, so they read on phones. The end-card byline is 28 px and the "demo data" labels are 17 px.
- The last frame fades to black at 44.4–45 s. Facebook's own thumbnail picker can grab the end card at about 42 s.

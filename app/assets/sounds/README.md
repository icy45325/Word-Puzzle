# Sound assets (drop-in)

The `SoundService` ships with all sound slots disabled (`null` in
`src/services/sound/SoundService.ts → ASSETS`). To enable sound playback,
drop royalty-free MP3 or WAV files here with the names below, then flip the
matching `null` to a `require('../../../assets/sounds/<file>')` in
`SoundService.ts`.

## Expected files

| Slot          | Suggested file       | When it plays                                      |
| ------------- | -------------------- | -------------------------------------------------- |
| `tick`        | `tick.mp3`           | Each letter activated during a swipe               |
| `correct`     | `correct.mp3`        | Target word found                                  |
| `wrong`       | `wrong.mp3`          | Submitted a non-word (length ≥ 2)                  |
| `bonus`       | `bonus.mp3`          | Submitted a dictionary word that wasn't the target |
| `celebrate`   | `celebrate.mp3`      | Level complete / weekly streak milestone           |
| `sparkle`     | `sparkle.mp3`        | Hint reveal                                        |
| `coin`        | `coin.mp3`           | Daily check-in claim / generic reward chime        |

Keep each file **under 200 KB** (short < 800 ms) so the bundle stays small
and Metro's asset pipeline doesn't slow down hot reload.

## Recommended free sources

- https://freesound.org (CC0 / CC-BY filter)
- https://opengameart.org/art-search-advanced?keys=&field_art_type_tid%5B%5D=13
- https://kenney.nl/assets?q=audio (CC0)

After dropping files in, set `ads.useTestIds` (unrelated, but the same
"don't ship until you tested" mindset applies — verify in Expo Go before
EAS-building).

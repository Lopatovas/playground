# Epic: Shell

Phone-first chrome. SettingsService only.

## In

- Settings: audio, brightness, resolution, vsync. No card types in this service.
- Big tap targets. Inspect ≠ play.
- AudioPlayer reads volumes from SettingsService.
- Persist settings via Infrastructure, not SaveService’s run file.

## Out

- Combat rules. Ledger prices.

## Done

Architecture test still forbids Settings → Cards. Changing volume does not touch `Encounter`.

# Holdfast

Godot 4.4 + C#. Domain is OOP (`Card.OnPlay`). JSON in `/content`.

## Play

Sideload `dist/holdfast.apk` (debug-signed, arm64). Allow unknown sources.

Or open `src/Holdfast.Godot` in Godot 4.4 .NET and press Play (portrait).

Walk as Warrior. Fight, map, shop, rest, door. Rope pays Runestones. Ledger buys HP.

## Tests

```bash
export DOTNET_ROOT=$HOME/.dotnet
dotnet test tests/Holdfast.Domain.Tests
dotnet test tests/Holdfast.Architecture.Tests
```

## Export

Godot 4.4.1 .NET, export templates `4.4.1.stable.mono`, Android SDK for APK.

```bash
godot --headless --path src/Holdfast.Godot --export-debug Android dist/holdfast.apk
```

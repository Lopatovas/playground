# Holdfast

Godot 4.4 + C#. Domain is OOP (`Card.OnPlay`). JSON in `/content`.

## Play

Sideload [`releases/holdfast-android.apk`](../../releases/holdfast-android.apk) (debug-signed, arm64). Allow unknown sources. GitHub: download that file from the branch or the PR.

Or open `src/Holdfast.Godot` in Godot 4.4 .NET and press Play (landscape, 1280×720).

The Hold is the hearth room. A fight is two actors on the cavern and a hand of card plates. Walk as Warrior. Map, shop, rest, door still finish a sortie. Rope pays Runestones. Ledger buys HP.

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

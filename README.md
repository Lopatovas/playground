# playground

Experimental ideas.

## Holdfast

Dwarf-hold card roguelike.

- MVP spec: [docs/holdfast/mvp-spec.md](docs/holdfast/mvp-spec.md)
- Playable game: [apps/holdfast/](apps/holdfast/) — Godot 4.4 C#, sideload APK
- Architecture: [architecture/](architecture/)
- Quality rails: [quality/](quality/)
- Epics: [stories/](stories/)
- Tune decks, dice, Ledger prices: [content/](content/)
- Engine pick (Godot 4, C#): [docs/holdfast/engine.md](docs/holdfast/engine.md)
- Locked art bible: [assets/holdfast/art-bible/](assets/holdfast/art-bible/)
- AI art path: [docs/holdfast/art.md](docs/holdfast/art.md)

```bash
dotnet test apps/holdfast/tests/Holdfast.Domain.Tests
dotnet test apps/holdfast/tests/Holdfast.Architecture.Tests
```

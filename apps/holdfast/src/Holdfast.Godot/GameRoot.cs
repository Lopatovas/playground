using Godot;
using Holdfast.Application.Combat;
using Holdfast.Application.Content;
using Holdfast.Application.HoldCamp;
using Holdfast.Application.Run;
using Holdfast.Application.Save;
using Holdfast.Application.Settings;
using Holdfast.Domain.Actors;
using Holdfast.Domain.Cards;
using Holdfast.Domain.Combat;
using Holdfast.Domain.Dice;
using Holdfast.Domain.Hold;
using Holdfast.Domain.Map;
using Holdfast.Infrastructure;

namespace Holdfast.GodotGame;

public partial class GameRoot : Control
{
    private static readonly Color Gold = new(0.91f, 0.84f, 0.64f);
    private static readonly Color Muted = new(0.77f, 0.71f, 0.54f);
    private static readonly Color Ink = new(0.05f, 0.04f, 0.03f);

    private ContentService _content = null!;
    private HoldService _hold = null!;
    private SaveService _save = null!;
    private SettingsService _settings = null!;
    private RunService _runs = null!;
    private readonly CombatService _combat = new();
    private readonly IRandom _rng = new SystemRandom();
    private string _banner = "";
    private VBoxContainer _stack = null!;
    private FontFile _font = null!;
    private FontFile _bold = null!;
    private bool _busy;

    public override void _Ready()
    {
        SetAnchorsAndOffsetsPreset(LayoutPreset.FullRect);
        MouseFilter = MouseFilterEnum.Stop;
        _font = GD.Load<FontFile>("res://fonts/LiberationSans-Regular.ttf")
            ?? throw new InvalidOperationException("Missing LiberationSans-Regular.ttf");
        _bold = GD.Load<FontFile>("res://fonts/LiberationSans-Bold.ttf") ?? _font;
        var theme = new Theme();
        theme.DefaultFont = _font;
        theme.DefaultFontSize = 18;
        Theme = theme;

        var bg = new ColorRect
        {
            Color = Ink,
            MouseFilter = MouseFilterEnum.Ignore
        };
        bg.SetAnchorsAndOffsetsPreset(LayoutPreset.FullRect);
        AddChild(bg);

        var user = OS.GetUserDataDir();
        _content = new ContentService(new GodotContentSource());
        var progress = new HoldProgress();
        _save = new SaveService(new FileSaveStore(Path.Combine(user, "hold.json")));
        _save.ReadHold(progress);
        _hold = new HoldService(progress, _content.Catalog.Ledger);
        _settings = new SettingsService(new FileSettingsStore(Path.Combine(user, "settings.json")));
        _runs = new RunService(_content.Catalog, progress, _rng);

        var scroll = new ScrollContainer
        {
            HorizontalScrollMode = ScrollContainer.ScrollMode.Disabled,
            SizeFlagsHorizontal = SizeFlags.ExpandFill,
            SizeFlagsVertical = SizeFlags.ExpandFill
        };
        scroll.SetAnchorsAndOffsetsPreset(LayoutPreset.FullRect);
        _stack = new VBoxContainer
        {
            SizeFlagsHorizontal = SizeFlags.ExpandFill,
            SizeFlagsVertical = SizeFlags.ShrinkBegin
        };
        _stack.AddThemeConstantOverride("separation", 12);
        var pad = new MarginContainer { SizeFlagsHorizontal = SizeFlags.ExpandFill };
        pad.AddThemeConstantOverride("margin_left", 18);
        pad.AddThemeConstantOverride("margin_right", 18);
        pad.AddThemeConstantOverride("margin_top", 20);
        pad.AddThemeConstantOverride("margin_bottom", 28);
        pad.AddChild(_stack);
        scroll.AddChild(pad);
        AddChild(scroll);
        ShowHold();
    }

    private void Rebuild(Action<VBoxContainer> fill)
    {
        foreach (var child in _stack.GetChildren())
        {
            child.QueueFree();
        }

        fill(_stack);
    }

    private void Tap(Action action)
    {
        if (_busy)
        {
            return;
        }

        _busy = true;
        try
        {
            action();
        }
        catch (Exception ex)
        {
            _banner = ex.Message;
            GD.PushWarning(ex.ToString());
        }
        finally
        {
            _busy = false;
        }
    }

    private void ShowHold()
    {
        Rebuild(box =>
        {
            box.AddChild(Portrait("res://art-bible/hold-hearth.jpg", 390, 160));
            box.AddChild(Title("HOLDFAST"));
            box.AddChild(Line($"Runestones {_hold.Progress.Runestones}   Brand {_hold.Progress.Brand[ClassId.Warrior]}"));
            box.AddChild(Btn("Walk as Warrior", () => Tap(() => Begin(ClassId.Warrior))));
            if (_hold.Progress.Unlocked.Contains(ClassId.Runesmith))
            {
                box.AddChild(Btn("Walk as Runesmith", () => Tap(() => Begin(ClassId.Runesmith))));
            }

            box.AddChild(Section("Ledger"));
            foreach (var node in _hold.Available())
            {
                var id = node.Id;
                box.AddChild(Btn($"{node.Name}  -  {node.Cost} stones", () => Tap(() =>
                {
                    _hold.Buy(id);
                    _save.WriteHold(_hold.Progress);
                    ShowHold();
                })));
            }

            box.AddChild(Btn("Peek", () => Tap(ShowPeek)));
        });
    }

    private void Begin(ClassId cls)
    {
        _banner = "";
        _runs.Start(cls);
        _runs.EnterCurrent();
        OpenNode();
    }

    private void OpenNode()
    {
        var node = _runs.Here();
        switch (node.Kind)
        {
            case NodeKind.Fight:
            case NodeKind.Elite:
            case NodeKind.Door:
                ShowFight();
                break;
            case NodeKind.Shop:
                ShowShop();
                break;
            case NodeKind.Rest:
                _runs.Rest();
                _banner = "You rest. The rope-crews keep the fire.";
                ShowMessage(() => Tap(ShowMap));
                break;
            case NodeKind.Event:
            case NodeKind.Treasure:
                _banner = node.Kind == NodeKind.Treasure ? "Old gold in the dark." : "Something in the stone.";
                ShowMessage(() => Tap(() =>
                {
                    _runs.FinishNode();
                    ShowMap();
                }));
                break;
        }
    }

    private void ShowMap()
    {
        var run = _runs.Current;
        if (run is null)
        {
            ShowHold();
            return;
        }

        var here = run.Map.Get(run.CurrentId);
        Rebuild(box =>
        {
            box.AddChild(Title("The dark"));
            box.AddChild(Line($"{run.Dwarf.Name}  {run.Dwarf.Hp} / {run.Dwarf.MaxHp}"));
            box.AddChild(Line($"{run.Gold} gold"));
            box.AddChild(Line($"Here: {here.Kind}"));
            if (!here.Cleared)
            {
                box.AddChild(Btn("Enter", () => Tap(OpenNode)));
                return;
            }

            foreach (var id in here.Next)
            {
                var n = run.Map.Get(id);
                var dest = id;
                box.AddChild(Btn($"{n.Kind}", () => Tap(() =>
                {
                    _runs.WalkTo(dest);
                    OpenNode();
                })));
            }

            if (here.Next.Count == 0)
            {
                box.AddChild(Line("No path left."));
            }
        });
    }

    private void ShowFight()
    {
        var run = _runs.Current;
        var fight = run?.Fight;
        if (run is null || fight is null)
        {
            ShowHold();
            return;
        }

        if (fight.Status == EncounterStatus.Won)
        {
            AfterFightWin();
            return;
        }

        if (fight.Status == EncounterStatus.Lost)
        {
            Rope();
            return;
        }

        Rebuild(box =>
        {
            box.AddChild(Title("Fight"));
            foreach (var enemy in fight.Enemies)
            {
                var e = enemy;
                box.AddChild(Line(e.IsDead
                    ? $"{e.Name} is down"
                    : $"{e.Name}   {e.Hp} / {e.MaxHp}"));
                if (!e.IsDead)
                {
                    box.AddChild(Line($"Intent: {e.Intent?.Label ?? "-"}"));
                }
            }

            var faces = new HBoxContainer
            {
                Alignment = BoxContainer.AlignmentMode.Center,
                SizeFlagsHorizontal = SizeFlags.ExpandFill
            };
            faces.AddThemeConstantOverride("separation", 16);
            faces.AddChild(Portrait(
                run.Class == ClassId.Warrior ? "res://art-bible/warrior.jpg" : "res://art-bible/runesmith.jpg",
                140, 140));
            faces.AddChild(Portrait("res://art-bible/enemy-knuckle.jpg", 140, 140));
            box.AddChild(faces);

            box.AddChild(Line($"{run.Dwarf.Name}   {run.Dwarf.Hp} / {run.Dwarf.MaxHp}"));
            box.AddChild(Line($"Block {run.Dwarf.Block}   Energy {run.Dwarf.Energy}   Grit {run.Dwarf.Grit}   Might {run.Dwarf.Might}"));
            if (!string.IsNullOrEmpty(_banner))
            {
                box.AddChild(Line(_banner));
            }

            for (var i = 0; i < fight.Dwarf.Deck.Hand.Count; i++)
            {
                var card = fight.Dwarf.Deck.Hand[i];
                var idx = i;
                var dice = DiceText(card);
                var label = string.IsNullOrEmpty(dice)
                    ? $"{card.Name}   {card.Cost} energy   {card.Text}"
                    : $"{card.Name}   {card.Cost} energy   {card.Text.Replace("{dice}", dice)}";
                var can = card.Cost <= fight.Dwarf.Energy;
                box.AddChild(Btn(label, () => Tap(() => PlayCard(idx)), can));
            }

            box.AddChild(Btn("End turn", () => Tap(EndTurn)));
        });
    }

    private static string DiceText(Card card) =>
        card switch
        {
            AttackCard a => a.Damage.Printed,
            SkillCard { Block: not null } s => s.Block.Printed,
            _ => ""
        };

    private void PlayCard(int handIndex)
    {
        var fight = _runs.Current?.Fight;
        if (fight is null || fight.Status != EncounterStatus.Fighting)
        {
            ShowFight();
            return;
        }

        if (handIndex < 0 || handIndex >= fight.Dwarf.Deck.Hand.Count)
        {
            return;
        }

        var card = fight.Dwarf.Deck.Hand[handIndex];
        if (card.Cost > fight.Dwarf.Energy)
        {
            return;
        }

        var result = _combat.Play(fight, handIndex, 0, _rng);
        _banner = string.Join("  ", result.Events.Select(e => e.Text));
        ShowFight();
    }

    private void EndTurn()
    {
        var fight = _runs.Current?.Fight;
        if (fight is null || fight.Status != EncounterStatus.Fighting)
        {
            ShowFight();
            return;
        }

        var ev = _combat.EndTurn(fight, _rng);
        _banner = string.Join("  ", ev.Select(e => e.Text));
        ShowFight();
    }

    private void AfterFightWin()
    {
        var node = _runs.Here();
        if (node.Kind == NodeKind.Door)
        {
            _runs.FinishNode();
            ShowWin();
            return;
        }

        _runs.OfferRewards();
        ShowReward();
    }

    private void ShowReward()
    {
        var run = _runs.Current!;
        Rebuild(box =>
        {
            box.AddChild(Title("Take a card"));
            for (var i = 0; i < run.RewardChoices.Count; i++)
            {
                var idx = i;
                var c = run.RewardChoices[i];
                box.AddChild(Btn($"{c.Name}   {c.Text}", () => Tap(() =>
                {
                    _runs.PickReward(idx);
                    _runs.FinishNode();
                    ShowMap();
                })));
            }

            box.AddChild(Btn("Skip", () => Tap(() =>
            {
                run.RewardChoices.Clear();
                _runs.FinishNode();
                ShowMap();
            })));
        });
    }

    private void ShowShop()
    {
        var run = _runs.Current!;
        Rebuild(box =>
        {
            box.AddChild(Title("Shop"));
            box.AddChild(Line($"{run.Gold} gold"));
            for (var i = 0; i < run.ShopStock.Count; i++)
            {
                var idx = i;
                var c = run.ShopStock[i];
                box.AddChild(Btn($"{c.Name}   50 gold", () => Tap(() =>
                {
                    _runs.BuyShop(idx);
                    ShowShop();
                }), run.Gold >= 50));
            }

            box.AddChild(Btn("Leave", () => Tap(() =>
            {
                _runs.FinishNode();
                ShowMap();
            })));
        });
    }

    private void ShowMessage(Action next)
    {
        Rebuild(box =>
        {
            box.AddChild(Title("The Hold remembers"));
            box.AddChild(Line(_banner));
            box.AddChild(Btn("Onward", next));
        });
    }

    private void Rope()
    {
        var stones = _runs.PayoutRunestones();
        _hold.GrantRunestones(stones);
        _save.WriteHold(_hold.Progress);
        _runs.Die();
        Rebuild(box =>
        {
            box.AddChild(Portrait("res://art-bible/hold-hearth.jpg", 390, 150));
            box.AddChild(Title("The rope"));
            box.AddChild(Line($"They haul you home. +{stones} Runestones."));
            box.AddChild(Btn("Hold", () => Tap(ShowHold)));
        });
    }

    private void ShowWin()
    {
        var stones = _runs.PayoutRunestones();
        _hold.GrantRunestones(stones);
        _save.WriteHold(_hold.Progress);
        Rebuild(box =>
        {
            box.AddChild(Title("The door"));
            box.AddChild(Line($"You cut a way out. +{stones} Runestones."));
            box.AddChild(Btn("Hold", () => Tap(ShowHold)));
        });
    }

    private void ShowPeek()
    {
        Rebuild(box =>
        {
            box.AddChild(Title("Peek"));
            box.AddChild(Line("Style bible and a canned Hew."));
            var row = new HBoxContainer { Alignment = BoxContainer.AlignmentMode.Center, SizeFlagsHorizontal = SizeFlags.ExpandFill };
            row.AddThemeConstantOverride("separation", 10);
            row.AddChild(Portrait("res://art-bible/warrior.jpg", 110, 110));
            row.AddChild(Portrait("res://art-bible/runesmith.jpg", 110, 110));
            row.AddChild(Portrait("res://art-bible/enemy-knuckle.jpg", 110, 110));
            box.AddChild(row);
            var hew = _content.Catalog.StarterCards(ClassId.Warrior).First(c => c is AttackCard);
            var dwarf = new Dwarf(ClassId.Warrior, 40, 3, [hew]);
            var enemy = _content.Catalog.Enemies[0].Spawn();
            var enc = _combat.Start(dwarf, [enemy], _content.Catalog.Tuning, new FixedRandom(6, 1, 1, 1, 1, 1, 6));
            if (enc.Dwarf.Deck.Hand.Count > 0)
            {
                var r = _combat.Play(enc, 0, 0, new FixedRandom(6));
                box.AddChild(Line(string.Join("  ", r.Events.Select(e => e.Text))));
            }

            box.AddChild(Btn("Back", () => Tap(ShowHold)));
        });
    }

    private Label Title(string text)
    {
        var l = new Label
        {
            Text = text,
            HorizontalAlignment = HorizontalAlignment.Center,
            AutowrapMode = TextServer.AutowrapMode.Off,
            SizeFlagsHorizontal = SizeFlags.ExpandFill
        };
        l.AddThemeFontOverride("font", _bold);
        l.AddThemeFontSizeOverride("font_size", 30);
        l.AddThemeColorOverride("font_color", Gold);
        return l;
    }

    private Label Line(string text)
    {
        var l = new Label
        {
            Text = text,
            AutowrapMode = TextServer.AutowrapMode.Word,
            SizeFlagsHorizontal = SizeFlags.ExpandFill
        };
        l.AddThemeFontOverride("font", _font);
        l.AddThemeFontSizeOverride("font_size", 17);
        l.AddThemeColorOverride("font_color", Muted);
        return l;
    }

    private Label Section(string text)
    {
        var l = new Label
        {
            Text = text,
            SizeFlagsHorizontal = SizeFlags.ExpandFill
        };
        l.AddThemeFontOverride("font", _bold);
        l.AddThemeFontSizeOverride("font_size", 20);
        l.AddThemeColorOverride("font_color", Gold);
        return l;
    }

    private Button Btn(string text, Action onPressed, bool enabled = true)
    {
        var b = new Button
        {
            Text = text,
            Disabled = !enabled,
            AutowrapMode = TextServer.AutowrapMode.Word,
            ClipText = false,
            CustomMinimumSize = new Vector2(0, 56),
            SizeFlagsHorizontal = SizeFlags.ExpandFill
        };
        b.AddThemeFontOverride("font", _font);
        b.AddThemeFontSizeOverride("font_size", 17);
        b.Pressed += onPressed;
        return b;
    }

    private static TextureRect Portrait(string path, int width, int height)
    {
        var tex = GD.Load<Texture2D>(path);
        return new TextureRect
        {
            Texture = tex,
            ExpandMode = TextureRect.ExpandModeEnum.IgnoreSize,
            StretchMode = TextureRect.StretchModeEnum.KeepAspectCovered,
            CustomMinimumSize = new Vector2(width, height),
            SizeFlagsHorizontal = SizeFlags.ShrinkCenter,
            SizeFlagsVertical = SizeFlags.ShrinkCenter
        };
    }
}

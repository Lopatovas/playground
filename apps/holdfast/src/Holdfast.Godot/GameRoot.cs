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
    private enum Screen
    {
        Hold,
        Map,
        Fight,
        Reward,
        Shop,
        Rest,
        Message,
        Rope,
        Win,
        Peek
    }

    private static readonly Color Gold = new(0.91f, 0.84f, 0.64f);
    private static readonly Color Muted = new(0.77f, 0.71f, 0.54f);
    private static readonly Color Panel = new(0.10f, 0.08f, 0.06f, 0.92f);

    private ContentService _content = null!;
    private HoldService _hold = null!;
    private SaveService _save = null!;
    private SettingsService _settings = null!;
    private RunService _runs = null!;
    private readonly CombatService _combat = new();
    private readonly IRandom _rng = new SystemRandom();
    private Screen _screen = Screen.Hold;
    private string _banner = "";
    private VBoxContainer _root = null!;
    private int _pendingTarget;

    public override void _Ready()
    {
        SetAnchorsAndOffsetsPreset(LayoutPreset.FullRect);
        var user = OS.GetUserDataDir();
        _content = new ContentService(new GodotContentSource());
        var progress = new HoldProgress();
        _save = new SaveService(new FileSaveStore(Path.Combine(user, "hold.json")));
        _save.ReadHold(progress);
        _hold = new HoldService(progress, _content.Catalog.Ledger);
        _settings = new SettingsService(new FileSettingsStore(Path.Combine(user, "settings.json")));
        _runs = new RunService(_content.Catalog, progress, _rng);
        Modulate = new Color(_settings.Current.Brightness, _settings.Current.Brightness, _settings.Current.Brightness);
        _root = new VBoxContainer { SizeFlagsHorizontal = SizeFlags.ExpandFill, SizeFlagsVertical = SizeFlags.ExpandFill };
        AddChild(_root);
        ShowHold();
    }

    private void Rebuild(Action<VBoxContainer> fill)
    {
        foreach (var child in _root.GetChildren())
        {
            _root.RemoveChild(child);
            child.Free();
        }

        var pad = new MarginContainer { SizeFlagsVertical = SizeFlags.ExpandFill };
        pad.AddThemeConstantOverride("margin_left", 16);
        pad.AddThemeConstantOverride("margin_right", 16);
        pad.AddThemeConstantOverride("margin_top", 12);
        pad.AddThemeConstantOverride("margin_bottom", 16);
        var box = new VBoxContainer { SizeFlagsVertical = SizeFlags.ExpandFill };
        box.AddThemeConstantOverride("separation", 10);
        pad.AddChild(box);
        _root.AddChild(pad);
        fill(box);
    }

    private void ShowHold()
    {
        _screen = Screen.Hold;
        Rebuild(box =>
        {
            box.AddChild(Portrait("res://art-bible/hold-hearth.jpg", 180));
            box.AddChild(Title("HOLDFAST"));
            box.AddChild(Hint($"Runestones {_hold.Progress.Runestones}  ·  Brand {_hold.Progress.Brand[ClassId.Warrior]}"));
            box.AddChild(Btn("Walk as Warrior", () => Begin(ClassId.Warrior)));
            if (_hold.Progress.Unlocked.Contains(ClassId.Runesmith))
            {
                box.AddChild(Btn("Walk as Runesmith", () => Begin(ClassId.Runesmith)));
            }

            box.AddChild(Section("Ledger"));
            foreach (var node in _hold.Available())
            {
                var id = node.Id;
                box.AddChild(Btn($"{node.Name}  ·  {node.Cost}", () =>
                {
                    _hold.Buy(id);
                    _save.WriteHold(_hold.Progress);
                    ShowHold();
                }));
            }

            box.AddChild(Btn("Peek", ShowPeek));
            box.AddChild(Btn($"Brightness {_settings.Current.Brightness:0.0}", () =>
            {
                var next = _settings.Current.Brightness >= 1.2f ? 0.8f : _settings.Current.Brightness + 0.1f;
                _settings.SetBrightness(next);
                Modulate = new Color(next, next, next);
                ShowHold();
            }));
        });
    }

    private void Begin(ClassId cls)
    {
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
                ShowMessage(ShowMap);
                break;
            case NodeKind.Event:
            case NodeKind.Treasure:
                _banner = node.Kind == NodeKind.Treasure ? "Old gold in the dark." : "Something in the stone.";
                ShowMessage(() => { _runs.FinishNode(); ShowMap(); });
                break;
        }
    }

    private void ShowMap()
    {
        _screen = Screen.Map;
        var run = _runs.Current!;
        var here = run.Map.Get(run.CurrentId);
        Rebuild(box =>
        {
            box.AddChild(Title("The dark"));
            box.AddChild(Hint($"{run.Dwarf.Name}  {run.Dwarf.Hp}/{run.Dwarf.MaxHp}  ·  {run.Gold} gold"));
            box.AddChild(Hint($"Here: {here.Kind}"));
            if (!here.Cleared)
            {
                box.AddChild(Btn("Enter", OpenNode));
                return;
            }

            foreach (var id in here.Next)
            {
                var n = run.Map.Get(id);
                var dest = id;
                box.AddChild(Btn($"{n.Kind}  ({n.Id})", () =>
                {
                    _runs.WalkTo(dest);
                    OpenNode();
                }));
            }

            if (here.Next.Count == 0)
            {
                box.AddChild(Hint("No path. The door or the rope."));
            }
        });
    }

    private void ShowFight()
    {
        _screen = Screen.Fight;
        var run = _runs.Current!;
        var fight = run.Fight!;
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
            var row = new HBoxContainer();
            row.AddThemeConstantOverride("separation", 8);
            row.AddChild(Portrait(run.Class == ClassId.Warrior ? "res://art-bible/warrior.jpg" : "res://art-bible/runesmith.jpg", 120));
            foreach (var enemy in fight.Enemies)
            {
                var e = enemy;
                var wrap = new VBoxContainer();
                wrap.AddChild(Portrait("res://art-bible/enemy-knuckle.jpg", 120));
                wrap.AddChild(Hint(e.IsDead ? $"{e.Name} down" : $"{e.Name} {e.Hp}/{e.MaxHp}"));
                wrap.AddChild(Hint(e.Intent?.Label ?? ""));
                row.AddChild(wrap);
            }

            box.AddChild(row);
            box.AddChild(Hint($"{run.Dwarf.Name} {run.Dwarf.Hp}/{run.Dwarf.MaxHp}   Block {run.Dwarf.Block}   Energy {run.Dwarf.Energy}   Grit {run.Dwarf.Grit}   Might {run.Dwarf.Might}"));
            if (!string.IsNullOrEmpty(_banner))
            {
                box.AddChild(Hint(_banner));
            }

            var living = fight.Living;
            for (var i = 0; i < fight.Dwarf.Deck.Hand.Count; i++)
            {
                var card = fight.Dwarf.Deck.Hand[i];
                var idx = i;
                var can = card.Cost <= fight.Dwarf.Energy;
                box.AddChild(Btn($"{card.Name}  {card.Cost}  ·  {card.Text.Replace("{dice}", card is AttackCard a ? a.Damage.Printed : card is SkillCard s && s.Block is not null ? s.Block.Printed : "")}", () => Play(idx), can));
            }

            box.AddChild(Btn("End turn", () =>
            {
                var ev = _combat.EndTurn(fight, _rng);
                _banner = string.Join(" ", ev.Select(e => e.Text));
                ShowFight();
            }));
        });
    }

    private void Play(int handIndex)
    {
        var fight = _runs.Current!.Fight!;
        var result = _combat.Play(fight, handIndex, _pendingTarget, _rng);
        _banner = string.Join(" ", result.Events.Select(e => e.Text));
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
        _screen = Screen.Reward;
        var run = _runs.Current!;
        Rebuild(box =>
        {
            box.AddChild(Title("Take a card"));
            for (var i = 0; i < run.RewardChoices.Count; i++)
            {
                var idx = i;
                var c = run.RewardChoices[i];
                box.AddChild(Btn($"{c.Name}  ·  {c.Text}", () =>
                {
                    _runs.PickReward(idx);
                    _runs.FinishNode();
                    ShowMap();
                }));
            }

            box.AddChild(Btn("Skip", () =>
            {
                run.RewardChoices.Clear();
                _runs.FinishNode();
                ShowMap();
            }));
        });
    }

    private void ShowShop()
    {
        _screen = Screen.Shop;
        var run = _runs.Current!;
        Rebuild(box =>
        {
            box.AddChild(Title("Shop"));
            box.AddChild(Hint($"{run.Gold} gold"));
            for (var i = 0; i < run.ShopStock.Count; i++)
            {
                var idx = i;
                var c = run.ShopStock[i];
                box.AddChild(Btn($"{c.Name}  ·  50g", () =>
                {
                    _runs.BuyShop(idx);
                    ShowShop();
                }, run.Gold >= 50));
            }

            box.AddChild(Btn("Leave", () =>
            {
                _runs.FinishNode();
                ShowMap();
            }));
        });
    }

    private void ShowMessage(Action next)
    {
        _screen = Screen.Message;
        Rebuild(box =>
        {
            box.AddChild(Title("The Hold remembers"));
            box.AddChild(Hint(_banner));
            box.AddChild(Btn("Onward", next));
        });
    }

    private void Rope()
    {
        _screen = Screen.Rope;
        var stones = _runs.PayoutRunestones();
        _hold.GrantRunestones(stones);
        _save.WriteHold(_hold.Progress);
        _runs.Die();
        Rebuild(box =>
        {
            box.AddChild(Portrait("res://art-bible/hold-hearth.jpg", 160));
            box.AddChild(Title("The rope"));
            box.AddChild(Hint($"They haul you home. +{stones} Runestones."));
            box.AddChild(Btn("Hold", ShowHold));
        });
    }

    private void ShowWin()
    {
        _screen = Screen.Win;
        var stones = _runs.PayoutRunestones();
        _hold.GrantRunestones(stones);
        _save.WriteHold(_hold.Progress);
        Rebuild(box =>
        {
            box.AddChild(Title("The door"));
            box.AddChild(Hint($"You cut a way out. +{stones} Runestones."));
            box.AddChild(Btn("Hold", ShowHold));
        });
    }

    private void ShowPeek()
    {
        _screen = Screen.Peek;
        Rebuild(box =>
        {
            box.AddChild(Title("Peek"));
            box.AddChild(Hint("Style bible + a canned Hew."));
            var row = new HBoxContainer();
            row.AddChild(Portrait("res://art-bible/warrior.jpg", 110));
            row.AddChild(Portrait("res://art-bible/runesmith.jpg", 110));
            row.AddChild(Portrait("res://art-bible/enemy-knuckle.jpg", 110));
            box.AddChild(row);
            var hew = _content.Catalog.StarterCards(ClassId.Warrior).First(c => c is AttackCard);
            var dwarf = new Dwarf(ClassId.Warrior, 40, 3, [hew]);
            var enemy = _content.Catalog.Enemies[0].Spawn();
            var enc = _combat.Start(dwarf, [enemy], _content.Catalog.Tuning, new FixedRandom(6, 1, 1, 1, 1, 1, 6));
            var r = _combat.Play(enc, 0, 0, new FixedRandom(6));
            box.AddChild(Hint(string.Join(" ", r.Events.Select(e => e.Text))));
            box.AddChild(Btn("Back", ShowHold));
        });
    }

    private static Label Title(string text)
    {
        var l = new Label { Text = text, HorizontalAlignment = HorizontalAlignment.Center };
        l.AddThemeColorOverride("font_color", Gold);
        l.AddThemeFontSizeOverride("font_size", 28);
        return l;
    }

    private static Label Hint(string text)
    {
        var l = new Label { Text = text, AutowrapMode = TextServer.AutowrapMode.WordSmart };
        l.AddThemeColorOverride("font_color", Muted);
        l.AddThemeFontSizeOverride("font_size", 15);
        return l;
    }

    private static Label Section(string text)
    {
        var l = new Label { Text = text };
        l.AddThemeColorOverride("font_color", Gold);
        l.AddThemeFontSizeOverride("font_size", 18);
        return l;
    }

    private static Button Btn(string text, Action onPressed, bool enabled = true)
    {
        var b = new Button
        {
            Text = text,
            Disabled = !enabled,
            CustomMinimumSize = new Vector2(0, 52)
        };
        b.Pressed += onPressed;
        return b;
    }

    private static TextureRect Portrait(string path, int height)
    {
        var tex = GD.Load<Texture2D>(path);
        return new TextureRect
        {
            Texture = tex,
            ExpandMode = TextureRect.ExpandModeEnum.IgnoreSize,
            StretchMode = TextureRect.StretchModeEnum.KeepAspectCovered,
            CustomMinimumSize = new Vector2(0, height),
            SizeFlagsHorizontal = SizeFlags.ExpandFill
        };
    }
}

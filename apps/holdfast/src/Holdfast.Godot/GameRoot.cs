using Godot;
using Holdfast.Application.Combat;
using Holdfast.Application.Content;
using Holdfast.Application.HoldCamp;
using Holdfast.Application.Run;
using Holdfast.Application.Save;
using Holdfast.Application.Settings;
using Holdfast.Domain.Actors;
using Holdfast.Domain.Combat;
using Holdfast.Domain.Dice;
using Holdfast.Domain.Hold;
using Holdfast.Domain.Map;
using Holdfast.Infrastructure;

namespace Holdfast.GodotGame;

public partial class GameRoot : Control
{
    private ContentService _content = null!;
    private HoldService _hold = null!;
    private SaveService _save = null!;
    private SettingsService _settings = null!;
    private RunService _runs = null!;
    private readonly CombatService _combat = new();
    private readonly IRandom _rng = new SystemRandom();
    private string _banner = "";
    private bool _busy;
    private Action? _pendingTap;

    private HoldView _holdView = null!;
    private FightView _fightView = null!;
    private SheetView _sheet = null!;

    public override void _Ready()
    {
        SetAnchorsAndOffsetsPreset(LayoutPreset.FullRect);
        MouseFilter = MouseFilterEnum.Stop;
        ClipContents = false;
        UiChrome.Ensure();
        Theme = UiChrome.GameTheme();

        var user = OS.GetUserDataDir();
        _content = new ContentService(new GodotContentSource());
        var progress = new HoldProgress();
        _save = new SaveService(new FileSaveStore(Path.Combine(user, "hold.json")));
        _save.ReadHold(progress);
        _hold = new HoldService(progress, _content.Catalog.Ledger);
        _settings = new SettingsService(new FileSettingsStore(Path.Combine(user, "settings.json")));
        _runs = new RunService(_content.Catalog, progress, _rng);

        _holdView = GD.Load<PackedScene>("res://scenes/hold/HoldView.tscn").Instantiate<HoldView>();
        _fightView = GD.Load<PackedScene>("res://scenes/fight/FightView.tscn").Instantiate<FightView>();
        _sheet = GD.Load<PackedScene>("res://scenes/hold/SheetView.tscn").Instantiate<SheetView>();
        foreach (var view in new Control[] { _holdView, _fightView, _sheet })
        {
            view.SetAnchorsAndOffsetsPreset(LayoutPreset.FullRect);
            AddChild(view);
            view.Hide();
        }

        _holdView.Walk += cls => Tap(() => Begin(cls));
        _holdView.Buy += id => Tap(() =>
        {
            _hold.Buy(id);
            _save.WriteHold(_hold.Progress);
            ShowHold();
        });
        _holdView.Peek += () => { };
        _fightView.PlayCard += idx => Tap(() => PlayCard(idx));
        _fightView.EndTurn += () => Tap(EndTurn);

        ShowHold();
    }

    private void Tap(Action action)
    {
        if (_busy)
        {
            return;
        }

        _busy = true;
        _pendingTap = action;
        CallDeferred(MethodName.FlushTap);
    }

    private void FlushTap()
    {
        var action = _pendingTap;
        _pendingTap = null;
        try
        {
            action?.Invoke();
        }
        catch (Exception ex)
        {
            _banner = "The hold holds. Try that again.";
            GD.PushWarning(ex.ToString());
            ShowHold();
        }
        finally
        {
            _busy = false;
        }
    }

    private void ShowOnly(Control view)
    {
        _holdView.Visible = view == _holdView;
        _fightView.Visible = view == _fightView;
        _sheet.Visible = view == _sheet;
    }

    private void ShowHold()
    {
        ShowOnly(_holdView);
        _holdView.Bind(_hold);
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
                ShowMessage("The Hold remembers", _banner, () => Tap(ShowMap));
                break;
            case NodeKind.Event:
            case NodeKind.Treasure:
                _banner = node.Kind == NodeKind.Treasure ? "Old gold in the dark." : "Something in the stone.";
                ShowMessage("The Hold remembers", _banner, () => Tap(() =>
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
        var actions = new List<(string, Action)>();
        if (!here.Cleared)
        {
            actions.Add(("Enter", () => Tap(OpenNode)));
        }
        else
        {
            foreach (var id in here.Next)
            {
                var dest = id;
                var kind = run.Map.Get(id).Kind.ToString();
                actions.Add((kind, () => Tap(() =>
                {
                    _runs.WalkTo(dest);
                    OpenNode();
                })));
            }
        }

        if (actions.Count == 0)
        {
            actions.Add(("Hold", () => Tap(ShowHold)));
        }

        ShowOnly(_sheet);
        _sheet.ShowSheet(
            "The dark",
            $"{run.Dwarf.Name}  {run.Dwarf.Hp} / {run.Dwarf.MaxHp}\n{run.Gold} gold\nHere: {here.Kind}",
            "res://art/fight-cavern.jpg",
            actions);
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

        ShowOnly(_fightView);
        _fightView.Bind(run, fight, _banner);
    }

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
        _fightView.AfterPlay(card);
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
        if (fight.Status == EncounterStatus.Fighting)
        {
            _fightView.AfterEnemy();
        }
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
        var actions = run.RewardChoices
            .Select((c, i) => (c.Name, (Action)(() => Tap(() =>
            {
                _runs.PickReward(i);
                _runs.FinishNode();
                ShowMap();
            }))))
            .ToList();
        actions.Add(("Skip", () => Tap(() =>
        {
            run.RewardChoices.Clear();
            _runs.FinishNode();
            ShowMap();
        })));
        ShowOnly(_sheet);
        _sheet.ShowSheet("Take a card", "The dark leaves something in your hand.", "res://art-bible/hold-hearth.jpg", actions);
    }

    private void ShowShop()
    {
        var run = _runs.Current!;
        var actions = run.ShopStock
            .Select((c, i) => ($"{c.Name}  ·  50 gold", (Action)(() => Tap(() =>
            {
                _runs.BuyShop(i);
                ShowShop();
            }))))
            .ToList();
        actions.Add(("Leave", () => Tap(() =>
        {
            _runs.FinishNode();
            ShowMap();
        })));
        ShowOnly(_sheet);
        _sheet.ShowSheet("Shop", $"{run.Gold} gold", "res://art-bible/hold-hearth.jpg", actions);
    }

    private void ShowMessage(string title, string body, Action next)
    {
        ShowOnly(_sheet);
        _sheet.ShowSheet(title, body, "res://art-bible/hold-hearth.jpg", [("Onward", next)]);
    }

    private void Rope()
    {
        var stones = _runs.PayoutRunestones();
        _hold.GrantRunestones(stones);
        _save.WriteHold(_hold.Progress);
        _runs.Die();
        ShowOnly(_sheet);
        _sheet.ShowSheet(
            "The rope",
            $"They haul you home. +{stones} Runestones.",
            "res://art-bible/hold-hearth.jpg",
            [("Hold", () => Tap(ShowHold))]);
    }

    private void ShowWin()
    {
        var stones = _runs.PayoutRunestones();
        _hold.GrantRunestones(stones);
        _save.WriteHold(_hold.Progress);
        ShowOnly(_sheet);
        _sheet.ShowSheet(
            "The door",
            $"You cut a way out. +{stones} Runestones.",
            "res://art-bible/hold-hearth.jpg",
            [("Hold", () => Tap(ShowHold))]);
    }

    private void ShowPeek()
    {
        ShowOnly(_sheet);
        _sheet.ShowSheet(
            "Peek",
            "Hearth, Warrior, and the first knuckle. The fight is the cavern.",
            "res://art-bible/hold-hearth.jpg",
            [("Hold", () => Tap(ShowHold))]);
    }
}

using Godot;
using Holdfast.Application.Run;
using Holdfast.Domain.Actors;
using Holdfast.Domain.Combat;

namespace Holdfast.GodotGame;

public partial class FightView : Control
{
    public event Action<int>? PlayCard;
    public event Action? EndTurn;

    private ActorPlate _dwarf = null!;
    private ActorPlate _enemy = null!;
    private Label _banner = null!;
    private Label _vitals = null!;
    private HBoxContainer _hand = null!;
    private PackedScene _cardScene = null!;
    private PackedScene _plateScene = null!;

    public override void _Ready()
    {
        SetAnchorsAndOffsetsPreset(LayoutPreset.FullRect);
        MouseFilter = MouseFilterEnum.Stop;
        _cardScene = GD.Load<PackedScene>("res://scenes/fight/CardPlate.tscn");
        _plateScene = GD.Load<PackedScene>("res://ui/PlateTap.tscn");

        var bg = new TextureRect
        {
            Texture = UiChrome.StageTexture("res://art/fight-cavern.jpg", 0.38f, 0.60f),
            ExpandMode = TextureRect.ExpandModeEnum.IgnoreSize,
            StretchMode = TextureRect.StretchModeEnum.KeepAspectCovered,
            MouseFilter = MouseFilterEnum.Ignore
        };
        bg.SetAnchorsAndOffsetsPreset(LayoutPreset.FullRect);
        AddChild(bg);

        _dwarf = new ActorPlate();
        _dwarf.SetAnchorsPreset(LayoutPreset.BottomLeft);
        _dwarf.OffsetLeft = 28;
        _dwarf.OffsetTop = -700;
        _dwarf.OffsetRight = 430;
        _dwarf.OffsetBottom = -236;
        AddChild(_dwarf);

        _enemy = new ActorPlate();
        _enemy.SetAnchorsPreset(LayoutPreset.BottomRight);
        _enemy.OffsetLeft = -430;
        _enemy.OffsetTop = -700;
        _enemy.OffsetRight = -28;
        _enemy.OffsetBottom = -236;
        AddChild(_enemy);

        _vitals = UiChrome.Text("", 16, UiChrome.Bold, UiChrome.Gold);
        _vitals.SetAnchorsPreset(LayoutPreset.TopLeft);
        _vitals.OffsetLeft = 36;
        _vitals.OffsetTop = 18;
        _vitals.OffsetRight = 520;
        _vitals.OffsetBottom = 42;
        AddChild(_vitals);

        _banner = UiChrome.Text("", 16, UiChrome.Regular, UiChrome.Gold, true);
        _banner.HorizontalAlignment = HorizontalAlignment.Center;
        _banner.SetAnchorsPreset(LayoutPreset.CenterTop);
        _banner.OffsetLeft = -300;
        _banner.OffsetTop = 16;
        _banner.OffsetRight = 300;
        _banner.OffsetBottom = 56;
        AddChild(_banner);

        var hand = new HBoxContainer
        {
            Alignment = BoxContainer.AlignmentMode.Center
        };
        hand.SetAnchorsPreset(LayoutPreset.BottomWide);
        hand.OffsetLeft = 24;
        hand.OffsetRight = -24;
        hand.OffsetTop = -232;
        hand.OffsetBottom = -8;
        hand.AddThemeConstantOverride("separation", 8);

        var scroll = new ScrollContainer
        {
            SizeFlagsHorizontal = SizeFlags.ExpandFill,
            VerticalScrollMode = ScrollContainer.ScrollMode.Disabled
        };
        _hand = new HBoxContainer
        {
            Alignment = BoxContainer.AlignmentMode.Center,
            SizeFlagsHorizontal = SizeFlags.ExpandFill,
            SizeFlagsVertical = SizeFlags.ShrinkEnd
        };
        _hand.AddThemeConstantOverride("separation", 10);
        scroll.AddChild(_hand);
        hand.AddChild(scroll);

        var end = _plateScene.Instantiate<PlateTap>();
        end.CustomMinimumSize = new Vector2(150, 200);
        end.Pressed += () => EndTurn?.Invoke();
        hand.AddChild(end);
        AddChild(hand);
        end.Bind("End turn", "the dark waits");
    }

    public void Bind(RunState run, Encounter fight, string banner)
    {
        var dwarfPath = run.Class == ClassId.Warrior
            ? "res://art-bible/warrior.jpg"
            : "res://art-bible/runesmith.jpg";
        _dwarf.Bind(run.Dwarf, dwarfPath, null);

        var foe = fight.Enemies.FirstOrDefault(e => !e.IsDead) ?? fight.Enemies[0];
        _enemy.Bind(foe, "res://art-bible/enemy-knuckle.jpg", foe.IsDead ? "Down" : foe.Intent?.Label);

        _vitals.Text = Pips(run.Dwarf.Energy, run.Dwarf.MaxEnergy)
            + $"     Grit {run.Dwarf.Grit}     Might {run.Dwarf.Might}";
        _banner.Text = banner;

        foreach (var child in _hand.GetChildren())
        {
            _hand.RemoveChild(child);
            child.QueueFree();
        }

        for (var i = 0; i < fight.Dwarf.Deck.Hand.Count; i++)
        {
            var card = _cardScene.Instantiate<CardPlate>();
            _hand.AddChild(card);
            card.Bind(i, fight.Dwarf.Deck.Hand[i], fight.Dwarf.Deck.Hand[i].Cost <= fight.Dwarf.Energy);
            card.Chosen += handIndex => PlayCard?.Invoke(handIndex);
        }
    }

    private static string Pips(int have, int max)
    {
        var on = new string('●', Math.Max(0, have));
        var off = new string('○', Math.Max(0, max - have));
        return $"Energy  {on}{off}";
    }
}

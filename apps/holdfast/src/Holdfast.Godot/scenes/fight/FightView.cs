using Godot;
using Holdfast.Application.Run;
using Holdfast.Domain.Actors;
using Holdfast.Domain.Cards;
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

    public override void _Ready()
    {
        SetAnchorsAndOffsetsPreset(LayoutPreset.FullRect);
        MouseFilter = MouseFilterEnum.Stop;
        ClipContents = false;
        _cardScene = GD.Load<PackedScene>("res://scenes/fight/CardPlate.tscn");

        var bg = new TextureRect
        {
            Texture = UiChrome.StageTexture("res://art/fight-cavern.jpg", 0.40f, 0.58f),
            ExpandMode = TextureRect.ExpandModeEnum.IgnoreSize,
            StretchMode = TextureRect.StretchModeEnum.KeepAspectCovered,
            MouseFilter = MouseFilterEnum.Ignore
        };
        bg.SetAnchorsAndOffsetsPreset(LayoutPreset.FullRect);
        AddChild(bg);

        _dwarf = new ActorPlate();
        _dwarf.SetAnchorsPreset(LayoutPreset.BottomLeft);
        _dwarf.OffsetLeft = 0;
        _dwarf.OffsetTop = -700;
        _dwarf.OffsetRight = 520;
        _dwarf.OffsetBottom = -188;
        AddChild(_dwarf);

        _enemy = new ActorPlate();
        _enemy.SetAnchorsPreset(LayoutPreset.BottomRight);
        _enemy.OffsetLeft = -520;
        _enemy.OffsetTop = -700;
        _enemy.OffsetRight = 0;
        _enemy.OffsetBottom = -188;
        AddChild(_enemy);

        _vitals = UiChrome.Text("", 16, UiChrome.Bold, UiChrome.Gold);
        _vitals.SetAnchorsPreset(LayoutPreset.TopLeft);
        _vitals.OffsetLeft = 28;
        _vitals.OffsetTop = 14;
        _vitals.OffsetRight = 420;
        _vitals.OffsetBottom = 38;
        AddChild(_vitals);

        _banner = UiChrome.Text("", 15, UiChrome.Regular, UiChrome.Gold, true);
        _banner.HorizontalAlignment = HorizontalAlignment.Center;
        _banner.SetAnchorsPreset(LayoutPreset.CenterTop);
        _banner.OffsetLeft = -320;
        _banner.OffsetTop = 12;
        _banner.OffsetRight = 320;
        _banner.OffsetBottom = 48;
        AddChild(_banner);

        var row = new HBoxContainer
        {
            Alignment = BoxContainer.AlignmentMode.Center
        };
        row.SetAnchorsPreset(LayoutPreset.BottomWide);
        row.OffsetLeft = 16;
        row.OffsetRight = -16;
        row.OffsetTop = -210;
        row.OffsetBottom = -8;
        row.AddThemeConstantOverride("separation", 8);

        var scroll = new ScrollContainer
        {
            SizeFlagsHorizontal = SizeFlags.ExpandFill,
            VerticalScrollMode = ScrollContainer.ScrollMode.Disabled
        };
        _hand = new HBoxContainer
        {
            Alignment = BoxContainer.AlignmentMode.Center,
            SizeFlagsHorizontal = SizeFlags.ExpandFill
        };
        _hand.AddThemeConstantOverride("separation", 8);
        scroll.AddChild(_hand);
        row.AddChild(scroll);

        var end = new Button
        {
            Text = "End\nturn",
            CustomMinimumSize = new Vector2(88, 200),
            AutowrapMode = TextServer.AutowrapMode.Word
        };
        end.AddThemeFontOverride("font", UiChrome.Bold);
        end.AddThemeFontSizeOverride("font_size", 16);
        end.AddThemeColorOverride("font_color", UiChrome.Gold);
        end.AddThemeStyleboxOverride("normal", UiChrome.StoneBox(new Color(0.07f, 0.05f, 0.03f, 0.82f)));
        end.AddThemeStyleboxOverride("hover", UiChrome.StoneBox(new Color(0.14f, 0.10f, 0.06f, 0.9f)));
        end.AddThemeStyleboxOverride("pressed", UiChrome.StoneBox());
        end.Pressed += () => EndTurn?.Invoke();
        row.AddChild(end);
        AddChild(row);
    }

    public void Bind(RunState run, Encounter fight, string banner)
    {
        _dwarf.Bind(run.Dwarf, PaintedPuppet.Kind.Warrior, null, true);
        var foe = fight.Enemies.FirstOrDefault(e => !e.IsDead) ?? fight.Enemies[0];
        _enemy.Bind(foe, PaintedPuppet.Kind.Knuckle, foe.IsDead ? "Down" : foe.Intent?.Label, false);

        var on = new string('●', Math.Max(0, run.Dwarf.Energy));
        var off = new string('○', Math.Max(0, run.Dwarf.MaxEnergy - run.Dwarf.Energy));
        _vitals.Text = $"Energy  {on}{off}     Grit {run.Dwarf.Grit}     Might {run.Dwarf.Might}";
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

    public void AfterPlay(Card card)
    {
        if (card.Type == CardType.Attack)
        {
            _dwarf.Strike();
            _enemy.Flinch();
        }
        else
        {
            _dwarf.Guard();
        }
    }

    public void AfterEnemy()
    {
        _enemy.Strike();
        _dwarf.Flinch();
    }
}

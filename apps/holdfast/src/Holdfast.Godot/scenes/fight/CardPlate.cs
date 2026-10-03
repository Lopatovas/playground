using Godot;
using Holdfast.Domain.Cards;

namespace Holdfast.GodotGame;

public partial class CardPlate : Control
{
    public int HandIndex { get; private set; }
    public event Action<int>? Chosen;

    private TextureRect _art = null!;
    private Label _cost = null!;
    private Label _name = null!;
    private Label _body = null!;
    private ColorRect _rarity = null!;
    private Button _hit = null!;

    public override void _Ready()
    {
        CustomMinimumSize = new Vector2(148, 200);
        SizeFlagsVertical = SizeFlags.ShrinkEnd;

        var frame = new TextureRect
        {
            Texture = CardArt.Frame(),
            ExpandMode = TextureRect.ExpandModeEnum.IgnoreSize,
            StretchMode = TextureRect.StretchModeEnum.KeepAspectCovered,
            MouseFilter = MouseFilterEnum.Ignore
        };
        frame.SetAnchorsAndOffsetsPreset(LayoutPreset.FullRect);

        _art = new TextureRect
        {
            ExpandMode = TextureRect.ExpandModeEnum.IgnoreSize,
            StretchMode = TextureRect.StretchModeEnum.KeepAspectCovered,
            MouseFilter = MouseFilterEnum.Ignore
        };
        _art.SetAnchorsPreset(LayoutPreset.FullRect);
        _art.AnchorLeft = 0.09f;
        _art.AnchorRight = 0.91f;
        _art.AnchorTop = 0.10f;
        _art.AnchorBottom = 0.60f;

        _cost = UiChrome.Text("", 18, UiChrome.Bold, UiChrome.Gold);
        _cost.HorizontalAlignment = HorizontalAlignment.Center;
        _cost.SetAnchorsPreset(LayoutPreset.TopLeft);
        _cost.OffsetLeft = 8;
        _cost.OffsetTop = 6;
        _cost.OffsetRight = 36;
        _cost.OffsetBottom = 32;

        _rarity = new ColorRect
        {
            Color = UiChrome.Brass,
            MouseFilter = MouseFilterEnum.Ignore
        };
        _rarity.SetAnchorsPreset(LayoutPreset.TopRight);
        _rarity.OffsetLeft = -28;
        _rarity.OffsetTop = 12;
        _rarity.OffsetRight = -16;
        _rarity.OffsetBottom = 24;

        _name = UiChrome.Text("", 15, UiChrome.Bold, UiChrome.Gold);
        _name.HorizontalAlignment = HorizontalAlignment.Center;
        _name.SetAnchorsPreset(LayoutPreset.BottomWide);
        _name.OffsetLeft = 14;
        _name.OffsetRight = -14;
        _name.OffsetTop = -72;
        _name.OffsetBottom = -52;

        _body = UiChrome.Text("", 12, UiChrome.Regular, UiChrome.Muted, true);
        _body.HorizontalAlignment = HorizontalAlignment.Center;
        _body.SetAnchorsPreset(LayoutPreset.BottomWide);
        _body.OffsetLeft = 16;
        _body.OffsetRight = -16;
        _body.OffsetTop = -50;
        _body.OffsetBottom = -10;

        _hit = new Button { Flat = true };
        _hit.SetAnchorsAndOffsetsPreset(LayoutPreset.FullRect);
        _hit.AddThemeStyleboxOverride("normal", UiChrome.GhostBox());
        _hit.AddThemeStyleboxOverride("hover", UiChrome.GhostBox());
        _hit.AddThemeStyleboxOverride("pressed", UiChrome.GhostBox());
        _hit.AddThemeStyleboxOverride("disabled", UiChrome.GhostBox());
        _hit.Pressed += () => Chosen?.Invoke(HandIndex);

        AddChild(frame);
        AddChild(_art);
        AddChild(_cost);
        AddChild(_rarity);
        AddChild(_name);
        AddChild(_body);
        AddChild(_hit);
    }

    public void Bind(int index, Card card, bool canPlay)
    {
        HandIndex = index;
        _art.Texture = CardArt.For(card);
        _cost.Text = $"{card.Cost}";
        _name.Text = card.Name;
        var dice = card switch
        {
            AttackCard a => a.Damage.Printed,
            SkillCard { Block: not null } s => s.Block!.Printed,
            _ => ""
        };
        _body.Text = string.IsNullOrEmpty(dice) ? card.Text : card.Text.Replace("{dice}", dice);
        _rarity.Color = card.Type == CardType.Attack ? new Color(0.72f, 0.32f, 0.18f) : UiChrome.Brass;
        _hit.Disabled = !canPlay;
        Modulate = canPlay ? Colors.White : new Color(0.55f, 0.52f, 0.48f);
    }
}

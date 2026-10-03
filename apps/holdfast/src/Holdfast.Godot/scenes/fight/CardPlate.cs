using Godot;
using Holdfast.Domain.Cards;

namespace Holdfast.GodotGame;

public partial class CardPlate : Control
{
    public int HandIndex { get; private set; }
    public event Action<int>? Chosen;

    private TextureRect _plate = null!;
    private Label _cost = null!;
    private Label _name = null!;
    private Label _dice = null!;
    private Label _body = null!;
    private Button _hit = null!;

    public override void _Ready()
    {
        CustomMinimumSize = new Vector2(140, 168);
        SizeFlagsVertical = SizeFlags.ShrinkEnd;

        _plate = new TextureRect
        {
            Texture = UiChrome.CardPlate,
            ExpandMode = TextureRect.ExpandModeEnum.IgnoreSize,
            StretchMode = TextureRect.StretchModeEnum.KeepAspectCovered,
            MouseFilter = MouseFilterEnum.Ignore
        };
        _plate.SetAnchorsAndOffsetsPreset(LayoutPreset.FullRect);

        var pad = new MarginContainer();
        pad.SetAnchorsAndOffsetsPreset(LayoutPreset.FullRect);
        pad.AddThemeConstantOverride("margin_left", 24);
        pad.AddThemeConstantOverride("margin_right", 24);
        pad.AddThemeConstantOverride("margin_top", 28);
        pad.AddThemeConstantOverride("margin_bottom", 26);
        pad.MouseFilter = MouseFilterEnum.Ignore;

        var col = new VBoxContainer();
        col.AddThemeConstantOverride("separation", 4);
        _cost = UiChrome.Text("", 16, UiChrome.Bold, UiChrome.Gold);
        _cost.HorizontalAlignment = HorizontalAlignment.Center;
        _name = UiChrome.Text("", 18, UiChrome.Bold, UiChrome.Ink);
        _name.HorizontalAlignment = HorizontalAlignment.Center;
        _name.AutowrapMode = TextServer.AutowrapMode.Word;
        _dice = UiChrome.Text("", 15, UiChrome.Bold, new Color(0.38f, 0.22f, 0.10f));
        _dice.HorizontalAlignment = HorizontalAlignment.Center;
        _body = UiChrome.Text("", 13, UiChrome.Regular, new Color(0.22f, 0.16f, 0.10f), true);
        _body.HorizontalAlignment = HorizontalAlignment.Center;
        _body.SizeFlagsVertical = SizeFlags.ExpandFill;
        col.AddChild(_cost);
        col.AddChild(_name);
        col.AddChild(_dice);
        col.AddChild(_body);
        pad.AddChild(col);

        _hit = new Button
        {
            Flat = true,
            MouseFilter = MouseFilterEnum.Stop
        };
        _hit.SetAnchorsAndOffsetsPreset(LayoutPreset.FullRect);
        _hit.AddThemeStyleboxOverride("normal", UiChrome.GhostBox());
        _hit.AddThemeStyleboxOverride("hover", UiChrome.GhostBox());
        _hit.AddThemeStyleboxOverride("pressed", UiChrome.GhostBox());
        _hit.AddThemeStyleboxOverride("disabled", UiChrome.GhostBox());
        _hit.Pressed += () => Chosen?.Invoke(HandIndex);

        AddChild(_plate);
        AddChild(pad);
        AddChild(_hit);
    }

    public void Bind(int index, Card card, bool canPlay)
    {
        HandIndex = index;
        _cost.Text = $"{card.Cost}";
        _name.Text = card.Name;
        var dice = DiceText(card);
        _dice.Text = string.IsNullOrEmpty(dice) ? card.Type.ToString() : dice;
        _body.Text = string.IsNullOrEmpty(dice) ? card.Text : card.Text.Replace("{dice}", dice);
        _hit.Disabled = !canPlay;
        Modulate = canPlay ? Colors.White : new Color(0.55f, 0.52f, 0.48f);
    }

    private static string DiceText(Card card) =>
        card switch
        {
            AttackCard a => a.Damage.Printed,
            SkillCard { Block: not null } s => s.Block!.Printed,
            _ => ""
        };
}

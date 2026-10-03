using Godot;
using Holdfast.Domain.Cards;

namespace Holdfast.GodotGame;

public partial class CardPlate : Control
{
    public int HandIndex { get; private set; }
    public event Action<int>? Chosen;

    private Label _name = null!;
    private Label _line = null!;
    private Button _hit = null!;

    public override void _Ready()
    {
        CustomMinimumSize = new Vector2(168, 224);
        SizeFlagsVertical = SizeFlags.ShrinkEnd;

        var plate = new TextureRect
        {
            Texture = UiChrome.CardPlate,
            ExpandMode = TextureRect.ExpandModeEnum.IgnoreSize,
            StretchMode = TextureRect.StretchModeEnum.KeepAspectCovered,
            MouseFilter = MouseFilterEnum.Ignore
        };
        plate.SetAnchorsAndOffsetsPreset(LayoutPreset.FullRect);

        var pad = new MarginContainer { MouseFilter = MouseFilterEnum.Ignore };
        pad.SetAnchorsAndOffsetsPreset(LayoutPreset.FullRect);
        pad.AddThemeConstantOverride("margin_left", 30);
        pad.AddThemeConstantOverride("margin_right", 30);
        pad.AddThemeConstantOverride("margin_top", 40);
        pad.AddThemeConstantOverride("margin_bottom", 36);

        var col = new VBoxContainer
        {
            Alignment = BoxContainer.AlignmentMode.Center
        };
        col.AddThemeConstantOverride("separation", 8);
        _name = UiChrome.Text("", 22, UiChrome.Bold, UiChrome.Ink);
        _name.HorizontalAlignment = HorizontalAlignment.Center;
        _name.AutowrapMode = TextServer.AutowrapMode.Word;
        _line = UiChrome.Text("", 14, UiChrome.Regular, new Color(0.24f, 0.16f, 0.10f), true);
        _line.HorizontalAlignment = HorizontalAlignment.Center;
        _line.SizeFlagsVertical = SizeFlags.ExpandFill;
        col.AddChild(_name);
        col.AddChild(_line);
        pad.AddChild(col);

        _hit = new Button { Flat = true };
        _hit.SetAnchorsAndOffsetsPreset(LayoutPreset.FullRect);
        _hit.AddThemeStyleboxOverride("normal", UiChrome.GhostBox());
        _hit.AddThemeStyleboxOverride("hover", UiChrome.GhostBox());
        _hit.AddThemeStyleboxOverride("pressed", UiChrome.GhostBox());
        _hit.AddThemeStyleboxOverride("disabled", UiChrome.GhostBox());
        _hit.Pressed += () => Chosen?.Invoke(HandIndex);

        AddChild(plate);
        AddChild(pad);
        AddChild(_hit);
    }

    public void Bind(int index, Card card, bool canPlay)
    {
        HandIndex = index;
        var dice = DiceText(card);
        var body = string.IsNullOrEmpty(dice) ? card.Text : card.Text.Replace("{dice}", dice);
        _name.Text = card.Name;
        _line.Text = $"{card.Cost}  ·  {(string.IsNullOrEmpty(dice) ? card.Type.ToString() : dice)}\n{body}";
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

using Godot;
using Holdfast.Application.HoldCamp;
using Holdfast.Domain.Actors;
using Holdfast.Domain.Hold;

namespace Holdfast.GodotGame;

public partial class HoldView : Control
{
    public event Action<ClassId>? Walk;
    public event Action<string>? Buy;
    public event Action? Peek;

    private Label _stones = null!;
    private VBoxContainer _ledger = null!;
    private Button _runesmith = null!;

    public override void _Ready()
    {
        SetAnchorsAndOffsetsPreset(LayoutPreset.FullRect);
        MouseFilter = MouseFilterEnum.Stop;

        AddChild(UiChrome.Cover("res://art-bible/hold-hearth.jpg"));

        var veil = new ColorRect
        {
            Color = new Color(0.02f, 0.015f, 0.01f, 0.28f),
            MouseFilter = MouseFilterEnum.Ignore
        };
        veil.SetAnchorsAndOffsetsPreset(LayoutPreset.FullRect);
        AddChild(veil);

        var left = new VBoxContainer
        {
            Alignment = BoxContainer.AlignmentMode.Begin
        };
        left.SetAnchorsPreset(LayoutPreset.LeftWide);
        left.OffsetLeft = 36;
        left.OffsetTop = 28;
        left.OffsetRight = 420;
        left.OffsetBottom = -28;
        left.AddThemeConstantOverride("separation", 10);

        var title = UiChrome.Text("HOLDFAST", 42, UiChrome.Bold, UiChrome.Gold);
        _stones = UiChrome.Text("", 18, UiChrome.Regular, UiChrome.Muted);
        var walk = WalkPlate("Walk as Warrior", () => Walk?.Invoke(ClassId.Warrior));
        _runesmith = WalkPlate("Walk as Runesmith", () => Walk?.Invoke(ClassId.Runesmith));
        _runesmith.Visible = false;
        var peek = UiChrome.StoneButton("Peek the dark", () => Peek?.Invoke());
        peek.CustomMinimumSize = new Vector2(168, 40);
        peek.SizeFlagsHorizontal = SizeFlags.ShrinkBegin;

        left.AddChild(title);
        left.AddChild(_stones);
        left.AddChild(new Control { CustomMinimumSize = new Vector2(0, 8) });
        left.AddChild(walk);
        left.AddChild(_runesmith);
        left.AddChild(peek);
        AddChild(left);

        var panel = new PanelContainer();
        panel.SetAnchorsPreset(LayoutPreset.RightWide);
        panel.OffsetLeft = -360;
        panel.OffsetTop = 24;
        panel.OffsetRight = -24;
        panel.OffsetBottom = -24;
        panel.AddThemeStyleboxOverride("panel", UiChrome.StoneBox(new Color(0.06f, 0.045f, 0.03f, 0.86f)));

        var col = new VBoxContainer();
        col.AddThemeConstantOverride("separation", 8);
        col.AddChild(UiChrome.Text("Ledger", 24, UiChrome.Bold, UiChrome.Gold));
        col.AddChild(UiChrome.Text("Cut runestones into the hearth.", 14, UiChrome.Regular, UiChrome.Muted, true));
        var scroll = new ScrollContainer
        {
            SizeFlagsVertical = SizeFlags.ExpandFill,
            HorizontalScrollMode = ScrollContainer.ScrollMode.Disabled
        };
        _ledger = new VBoxContainer { SizeFlagsHorizontal = SizeFlags.ExpandFill };
        _ledger.AddThemeConstantOverride("separation", 8);
        scroll.AddChild(_ledger);
        col.AddChild(scroll);
        panel.AddChild(col);
        AddChild(panel);
    }

    public void Bind(HoldService hold)
    {
        _stones.Text = $"Runestones  {hold.Progress.Runestones}     Brand  {hold.Progress.Brand[ClassId.Warrior]}";
        _runesmith.Visible = hold.Progress.Unlocked.Contains(ClassId.Runesmith);

        foreach (var child in _ledger.GetChildren())
        {
            _ledger.RemoveChild(child);
            child.QueueFree();
        }

        foreach (var node in hold.Available())
        {
            var id = node.Id;
            var can = hold.Progress.Runestones >= node.Cost;
            var row = UiChrome.StoneButton($"{node.Name}\n{node.Cost} stones", () => Buy?.Invoke(id), can);
            row.CustomMinimumSize = new Vector2(0, 58);
            _ledger.AddChild(row);
        }
    }

    private static Button WalkPlate(string label, Action onPressed)
    {
        var b = new Button
        {
            Text = label,
            CustomMinimumSize = new Vector2(280, 72),
            SizeFlagsHorizontal = SizeFlags.ShrinkBegin
        };
        b.AddThemeFontOverride("font", UiChrome.Bold);
        b.AddThemeFontSizeOverride("font_size", 22);
        b.AddThemeColorOverride("font_color", UiChrome.Gold);
        b.AddThemeStyleboxOverride("normal", UiChrome.StoneBox(new Color(0.08f, 0.06f, 0.04f, 0.82f)));
        b.AddThemeStyleboxOverride("hover", UiChrome.StoneBox(new Color(0.16f, 0.12f, 0.07f, 0.9f)));
        b.AddThemeStyleboxOverride("pressed", UiChrome.StoneBox(new Color(0.05f, 0.04f, 0.03f, 0.9f)));
        b.Pressed += onPressed;
        return b;
    }
}

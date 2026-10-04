using Godot;

namespace Holdfast.GodotGame;

public partial class SheetView : Control
{
    private TextureRect _bg = null!;
    private Label _title = null!;
    private Label _body = null!;
    private HBoxContainer _actions = null!;

    public override void _Ready()
    {
        SetAnchorsAndOffsetsPreset(LayoutPreset.FullRect);
        MouseFilter = MouseFilterEnum.Stop;

        _bg = new TextureRect
        {
            ExpandMode = TextureRect.ExpandModeEnum.IgnoreSize,
            StretchMode = TextureRect.StretchModeEnum.KeepAspectCovered,
            MouseFilter = MouseFilterEnum.Ignore
        };
        _bg.SetAnchorsAndOffsetsPreset(LayoutPreset.FullRect);
        AddChild(_bg);

        var veil = new ColorRect
        {
            Color = new Color(0.02f, 0.015f, 0.01f, 0.42f),
            MouseFilter = MouseFilterEnum.Ignore
        };
        veil.SetAnchorsAndOffsetsPreset(LayoutPreset.FullRect);
        AddChild(veil);

        var col = new VBoxContainer
        {
            Alignment = BoxContainer.AlignmentMode.Center
        };
        col.SetAnchorsPreset(LayoutPreset.FullRect);
        col.OffsetLeft = 80;
        col.OffsetTop = 48;
        col.OffsetRight = -80;
        col.OffsetBottom = -48;
        col.AddThemeConstantOverride("separation", 16);

        _title = UiChrome.Text("", 36, UiChrome.Bold, UiChrome.Gold);
        _title.HorizontalAlignment = HorizontalAlignment.Center;
        _body = UiChrome.Text("", 18, UiChrome.Regular, UiChrome.Muted, true);
        _body.HorizontalAlignment = HorizontalAlignment.Center;
        _actions = new HBoxContainer
        {
            Alignment = BoxContainer.AlignmentMode.Center,
            SizeFlagsHorizontal = SizeFlags.ExpandFill
        };
        _actions.AddThemeConstantOverride("separation", 12);

        col.AddChild(_title);
        col.AddChild(_body);
        col.AddChild(_actions);
        AddChild(col);
    }

    public void ShowSheet(string title, string body, string art, IReadOnlyList<(string Label, Action Act)> actions)
    {
        _bg.Texture = GD.Load<Texture2D>(art);
        _title.Text = title;
        _body.Text = body;
        foreach (var child in _actions.GetChildren())
        {
            _actions.RemoveChild(child);
            child.QueueFree();
        }

        foreach (var (label, act) in actions)
        {
            var b = UiChrome.StoneButton(label, act);
            b.CustomMinimumSize = new Vector2(180, 56);
            b.SizeFlagsHorizontal = SizeFlags.ShrinkCenter;
            _actions.AddChild(b);
        }
    }
}

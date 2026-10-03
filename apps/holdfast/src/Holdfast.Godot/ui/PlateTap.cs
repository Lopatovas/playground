using Godot;

namespace Holdfast.GodotGame;

public partial class PlateTap : Control
{
    public event Action? Pressed;

    private Label _title = null!;
    private Label _sub = null!;
    private Button _hit = null!;

    public override void _Ready()
    {
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
        pad.AddThemeConstantOverride("margin_left", 28);
        pad.AddThemeConstantOverride("margin_right", 28);
        pad.AddThemeConstantOverride("margin_top", 22);
        pad.AddThemeConstantOverride("margin_bottom", 22);

        var col = new VBoxContainer
        {
            Alignment = BoxContainer.AlignmentMode.Center
        };
        _title = UiChrome.Text("", 22, UiChrome.Bold, UiChrome.Ink);
        _title.HorizontalAlignment = HorizontalAlignment.Center;
        _title.AutowrapMode = TextServer.AutowrapMode.Word;
        _sub = UiChrome.Text("", 14, UiChrome.Regular, new Color(0.32f, 0.22f, 0.12f), true);
        _sub.HorizontalAlignment = HorizontalAlignment.Center;
        col.AddChild(_title);
        col.AddChild(_sub);
        pad.AddChild(col);

        _hit = new Button { Flat = true };
        _hit.SetAnchorsAndOffsetsPreset(LayoutPreset.FullRect);
        _hit.AddThemeStyleboxOverride("normal", UiChrome.GhostBox());
        _hit.AddThemeStyleboxOverride("hover", UiChrome.GhostBox());
        _hit.AddThemeStyleboxOverride("pressed", UiChrome.GhostBox());
        _hit.AddThemeStyleboxOverride("disabled", UiChrome.GhostBox());
        _hit.Pressed += () => Pressed?.Invoke();

        AddChild(plate);
        AddChild(pad);
        AddChild(_hit);
    }

    public void Bind(string title, string? sub = null, bool enabled = true)
    {
        _title.Text = title;
        _sub.Text = sub ?? "";
        _sub.Visible = !string.IsNullOrEmpty(sub);
        _hit.Disabled = !enabled;
        Modulate = enabled ? Colors.White : new Color(0.55f, 0.5f, 0.45f);
    }
}

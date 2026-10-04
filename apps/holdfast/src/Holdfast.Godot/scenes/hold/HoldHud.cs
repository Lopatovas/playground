using Godot;
using Holdfast.Application.HoldCamp;

namespace Holdfast.GodotGame;

public partial class HoldHud : Control
{
    public event Action<string>? Buy;

    private Label _stones = null!;
    private Control _prompt = null!;
    private Label _promptText = null!;
    private Control _journal = null!;
    private VBoxContainer _pages = null!;
    private Label _hint = null!;
    private Tween? _hintTween;

    public override void _Ready()
    {
        SetAnchorsAndOffsetsPreset(LayoutPreset.FullRect);
        MouseFilter = MouseFilterEnum.Ignore;

        AddChild(Vignette());

        var stone = new Panel { MouseFilter = MouseFilterEnum.Ignore };
        stone.SetAnchorsPreset(LayoutPreset.TopLeft);
        stone.OffsetLeft = 28;
        stone.OffsetTop = 24;
        stone.OffsetRight = 250;
        stone.OffsetBottom = 84;
        stone.AddThemeStyleboxOverride("panel", Frame(new Color(0.06f, 0.04f, 0.03f, 0.72f)));
        var cap = UiChrome.Text("RUNESTONES", 11, UiChrome.Bold, new Color(0.72f, 0.58f, 0.32f));
        cap.Position = new Vector2(16, 8);
        _stones = UiChrome.Text("0", 28, UiChrome.Bold, UiChrome.Gold);
        _stones.Position = new Vector2(16, 26);
        stone.AddChild(cap);
        stone.AddChild(_stones);
        AddChild(stone);

        _prompt = new Panel { Visible = false, MouseFilter = MouseFilterEnum.Ignore };
        _prompt.SetAnchorsPreset(LayoutPreset.CenterBottom);
        _prompt.OffsetLeft = -210;
        _prompt.OffsetTop = -118;
        _prompt.OffsetRight = 210;
        _prompt.OffsetBottom = -52;
        _prompt.AddThemeStyleboxOverride("panel", Frame(new Color(0.04f, 0.03f, 0.02f, 0.78f)));
        _promptText = UiChrome.Text("", 22, UiChrome.Bold, UiChrome.Gold);
        _promptText.HorizontalAlignment = HorizontalAlignment.Center;
        _promptText.SetAnchorsAndOffsetsPreset(LayoutPreset.FullRect);
        _prompt.AddChild(_promptText);
        AddChild(_prompt);

        _hint = UiChrome.Text("", 16, UiChrome.Regular, UiChrome.Muted);
        _hint.HorizontalAlignment = HorizontalAlignment.Center;
        _hint.SetAnchorsPreset(LayoutPreset.CenterTop);
        _hint.OffsetLeft = -280;
        _hint.OffsetTop = 96;
        _hint.OffsetRight = 280;
        _hint.OffsetBottom = 128;
        AddChild(_hint);

        _journal = new Panel { Visible = false, MouseFilter = MouseFilterEnum.Stop };
        _journal.SetAnchorsPreset(LayoutPreset.CenterBottom);
        _journal.OffsetLeft = -360;
        _journal.OffsetTop = -430;
        _journal.OffsetRight = 360;
        _journal.OffsetBottom = -36;
        _journal.AddThemeStyleboxOverride("panel", Frame(new Color(0.10f, 0.07f, 0.04f, 0.94f)));
        var title = UiChrome.Text("LEDGER", 20, UiChrome.Bold, UiChrome.Gold);
        title.SetAnchorsPreset(LayoutPreset.TopWide);
        title.HorizontalAlignment = HorizontalAlignment.Center;
        title.OffsetTop = 16;
        title.OffsetBottom = 44;
        _pages = new VBoxContainer();
        _pages.SetAnchorsPreset(LayoutPreset.FullRect);
        _pages.OffsetLeft = 28;
        _pages.OffsetTop = 56;
        _pages.OffsetRight = -28;
        _pages.OffsetBottom = -20;
        _pages.AddThemeConstantOverride("separation", 8);
        _journal.AddChild(title);
        _journal.AddChild(_pages);
        AddChild(_journal);
    }

    public void Bind(HoldService hold)
    {
        _stones.Text = $"{hold.Progress.Runestones}";
        foreach (var child in _pages.GetChildren())
        {
            _pages.RemoveChild(child);
            child.QueueFree();
        }

        foreach (var node in hold.Available())
        {
            var id = node.Id;
            var can = hold.Progress.Runestones >= node.Cost;
            var row = new Button
            {
                Text = $"{node.Name}     {node.Cost}",
                Disabled = !can,
                Alignment = HorizontalAlignment.Left,
                CustomMinimumSize = new Vector2(0, 44)
            };
            row.AddThemeFontOverride("font", UiChrome.Bold);
            row.AddThemeFontSizeOverride("font_size", 18);
            row.AddThemeColorOverride("font_color", can ? UiChrome.Gold : UiChrome.Muted);
            row.AddThemeStyleboxOverride("normal", Frame(new Color(0.16f, 0.1f, 0.05f, 0.7f)));
            row.AddThemeStyleboxOverride("hover", Frame(new Color(0.28f, 0.18f, 0.08f, 0.85f)));
            row.AddThemeStyleboxOverride("pressed", Frame(new Color(0.1f, 0.07f, 0.04f, 0.9f)));
            row.AddThemeStyleboxOverride("disabled", Frame(new Color(0.08f, 0.06f, 0.04f, 0.5f)));
            row.Pressed += () => Buy?.Invoke(id);
            _pages.AddChild(row);
        }
    }

    public void SetFocus(string? hit)
    {
        var text = hit switch
        {
            "door" => "WALK   ·   Warrior",
            "book" => "OPEN   ·   Ledger",
            "winch" => "LOOK   ·   The dark",
            "fire" => "The hearth holds",
            _ => ""
        };
        _prompt.Visible = text.Length > 0 && !_journal.Visible;
        _promptText.Text = text;
    }

    public void ToggleJournal()
    {
        _journal.Visible = !_journal.Visible;
        _prompt.Visible = !_journal.Visible && _prompt.Visible;
    }

    public bool JournalOpen => _journal.Visible;

    public void Whisper(string text)
    {
        _hint.Text = text;
        _hint.Modulate = Colors.White;
        _hintTween?.Kill();
        _hintTween = CreateTween();
        _hintTween.TweenInterval(2.2);
        _hintTween.TweenProperty(_hint, "modulate:a", 0f, 0.8);
    }

    private static StyleBoxFlat Frame(Color fill)
    {
        return new StyleBoxFlat
        {
            BgColor = fill,
            BorderColor = new Color(0.72f, 0.56f, 0.28f, 0.85f),
            BorderWidthLeft = 2,
            BorderWidthTop = 2,
            BorderWidthRight = 2,
            BorderWidthBottom = 2,
            CornerRadiusTopLeft = 2,
            CornerRadiusTopRight = 2,
            CornerRadiusBottomRight = 2,
            CornerRadiusBottomLeft = 2,
            ContentMarginLeft = 16,
            ContentMarginRight = 16,
            ContentMarginTop = 8,
            ContentMarginBottom = 8,
            ShadowColor = new Color(0, 0, 0, 0.45f),
            ShadowSize = 8
        };
    }

    private static ColorRect Vignette()
    {
        var v = new ColorRect
        {
            Color = new Color(0, 0, 0, 0),
            MouseFilter = MouseFilterEnum.Ignore
        };
        v.SetAnchorsAndOffsetsPreset(LayoutPreset.FullRect);
        return v;
    }
}

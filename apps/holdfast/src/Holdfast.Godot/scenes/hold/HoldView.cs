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

    private Label _whisper = null!;
    private Control _bookOpen = null!;
    private VBoxContainer _leftPage = null!;
    private VBoxContainer _rightPage = null!;
    private Label _stones = null!;
    private bool _runesmith;
    private bool _bookShown;

    public override void _Ready()
    {
        SetAnchorsAndOffsetsPreset(LayoutPreset.FullRect);
        MouseFilter = MouseFilterEnum.Stop;

        AddChild(UiChrome.Cover("res://art-bible/hold-hearth.jpg"));

        _whisper = UiChrome.Text("", 20, UiChrome.Bold, UiChrome.Gold);
        _whisper.HorizontalAlignment = HorizontalAlignment.Center;
        _whisper.SetAnchorsPreset(LayoutPreset.CenterTop);
        _whisper.OffsetLeft = -220;
        _whisper.OffsetTop = 28;
        _whisper.OffsetRight = 220;
        _whisper.OffsetBottom = 56;
        AddChild(_whisper);

        Hotspot(
            new Vector2(0.36f, 0.08f),
            new Vector2(0.64f, 0.52f),
            "Walk as Warrior",
            () => Walk?.Invoke(ClassId.Warrior),
            () => _runesmith ? "The door. Warrior — or the Runesmith, if you linger." : "The door. Walk as Warrior.");

        Hotspot(
            new Vector2(0.08f, 0.12f),
            new Vector2(0.28f, 0.58f),
            "The winch",
            () => Peek?.Invoke(),
            () => "The winch. Peek at the dark.");

        var book = new TextureRect
        {
            Texture = GD.Load<Texture2D>("res://art/ledger-book.jpg"),
            ExpandMode = TextureRect.ExpandModeEnum.IgnoreSize,
            StretchMode = TextureRect.StretchModeEnum.KeepAspectCentered,
            MouseFilter = MouseFilterEnum.Ignore
        };
        book.SetAnchorsPreset(LayoutPreset.BottomLeft);
        book.AnchorLeft = 0.36f;
        book.AnchorRight = 0.48f;
        book.OffsetTop = -168;
        book.OffsetBottom = -24;
        AddChild(book);

        var bookHit = Hotspot(
            new Vector2(0.34f, 0.72f),
            new Vector2(0.50f, 0.96f),
            "The Ledger",
            ToggleBook,
            () => "The Ledger. By the fire.");
        bookHit.ZIndex = 2;

        _bookOpen = new Control { Visible = false, MouseFilter = MouseFilterEnum.Stop };
        _bookOpen.SetAnchorsPreset(LayoutPreset.BottomWide);
        _bookOpen.OffsetTop = -340;
        _bookOpen.OffsetBottom = -8;
        var pages = new TextureRect
        {
            Texture = GD.Load<Texture2D>("res://art/ledger-open.jpg"),
            ExpandMode = TextureRect.ExpandModeEnum.IgnoreSize,
            StretchMode = TextureRect.StretchModeEnum.KeepAspectCovered,
            MouseFilter = MouseFilterEnum.Ignore
        };
        pages.SetAnchorsAndOffsetsPreset(LayoutPreset.FullRect);
        _bookOpen.AddChild(pages);

        _stones = UiChrome.Text("", 16, UiChrome.Bold, UiChrome.Gold);
        _stones.HorizontalAlignment = HorizontalAlignment.Center;
        _stones.SetAnchorsPreset(LayoutPreset.TopWide);
        _stones.OffsetTop = 18;
        _stones.OffsetBottom = 42;
        _bookOpen.AddChild(_stones);

        _leftPage = Page(0.10f, 0.46f);
        _rightPage = Page(0.54f, 0.90f);
        _bookOpen.AddChild(_leftPage);
        _bookOpen.AddChild(_rightPage);

        var close = new Button { Flat = true, Text = "" };
        close.SetAnchorsPreset(LayoutPreset.TopRight);
        close.OffsetLeft = -80;
        close.OffsetTop = 8;
        close.OffsetRight = -12;
        close.OffsetBottom = 36;
        close.AddThemeStyleboxOverride("normal", UiChrome.GhostBox());
        close.AddThemeStyleboxOverride("hover", UiChrome.GhostBox());
        close.AddThemeStyleboxOverride("pressed", UiChrome.GhostBox());
        close.AddThemeFontOverride("font", UiChrome.Regular);
        close.AddThemeFontSizeOverride("font_size", 14);
        close.AddThemeColorOverride("font_color", UiChrome.Muted);
        close.Text = "close";
        close.Pressed += ToggleBook;
        _bookOpen.AddChild(close);
        AddChild(_bookOpen);
    }

    public void Bind(HoldService hold)
    {
        _runesmith = hold.Progress.Unlocked.Contains(ClassId.Runesmith);
        _stones.Text = $"Runestones  {hold.Progress.Runestones}";

        foreach (var box in new[] { _leftPage, _rightPage })
        {
            foreach (var child in box.GetChildren())
            {
                box.RemoveChild(child);
                child.QueueFree();
            }
        }

        var nodes = hold.Available().ToList();
        var mid = (nodes.Count + 1) / 2;
        FillPage(_leftPage, nodes.Take(mid), hold);
        FillPage(_rightPage, nodes.Skip(mid), hold);
    }

    private void FillPage(VBoxContainer page, IEnumerable<LedgerNode> nodes, HoldService hold)
    {
        foreach (var node in nodes)
        {
            var id = node.Id;
            var can = hold.Progress.Runestones >= node.Cost;
            var row = new Button
            {
                Text = $"{node.Name}   {node.Cost}",
                Flat = true,
                Disabled = !can,
                Alignment = HorizontalAlignment.Left,
                CustomMinimumSize = new Vector2(0, 26)
            };
            row.AddThemeFontOverride("font", UiChrome.Regular);
            row.AddThemeFontSizeOverride("font_size", 16);
            row.AddThemeColorOverride("font_color", can ? UiChrome.Ink : UiChrome.Muted);
            row.AddThemeStyleboxOverride("normal", UiChrome.GhostBox());
            row.AddThemeStyleboxOverride("hover", UiChrome.GhostBox());
            row.AddThemeStyleboxOverride("pressed", UiChrome.GhostBox());
            row.AddThemeStyleboxOverride("disabled", UiChrome.GhostBox());
            row.Pressed += () => Buy?.Invoke(id);
            page.AddChild(row);
        }
    }

    private void ToggleBook()
    {
        _bookShown = !_bookShown;
        _bookOpen.Visible = _bookShown;
    }

    private VBoxContainer Page(float left, float right)
    {
        var box = new VBoxContainer();
        box.SetAnchorsPreset(LayoutPreset.FullRect);
        box.AnchorLeft = left;
        box.AnchorRight = right;
        box.OffsetTop = 52;
        box.OffsetBottom = -28;
        box.AddThemeConstantOverride("separation", 2);
        return box;
    }

    private Button Hotspot(Vector2 min, Vector2 max, string idle, Action pressed, Func<string> hover)
    {
        var hit = new Button { Flat = true };
        hit.SetAnchorsPreset(LayoutPreset.FullRect);
        hit.AnchorLeft = min.X;
        hit.AnchorTop = min.Y;
        hit.AnchorRight = max.X;
        hit.AnchorBottom = max.Y;
        hit.AddThemeStyleboxOverride("normal", UiChrome.GhostBox());
        hit.AddThemeStyleboxOverride("hover", UiChrome.GhostBox());
        hit.AddThemeStyleboxOverride("pressed", UiChrome.GhostBox());
        hit.MouseEntered += () => _whisper.Text = hover();
        hit.MouseExited += () =>
        {
            if (_whisper.Text == hover() || _whisper.Text.StartsWith(idle))
            {
                _whisper.Text = "";
            }
        };
        hit.Pressed += pressed;
        AddChild(hit);
        return hit;
    }
}

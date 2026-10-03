using Godot;
using Holdfast.Application.HoldCamp;
using Holdfast.Domain.Actors;

namespace Holdfast.GodotGame;

public partial class HoldView : Control
{
    public event Action<ClassId>? Walk;
    public event Action<string>? Buy;
    public event Action? Peek;

    private Label _stones = null!;
    private VBoxContainer _ledger = null!;
    private PlateTap _runesmith = null!;
    private PackedScene _plateScene = null!;

    public override void _Ready()
    {
        SetAnchorsAndOffsetsPreset(LayoutPreset.FullRect);
        MouseFilter = MouseFilterEnum.Stop;
        _plateScene = GD.Load<PackedScene>("res://ui/PlateTap.tscn");

        AddChild(UiChrome.Cover("res://art-bible/hold-hearth.jpg"));

        var title = UiChrome.Text("HOLDFAST", 48, UiChrome.Bold, UiChrome.Gold);
        title.SetAnchorsPreset(LayoutPreset.TopLeft);
        title.OffsetLeft = 40;
        title.OffsetTop = 28;
        title.OffsetRight = 420;
        title.OffsetBottom = 80;
        AddChild(title);

        _stones = UiChrome.Text("", 16, UiChrome.Regular, UiChrome.Muted);
        _stones.SetAnchorsPreset(LayoutPreset.TopLeft);
        _stones.OffsetLeft = 42;
        _stones.OffsetTop = 78;
        _stones.OffsetRight = 480;
        _stones.OffsetBottom = 102;
        AddChild(_stones);

        var walk = _plateScene.Instantiate<PlateTap>();
        walk.SetAnchorsPreset(LayoutPreset.BottomLeft);
        walk.OffsetLeft = 48;
        walk.OffsetTop = -280;
        walk.OffsetRight = 300;
        walk.OffsetBottom = -40;
        walk.Pressed += () => Walk?.Invoke(ClassId.Warrior);
        AddChild(walk);
        walk.Bind("Walk as Warrior", "into the dark");

        _runesmith = _plateScene.Instantiate<PlateTap>();
        _runesmith.SetAnchorsPreset(LayoutPreset.BottomLeft);
        _runesmith.OffsetLeft = 312;
        _runesmith.OffsetTop = -280;
        _runesmith.OffsetRight = 564;
        _runesmith.OffsetBottom = -40;
        _runesmith.Pressed += () => Walk?.Invoke(ClassId.Runesmith);
        AddChild(_runesmith);
        _runesmith.Bind("Walk as Runesmith", "once the hall is open");
        _runesmith.Visible = false;

        var peek = new Button
        {
            Text = "Peek",
            Flat = true,
            CustomMinimumSize = new Vector2(64, 28)
        };
        peek.AddThemeFontOverride("font", UiChrome.Regular);
        peek.AddThemeFontSizeOverride("font_size", 14);
        peek.AddThemeColorOverride("font_color", UiChrome.Muted);
        peek.AddThemeStyleboxOverride("normal", UiChrome.GhostBox());
        peek.AddThemeStyleboxOverride("hover", UiChrome.GhostBox());
        peek.AddThemeStyleboxOverride("pressed", UiChrome.GhostBox());
        peek.SetAnchorsPreset(LayoutPreset.TopLeft);
        peek.OffsetLeft = 42;
        peek.OffsetTop = 104;
        peek.OffsetRight = 110;
        peek.OffsetBottom = 128;
        peek.Pressed += () => Peek?.Invoke();
        AddChild(peek);

        var book = new TextureRect
        {
            Texture = UiChrome.CardPlate,
            ExpandMode = TextureRect.ExpandModeEnum.IgnoreSize,
            StretchMode = TextureRect.StretchModeEnum.KeepAspectCovered,
            MouseFilter = MouseFilterEnum.Ignore
        };
        book.SetAnchorsPreset(LayoutPreset.RightWide);
        book.OffsetLeft = -380;
        book.OffsetTop = 16;
        book.OffsetRight = -16;
        book.OffsetBottom = -16;
        AddChild(book);

        var col = new VBoxContainer();
        col.SetAnchorsPreset(LayoutPreset.RightWide);
        col.OffsetLeft = -330;
        col.OffsetTop = 70;
        col.OffsetRight = -56;
        col.OffsetBottom = -70;
        col.AddThemeConstantOverride("separation", 6);
        col.AddChild(UiChrome.Text("Ledger", 26, UiChrome.Bold, UiChrome.Ink));
        col.AddChild(UiChrome.Text("Cut runestones into the hearth.", 13, UiChrome.Regular, new Color(0.28f, 0.18f, 0.10f), true));

        var scroll = new ScrollContainer
        {
            SizeFlagsVertical = SizeFlags.ExpandFill,
            HorizontalScrollMode = ScrollContainer.ScrollMode.Disabled
        };
        _ledger = new VBoxContainer { SizeFlagsHorizontal = SizeFlags.ExpandFill };
        _ledger.AddThemeConstantOverride("separation", 4);
        scroll.AddChild(_ledger);
        col.AddChild(scroll);
        AddChild(col);
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
            var row = new Button
            {
                Text = $"{node.Name}   ·   {node.Cost}",
                Flat = true,
                Disabled = !can,
                AutowrapMode = TextServer.AutowrapMode.Word,
                CustomMinimumSize = new Vector2(0, 36),
                SizeFlagsHorizontal = SizeFlags.ExpandFill,
                Alignment = HorizontalAlignment.Left
            };
            row.AddThemeFontOverride("font", UiChrome.Regular);
            row.AddThemeFontSizeOverride("font_size", 16);
            row.AddThemeColorOverride("font_color", can ? new Color(0.10f, 0.07f, 0.04f) : new Color(0.40f, 0.32f, 0.22f));
            row.AddThemeStyleboxOverride("normal", UiChrome.GhostBox());
            row.AddThemeStyleboxOverride("hover", UiChrome.GhostBox());
            row.AddThemeStyleboxOverride("pressed", UiChrome.GhostBox());
            row.AddThemeStyleboxOverride("disabled", UiChrome.GhostBox());
            row.Pressed += () => Buy?.Invoke(id);
            _ledger.AddChild(row);
        }
    }
}

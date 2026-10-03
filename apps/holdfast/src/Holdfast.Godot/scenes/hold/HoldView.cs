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
    private Control _runesmith = null!;

    public override void _Ready()
    {
        SetAnchorsAndOffsetsPreset(LayoutPreset.FullRect);
        MouseFilter = MouseFilterEnum.Stop;

        AddChild(UiChrome.Cover("res://art-bible/hold-hearth.jpg"));

        var title = UiChrome.Text("HOLDFAST", 40, UiChrome.Bold, UiChrome.Gold);
        title.SetAnchorsPreset(LayoutPreset.TopLeft);
        title.OffsetLeft = 36;
        title.OffsetTop = 22;
        title.OffsetRight = 400;
        title.OffsetBottom = 68;
        AddChild(title);

        _stones = UiChrome.Text("", 16, UiChrome.Regular, UiChrome.Muted);
        _stones.SetAnchorsPreset(LayoutPreset.TopLeft);
        _stones.OffsetLeft = 38;
        _stones.OffsetTop = 66;
        _stones.OffsetRight = 460;
        _stones.OffsetBottom = 90;
        AddChild(_stones);

        var peek = new Button { Text = "Peek", Flat = true };
        peek.AddThemeFontOverride("font", UiChrome.Regular);
        peek.AddThemeFontSizeOverride("font_size", 14);
        peek.AddThemeColorOverride("font_color", UiChrome.Muted);
        peek.AddThemeStyleboxOverride("normal", UiChrome.GhostBox());
        peek.AddThemeStyleboxOverride("hover", UiChrome.GhostBox());
        peek.AddThemeStyleboxOverride("pressed", UiChrome.GhostBox());
        peek.SetAnchorsPreset(LayoutPreset.TopLeft);
        peek.OffsetLeft = 38;
        peek.OffsetTop = 90;
        peek.OffsetRight = 100;
        peek.OffsetBottom = 112;
        peek.Pressed += () => Peek?.Invoke();
        AddChild(peek);

        var door = new Button
        {
            Text = "Walk as Warrior",
            CustomMinimumSize = new Vector2(220, 56)
        };
        door.AddThemeFontOverride("font", UiChrome.Bold);
        door.AddThemeFontSizeOverride("font_size", 18);
        door.AddThemeColorOverride("font_color", UiChrome.Gold);
        door.AddThemeStyleboxOverride("normal", UiChrome.StoneBox(new Color(0.06f, 0.04f, 0.03f, 0.72f)));
        door.AddThemeStyleboxOverride("hover", UiChrome.StoneBox(new Color(0.14f, 0.10f, 0.06f, 0.86f)));
        door.AddThemeStyleboxOverride("pressed", UiChrome.StoneBox());
        door.SetAnchorsPreset(LayoutPreset.CenterRight);
        door.OffsetLeft = -280;
        door.OffsetTop = -20;
        door.OffsetRight = -40;
        door.OffsetBottom = 40;
        door.Pressed += () => Walk?.Invoke(ClassId.Warrior);
        AddChild(door);

        _runesmith = new Button
        {
            Text = "Walk as Runesmith",
            CustomMinimumSize = new Vector2(220, 48)
        };
        var runeBtn = (Button)_runesmith;
        runeBtn.AddThemeFontOverride("font", UiChrome.Bold);
        runeBtn.AddThemeFontSizeOverride("font_size", 16);
        runeBtn.AddThemeColorOverride("font_color", UiChrome.Gold);
        runeBtn.AddThemeStyleboxOverride("normal", UiChrome.StoneBox(new Color(0.06f, 0.04f, 0.03f, 0.72f)));
        runeBtn.AddThemeStyleboxOverride("hover", UiChrome.StoneBox(new Color(0.14f, 0.10f, 0.06f, 0.86f)));
        runeBtn.SetAnchorsPreset(LayoutPreset.CenterRight);
        runeBtn.OffsetLeft = -280;
        runeBtn.OffsetTop = 48;
        runeBtn.OffsetRight = -40;
        runeBtn.OffsetBottom = 96;
        runeBtn.Pressed += () => Walk?.Invoke(ClassId.Runesmith);
        runeBtn.Visible = false;
        AddChild(_runesmith);

        var book = new TextureRect
        {
            Texture = GD.Load<Texture2D>("res://art/ledger-book.jpg"),
            ExpandMode = TextureRect.ExpandModeEnum.IgnoreSize,
            StretchMode = TextureRect.StretchModeEnum.KeepAspectCentered,
            MouseFilter = MouseFilterEnum.Ignore
        };
        book.SetAnchorsPreset(LayoutPreset.BottomLeft);
        book.OffsetLeft = 36;
        book.OffsetTop = -250;
        book.OffsetRight = 220;
        book.OffsetBottom = -20;
        AddChild(book);

        var list = new VBoxContainer();
        list.SetAnchorsPreset(LayoutPreset.BottomLeft);
        list.OffsetLeft = 230;
        list.OffsetTop = -250;
        list.OffsetRight = 520;
        list.OffsetBottom = -24;
        list.AddThemeConstantOverride("separation", 4);
        list.AddChild(UiChrome.Text("Ledger", 18, UiChrome.Bold, UiChrome.Gold));
        var scroll = new ScrollContainer
        {
            SizeFlagsVertical = SizeFlags.ExpandFill,
            HorizontalScrollMode = ScrollContainer.ScrollMode.Disabled
        };
        _ledger = new VBoxContainer { SizeFlagsHorizontal = SizeFlags.ExpandFill };
        _ledger.AddThemeConstantOverride("separation", 3);
        scroll.AddChild(_ledger);
        list.AddChild(scroll);
        AddChild(list);
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
                Text = $"{node.Name}  ·  {node.Cost}",
                Flat = true,
                Disabled = !can,
                Alignment = HorizontalAlignment.Left,
                CustomMinimumSize = new Vector2(0, 28)
            };
            row.AddThemeFontOverride("font", UiChrome.Regular);
            row.AddThemeFontSizeOverride("font_size", 15);
            row.AddThemeColorOverride("font_color", can ? UiChrome.Gold : UiChrome.Muted);
            row.AddThemeStyleboxOverride("normal", UiChrome.GhostBox());
            row.AddThemeStyleboxOverride("hover", UiChrome.GhostBox());
            row.AddThemeStyleboxOverride("pressed", UiChrome.GhostBox());
            row.AddThemeStyleboxOverride("disabled", UiChrome.GhostBox());
            row.Pressed += () => Buy?.Invoke(id);
            _ledger.AddChild(row);
        }
    }
}

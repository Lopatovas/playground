using Godot;
using Holdfast.Application.Run;
using Holdfast.Domain.Actors;
using Holdfast.Domain.Combat;

namespace Holdfast.GodotGame;

public partial class FightView : Control
{
    public event Action<int>? PlayCard;
    public event Action? EndTurn;

    private ActorPlate _dwarf = null!;
    private ActorPlate _enemy = null!;
    private Label _banner = null!;
    private Label _strip = null!;
    private HBoxContainer _hand = null!;
    private PackedScene _cardScene = null!;

    public override void _Ready()
    {
        SetAnchorsAndOffsetsPreset(LayoutPreset.FullRect);
        MouseFilter = MouseFilterEnum.Stop;
        _cardScene = GD.Load<PackedScene>("res://scenes/fight/CardPlate.tscn");

        var bg = new TextureRect
        {
            Texture = UiChrome.StageTexture("res://art/fight-cavern.jpg", 0.32f, 0.52f),
            ExpandMode = TextureRect.ExpandModeEnum.IgnoreSize,
            StretchMode = TextureRect.StretchModeEnum.KeepAspectCovered,
            MouseFilter = MouseFilterEnum.Ignore
        };
        bg.SetAnchorsAndOffsetsPreset(LayoutPreset.FullRect);
        AddChild(bg);

        var dim = new ColorRect
        {
            Color = new Color(0.02f, 0.015f, 0.01f, 0.18f),
            MouseFilter = MouseFilterEnum.Ignore
        };
        dim.SetAnchorsAndOffsetsPreset(LayoutPreset.FullRect);
        AddChild(dim);

        _dwarf = new ActorPlate();
        _dwarf.SetAnchorsPreset(LayoutPreset.BottomLeft);
        _dwarf.OffsetLeft = 32;
        _dwarf.OffsetTop = -640;
        _dwarf.OffsetRight = 420;
        _dwarf.OffsetBottom = -196;
        AddChild(_dwarf);

        _enemy = new ActorPlate();
        _enemy.SetAnchorsPreset(LayoutPreset.BottomRight);
        _enemy.OffsetLeft = -420;
        _enemy.OffsetTop = -640;
        _enemy.OffsetRight = -32;
        _enemy.OffsetBottom = -196;
        AddChild(_enemy);

        _strip = UiChrome.Text("", 18, UiChrome.Bold, UiChrome.Gold);
        _strip.SetAnchorsPreset(LayoutPreset.TopWide);
        _strip.OffsetLeft = 36;
        _strip.OffsetTop = 16;
        _strip.OffsetRight = -36;
        _strip.OffsetBottom = 44;
        AddChild(_strip);

        _banner = UiChrome.Text("", 16, UiChrome.Regular, UiChrome.Muted, true);
        _banner.HorizontalAlignment = HorizontalAlignment.Center;
        _banner.SetAnchorsPreset(LayoutPreset.CenterTop);
        _banner.OffsetLeft = -280;
        _banner.OffsetTop = 48;
        _banner.OffsetRight = 280;
        _banner.OffsetBottom = 88;
        AddChild(_banner);

        var tray = new PanelContainer();
        tray.SetAnchorsPreset(LayoutPreset.BottomWide);
        tray.OffsetLeft = 24;
        tray.OffsetTop = -196;
        tray.OffsetRight = -24;
        tray.OffsetBottom = -16;
        tray.AddThemeStyleboxOverride("panel", UiChrome.StoneBox(new Color(0.05f, 0.04f, 0.03f, 0.72f)));

        var row = new HBoxContainer();
        row.AddThemeConstantOverride("separation", 10);
        var scroll = new ScrollContainer
        {
            SizeFlagsHorizontal = SizeFlags.ExpandFill,
            SizeFlagsVertical = SizeFlags.ExpandFill,
            VerticalScrollMode = ScrollContainer.ScrollMode.Disabled
        };
        _hand = new HBoxContainer { SizeFlagsVertical = SizeFlags.ShrinkEnd };
        _hand.AddThemeConstantOverride("separation", 8);
        scroll.AddChild(_hand);
        row.AddChild(scroll);

        var endCol = new VBoxContainer
        {
            Alignment = BoxContainer.AlignmentMode.Center,
            SizeFlagsHorizontal = SizeFlags.ShrinkEnd,
            SizeFlagsVertical = SizeFlags.ExpandFill
        };
        var end = UiChrome.StoneButton("End turn", () => EndTurn?.Invoke());
        end.CustomMinimumSize = new Vector2(128, 52);
        end.SizeFlagsHorizontal = SizeFlags.ShrinkCenter;
        endCol.AddChild(end);
        row.AddChild(endCol);
        tray.AddChild(row);
        AddChild(tray);
    }

    public void Bind(RunState run, Encounter fight, string banner)
    {
        var dwarfPath = run.Class == ClassId.Warrior
            ? "res://art-bible/warrior.jpg"
            : "res://art-bible/runesmith.jpg";
        _dwarf.Bind(run.Dwarf, dwarfPath, null);

        var foe = fight.Enemies.FirstOrDefault(e => !e.IsDead) ?? fight.Enemies[0];
        _enemy.Bind(foe, "res://art-bible/enemy-knuckle.jpg", foe.IsDead ? "Down" : $"Intent  {foe.Intent?.Label ?? "-"}");

        _strip.Text = $"Energy  {run.Dwarf.Energy} / {run.Dwarf.MaxEnergy}     Block  {run.Dwarf.Block}     Grit  {run.Dwarf.Grit}     Might  {run.Dwarf.Might}";
        _banner.Text = banner;

        foreach (var child in _hand.GetChildren())
        {
            _hand.RemoveChild(child);
            child.QueueFree();
        }

        for (var i = 0; i < fight.Dwarf.Deck.Hand.Count; i++)
        {
            var card = _cardScene.Instantiate<CardPlate>();
            _hand.AddChild(card);
            var idx = i;
            card.Bind(idx, fight.Dwarf.Deck.Hand[i], fight.Dwarf.Deck.Hand[i].Cost <= fight.Dwarf.Energy);
            card.Chosen += handIndex => PlayCard?.Invoke(handIndex);
        }
    }
}

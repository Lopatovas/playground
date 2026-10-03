using Godot;
using Holdfast.Domain.Actors;

namespace Holdfast.GodotGame;

public partial class ActorPlate : Control
{
    private TextureRect _portrait = null!;
    private Label _name = null!;
    private Label _intent = null!;
    private ColorRect _hpFill = null!;
    private Label _hp = null!;
    private Label _block = null!;

    public override void _Ready()
    {
        CustomMinimumSize = new Vector2(220, 320);
        MouseFilter = MouseFilterEnum.Ignore;

        var stack = new VBoxContainer
        {
            Alignment = BoxContainer.AlignmentMode.End
        };
        stack.SetAnchorsAndOffsetsPreset(LayoutPreset.FullRect);
        stack.AddThemeConstantOverride("separation", 6);

        _intent = UiChrome.Text("", 16, UiChrome.Bold, UiChrome.Gold, true);
        _intent.HorizontalAlignment = HorizontalAlignment.Center;

        _portrait = new TextureRect
        {
            ExpandMode = TextureRect.ExpandModeEnum.IgnoreSize,
            StretchMode = TextureRect.StretchModeEnum.KeepAspectCovered,
            CustomMinimumSize = new Vector2(220, 240),
            SizeFlagsHorizontal = SizeFlags.ShrinkCenter,
            SizeFlagsVertical = SizeFlags.ExpandFill,
            MouseFilter = MouseFilterEnum.Ignore
        };

        var rim = new PanelContainer();
        rim.AddThemeStyleboxOverride("panel", UiChrome.StoneBox(new Color(0.07f, 0.05f, 0.04f, 0.55f)));
        rim.AddChild(_portrait);

        _name = UiChrome.Text("", 20, UiChrome.Bold, UiChrome.Gold);
        _name.HorizontalAlignment = HorizontalAlignment.Center;

        var bar = new Control { CustomMinimumSize = new Vector2(0, 14) };
        var hpBack = new ColorRect { Color = new Color(0.12f, 0.06f, 0.05f, 0.95f) };
        hpBack.SetAnchorsAndOffsetsPreset(LayoutPreset.FullRect);
        _hpFill = new ColorRect { Color = UiChrome.Blood };
        _hpFill.SetAnchorsPreset(LayoutPreset.LeftWide);
        bar.AddChild(hpBack);
        bar.AddChild(_hpFill);

        _hp = UiChrome.Text("", 14, UiChrome.Regular, UiChrome.Muted);
        _hp.HorizontalAlignment = HorizontalAlignment.Center;
        _block = UiChrome.Text("", 14, UiChrome.Regular, UiChrome.Gold);
        _block.HorizontalAlignment = HorizontalAlignment.Center;

        stack.AddChild(_intent);
        stack.AddChild(rim);
        stack.AddChild(_name);
        stack.AddChild(bar);
        stack.AddChild(_hp);
        stack.AddChild(_block);
        AddChild(stack);
    }

    public void Bind(Actor actor, string portraitPath, string? intent)
    {
        _portrait.Texture = GD.Load<Texture2D>(portraitPath);
        _name.Text = actor.Name;
        _intent.Text = string.IsNullOrEmpty(intent) ? " " : intent;
        _intent.Visible = !string.IsNullOrEmpty(intent);
        var ratio = actor.MaxHp <= 0 ? 0 : (float)actor.Hp / actor.MaxHp;
        _hpFill.AnchorRight = Mathf.Clamp(ratio, 0, 1);
        _hp.Text = $"{actor.Hp} / {actor.MaxHp}";
        _block.Text = actor.Block > 0 ? $"Block {actor.Block}" : " ";
        Modulate = actor.IsDead ? new Color(0.45f, 0.4f, 0.38f) : Colors.White;
    }
}

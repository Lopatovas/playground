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

    public override void _Ready()
    {
        MouseFilter = MouseFilterEnum.Ignore;

        _intent = UiChrome.Text("", 15, UiChrome.Bold, UiChrome.Gold);
        _intent.HorizontalAlignment = HorizontalAlignment.Center;
        _intent.SetAnchorsPreset(LayoutPreset.TopWide);
        _intent.OffsetTop = 0;
        _intent.OffsetBottom = 22;

        _portrait = new TextureRect
        {
            ExpandMode = TextureRect.ExpandModeEnum.IgnoreSize,
            StretchMode = TextureRect.StretchModeEnum.KeepAspectCovered,
            MouseFilter = MouseFilterEnum.Ignore
        };
        _portrait.SetAnchorsPreset(LayoutPreset.FullRect);
        _portrait.OffsetTop = 26;
        _portrait.OffsetBottom = -36;

        var shade = new ColorRect
        {
            Color = new Color(0.02f, 0.015f, 0.01f, 0.62f),
            MouseFilter = MouseFilterEnum.Ignore
        };
        shade.SetAnchorsPreset(LayoutPreset.BottomWide);
        shade.OffsetTop = -78;
        shade.OffsetBottom = -36;

        _name = UiChrome.Text("", 20, UiChrome.Bold, UiChrome.Gold);
        _name.HorizontalAlignment = HorizontalAlignment.Center;
        _name.SetAnchorsPreset(LayoutPreset.BottomWide);
        _name.OffsetTop = -74;
        _name.OffsetBottom = -50;

        var bar = new Control { MouseFilter = MouseFilterEnum.Ignore };
        bar.SetAnchorsPreset(LayoutPreset.BottomWide);
        bar.OffsetLeft = 18;
        bar.OffsetRight = -18;
        bar.OffsetTop = -46;
        bar.OffsetBottom = -38;
        var hpBack = new ColorRect { Color = new Color(0.08f, 0.03f, 0.03f, 0.9f), MouseFilter = MouseFilterEnum.Ignore };
        hpBack.SetAnchorsAndOffsetsPreset(LayoutPreset.FullRect);
        _hpFill = new ColorRect { Color = UiChrome.Blood, MouseFilter = MouseFilterEnum.Ignore };
        _hpFill.SetAnchorsPreset(LayoutPreset.LeftWide);
        bar.AddChild(hpBack);
        bar.AddChild(_hpFill);

        _hp = UiChrome.Text("", 13, UiChrome.Regular, UiChrome.Muted);
        _hp.HorizontalAlignment = HorizontalAlignment.Center;
        _hp.SetAnchorsPreset(LayoutPreset.BottomWide);
        _hp.OffsetTop = -34;
        _hp.OffsetBottom = -12;

        AddChild(_portrait);
        AddChild(shade);
        AddChild(_intent);
        AddChild(_name);
        AddChild(bar);
        AddChild(_hp);
    }

    public void Bind(Actor actor, string portraitPath, string? intent)
    {
        _portrait.Texture = GD.Load<Texture2D>(portraitPath);
        _name.Text = actor.Name;
        _intent.Text = intent ?? "";
        _intent.Visible = !string.IsNullOrEmpty(intent);
        var ratio = actor.MaxHp <= 0 ? 0 : (float)actor.Hp / actor.MaxHp;
        _hpFill.AnchorRight = Mathf.Clamp(ratio, 0, 1);
        _hp.Text = actor.Block > 0 ? $"{actor.Hp} / {actor.MaxHp}   Block {actor.Block}" : $"{actor.Hp} / {actor.MaxHp}";
        Modulate = actor.IsDead ? new Color(0.45f, 0.4f, 0.38f) : Colors.White;
    }
}

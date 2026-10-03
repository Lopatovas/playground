using Godot;
using Holdfast.Domain.Actors;

namespace Holdfast.GodotGame;

public partial class ActorPlate : Control
{
    private TextureRect _body = null!;
    private Label _name = null!;
    private Label _intent = null!;
    private ColorRect _hpFill = null!;
    private Label _hp = null!;
    private Tween? _idle;
    private bool _facesRight;

    public override void _Ready()
    {
        MouseFilter = MouseFilterEnum.Ignore;

        _intent = UiChrome.Text("", 16, UiChrome.Bold, UiChrome.Gold);
        _intent.HorizontalAlignment = HorizontalAlignment.Center;
        _intent.SetAnchorsPreset(LayoutPreset.TopWide);
        _intent.OffsetTop = 0;
        _intent.OffsetBottom = 22;

        _body = new TextureRect
        {
            ExpandMode = TextureRect.ExpandModeEnum.IgnoreSize,
            StretchMode = TextureRect.StretchModeEnum.KeepAspectCentered,
            MouseFilter = MouseFilterEnum.Ignore
        };
        _body.SetAnchorsPreset(LayoutPreset.FullRect);
        _body.OffsetTop = 24;
        _body.OffsetBottom = -40;

        _name = UiChrome.Text("", 18, UiChrome.Bold, UiChrome.Gold);
        _name.HorizontalAlignment = HorizontalAlignment.Center;
        _name.SetAnchorsPreset(LayoutPreset.BottomWide);
        _name.OffsetTop = -38;
        _name.OffsetBottom = -18;

        var bar = new Control { MouseFilter = MouseFilterEnum.Ignore };
        bar.SetAnchorsPreset(LayoutPreset.BottomWide);
        bar.OffsetLeft = 24;
        bar.OffsetRight = -24;
        bar.OffsetTop = -16;
        bar.OffsetBottom = -8;
        var hpBack = new ColorRect { Color = new Color(0.08f, 0.03f, 0.03f, 0.9f), MouseFilter = MouseFilterEnum.Ignore };
        hpBack.SetAnchorsAndOffsetsPreset(LayoutPreset.FullRect);
        _hpFill = new ColorRect { Color = UiChrome.Blood, MouseFilter = MouseFilterEnum.Ignore };
        _hpFill.SetAnchorsPreset(LayoutPreset.LeftWide);
        bar.AddChild(hpBack);
        bar.AddChild(_hpFill);

        _hp = UiChrome.Text("", 12, UiChrome.Regular, UiChrome.Muted);
        _hp.HorizontalAlignment = HorizontalAlignment.Center;
        _hp.SetAnchorsPreset(LayoutPreset.BottomWide);
        _hp.OffsetTop = -8;
        _hp.OffsetBottom = 10;

        AddChild(_body);
        AddChild(_intent);
        AddChild(_name);
        AddChild(bar);
        AddChild(_hp);
        StartIdle();
    }

    public void Bind(Actor actor, string bodyPath, string? intent, bool facesRight)
    {
        _facesRight = facesRight;
        _body.Texture = GD.Load<Texture2D>(bodyPath);
        _name.Text = actor.Name;
        _intent.Text = intent ?? "";
        _intent.Visible = !string.IsNullOrEmpty(intent);
        var ratio = actor.MaxHp <= 0 ? 0 : (float)actor.Hp / actor.MaxHp;
        _hpFill.AnchorRight = Mathf.Clamp(ratio, 0, 1);
        _hp.Text = actor.Block > 0 ? $"{actor.Hp} / {actor.MaxHp}   Block {actor.Block}" : $"{actor.Hp} / {actor.MaxHp}";
        Modulate = actor.IsDead ? new Color(0.45f, 0.4f, 0.38f) : Colors.White;
    }

    public void StartIdle()
    {
        _idle?.Kill();
        _idle = CreateTween().SetLoops();
        _idle.TweenProperty(_body, "position:y", -8, 1.15)
            .SetTrans(Tween.TransitionType.Sine)
            .SetEase(Tween.EaseType.InOut);
        _idle.TweenProperty(_body, "position:y", 4, 1.15)
            .SetTrans(Tween.TransitionType.Sine)
            .SetEase(Tween.EaseType.InOut);
    }

    public void Strike()
    {
        Burst(_facesRight ? 56f : -56f, 0.16f, 0.22f);
    }

    public void Guard()
    {
        _idle?.Kill();
        var tw = CreateTween();
        tw.TweenProperty(_body, "scale", new Vector2(1.06f, 0.94f), 0.12);
        tw.TweenProperty(_body, "scale", Vector2.One, 0.18);
        tw.Finished += StartIdle;
    }

    public void Flinch()
    {
        Burst(_facesRight ? -28f : 28f, 0.08f, 0.16f);
        var flash = CreateTween();
        flash.TweenProperty(_body, "modulate", new Color(1, 0.55f, 0.45f), 0.06);
        flash.TweenProperty(_body, "modulate", Colors.White, 0.18);
    }

    private void Burst(float x, float outTime, float backTime)
    {
        _idle?.Kill();
        var tw = CreateTween();
        tw.TweenProperty(_body, "position:x", x, outTime).SetTrans(Tween.TransitionType.Back);
        tw.TweenProperty(_body, "position:x", 0, backTime).SetTrans(Tween.TransitionType.Sine);
        tw.Finished += StartIdle;
    }
}

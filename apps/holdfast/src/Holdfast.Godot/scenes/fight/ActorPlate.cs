using Godot;
using Holdfast.Domain.Actors;

namespace Holdfast.GodotGame;

public partial class ActorPlate : Control
{
    private Sprite2D _sprite = null!;
    private Label _name = null!;
    private Label _intent = null!;
    private ColorRect _hpFill = null!;
    private Label _hp = null!;
    private Tween? _idle;
    private bool _facesRight;
    private Vector2 _rest;

    public override void _Ready()
    {
        MouseFilter = MouseFilterEnum.Ignore;

        _intent = UiChrome.Text("", 16, UiChrome.Bold, UiChrome.Gold);
        _intent.HorizontalAlignment = HorizontalAlignment.Center;
        _intent.SetAnchorsPreset(LayoutPreset.TopWide);
        _intent.OffsetTop = 0;
        _intent.OffsetBottom = 22;

        _sprite = new Sprite2D
        {
            Centered = true,
            Scale = new Vector2(0.42f, 0.42f)
        };
        AddChild(_sprite);

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

        AddChild(_intent);
        AddChild(_name);
        AddChild(bar);
        AddChild(_hp);
        Reseat();
        StartIdle();
    }

    public override void _Notification(int what)
    {
        if (what == NotificationResized)
        {
            Reseat();
        }
    }

    public void Bind(Actor actor, string bodyPath, string? intent, bool facesRight)
    {
        _facesRight = facesRight;
        _sprite.Texture = GD.Load<Texture2D>(bodyPath);
        _name.Text = actor.Name;
        _intent.Text = intent ?? "";
        _intent.Visible = !string.IsNullOrEmpty(intent);
        var ratio = actor.MaxHp <= 0 ? 0 : (float)actor.Hp / actor.MaxHp;
        _hpFill.AnchorRight = Mathf.Clamp(ratio, 0, 1);
        _hp.Text = actor.Block > 0 ? $"{actor.Hp} / {actor.MaxHp}   Block {actor.Block}" : $"{actor.Hp} / {actor.MaxHp}";
        Modulate = actor.IsDead ? new Color(0.45f, 0.4f, 0.38f) : Colors.White;
        Reseat();
        StartIdle();
    }

    public void StartIdle()
    {
        _idle?.Kill();
        Reseat();
        _idle = CreateTween().SetLoops();
        _idle.TweenProperty(_sprite, "position:y", _rest.Y - 10, 0.9f)
            .SetTrans(Tween.TransitionType.Sine)
            .SetEase(Tween.EaseType.InOut);
        _idle.TweenProperty(_sprite, "position:y", _rest.Y + 6, 0.9f)
            .SetTrans(Tween.TransitionType.Sine)
            .SetEase(Tween.EaseType.InOut);
    }

    public void Strike()
    {
        Burst(_facesRight ? 90f : -90f, 0.22f, 0.28f);
    }

    public void Guard()
    {
        _idle?.Kill();
        var tw = CreateTween();
        tw.TweenProperty(_sprite, "scale", new Vector2(0.48f, 0.38f), 0.14);
        tw.TweenProperty(_sprite, "scale", new Vector2(0.42f, 0.42f), 0.2);
        tw.Finished += StartIdle;
    }

    public void Flinch()
    {
        Burst(_facesRight ? -36f : 36f, 0.1f, 0.2f);
        var flash = CreateTween();
        flash.TweenProperty(_sprite, "modulate", new Color(1, 0.5f, 0.42f), 0.08);
        flash.TweenProperty(_sprite, "modulate", Colors.White, 0.22);
    }

    private void Burst(float x, float outTime, float backTime)
    {
        _idle?.Kill();
        Reseat();
        var tw = CreateTween();
        tw.TweenProperty(_sprite, "position:x", _rest.X + x, outTime).SetTrans(Tween.TransitionType.Back);
        tw.TweenProperty(_sprite, "position:x", _rest.X, backTime).SetTrans(Tween.TransitionType.Sine);
        tw.Finished += StartIdle;
    }

    private void Reseat()
    {
        _rest = new Vector2(Size.X * 0.5f, Size.Y * 0.46f);
        if (_sprite is not null)
        {
            _sprite.Position = _rest;
        }
    }
}

using Godot;
using Holdfast.Domain.Actors;

namespace Holdfast.GodotGame;

public partial class ActorPlate : Control
{
    private Sprite2D _body = null!;
    private Label _name = null!;
    private Label _intent = null!;
    private ColorRect _hpFill = null!;
    private Label _hp = null!;
    private Tween? _idle;
    private bool _facesRight;
    private Vector2 _rest;
    private bool _seated;

    public override void _Ready()
    {
        MouseFilter = MouseFilterEnum.Ignore;
        ClipContents = false;

        _intent = UiChrome.Text("", 16, UiChrome.Bold, UiChrome.Gold);
        _intent.HorizontalAlignment = HorizontalAlignment.Center;
        _intent.SetAnchorsPreset(LayoutPreset.TopWide);
        _intent.OffsetTop = 0;
        _intent.OffsetBottom = 22;

        _body = new Sprite2D
        {
            Centered = true,
            Scale = new Vector2(0.38f, 0.38f)
        };
        AddChild(_body);

        _name = UiChrome.Text("", 18, UiChrome.Bold, UiChrome.Gold);
        _name.HorizontalAlignment = HorizontalAlignment.Center;
        _name.SetAnchorsPreset(LayoutPreset.BottomWide);
        _name.OffsetTop = -38;
        _name.OffsetBottom = -18;

        var bar = new Control { MouseFilter = MouseFilterEnum.Ignore };
        bar.SetAnchorsPreset(LayoutPreset.BottomWide);
        bar.OffsetLeft = 36;
        bar.OffsetRight = -36;
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
    }

    public void Bind(Actor actor, PaintedPuppet.Kind kind, string? intent, bool facesRight)
    {
        _facesRight = facesRight;
        _body.Texture = GD.Load<Texture2D>(kind == PaintedPuppet.Kind.Warrior
            ? "res://art/puppets/warrior.png"
            : "res://art/puppets/enemy.png");
        _name.Text = actor.Name;
        _intent.Text = intent ?? "";
        _intent.Visible = !string.IsNullOrEmpty(intent);
        var ratio = actor.MaxHp <= 0 ? 0 : (float)actor.Hp / actor.MaxHp;
        _hpFill.AnchorRight = Mathf.Clamp(ratio, 0, 1);
        _hp.Text = actor.Block > 0 ? $"{actor.Hp} / {actor.MaxHp}   Block {actor.Block}" : $"{actor.Hp} / {actor.MaxHp}";
        Modulate = actor.IsDead ? new Color(0.45f, 0.4f, 0.38f) : Colors.White;
        if (!_seated)
        {
            CallDeferred(MethodName.Seat);
        }
    }

    public void Strike()
    {
        _idle?.Kill();
        var tw = CreateTween();
        tw.TweenProperty(_body, "position:x", _rest.X + (_facesRight ? 48 : -48), 0.16f).SetTrans(Tween.TransitionType.Back);
        tw.Parallel().TweenProperty(_body, "rotation", _facesRight ? 0.12f : -0.12f, 0.16f);
        tw.TweenProperty(_body, "position:x", _rest.X, 0.22f);
        tw.Parallel().TweenProperty(_body, "rotation", 0f, 0.22f);
        tw.Finished += StartIdle;
    }

    public void Guard()
    {
        _idle?.Kill();
        var tw = CreateTween();
        tw.TweenProperty(_body, "scale", new Vector2(0.42f, 0.34f), 0.12f);
        tw.TweenProperty(_body, "scale", new Vector2(0.38f, 0.38f), 0.18f);
        tw.Finished += StartIdle;
    }

    public void Flinch()
    {
        _idle?.Kill();
        var tw = CreateTween();
        tw.TweenProperty(_body, "position:x", _rest.X + (_facesRight ? -22 : 22), 0.08f);
        tw.Parallel().TweenProperty(_body, "modulate", new Color(1, 0.55f, 0.48f), 0.08f);
        tw.TweenProperty(_body, "position:x", _rest.X, 0.16f);
        tw.Parallel().TweenProperty(_body, "modulate", Colors.White, 0.16f);
        tw.Finished += StartIdle;
    }

    private void Seat()
    {
        _rest = new Vector2(Size.X * 0.5f, Size.Y * 0.48f);
        _body.Position = _rest;
        _seated = true;
        StartIdle();
    }

    private void StartIdle()
    {
        _idle?.Kill();
        _idle = CreateTween().SetLoops();
        _idle.TweenProperty(_body, "position:y", _rest.Y - 8, 0.95f)
            .SetTrans(Tween.TransitionType.Sine)
            .SetEase(Tween.EaseType.InOut);
        _idle.TweenProperty(_body, "position:y", _rest.Y + 5, 0.95f)
            .SetTrans(Tween.TransitionType.Sine)
            .SetEase(Tween.EaseType.InOut);
    }
}

using Godot;
using Holdfast.Domain.Actors;

namespace Holdfast.GodotGame;

public partial class ActorPlate : Control
{
    private PaintedPuppet _puppet = null!;
    private Label _name = null!;
    private Label _intent = null!;
    private ColorRect _hpFill = null!;
    private Label _hp = null!;
    private PaintedPuppet.Kind _kind;
    private bool _built;

    public override void _Ready()
    {
        MouseFilter = MouseFilterEnum.Ignore;
        ClipContents = false;

        _intent = UiChrome.Text("", 16, UiChrome.Bold, UiChrome.Gold);
        _intent.HorizontalAlignment = HorizontalAlignment.Center;
        _intent.SetAnchorsPreset(LayoutPreset.TopWide);
        _intent.OffsetTop = 0;
        _intent.OffsetBottom = 22;

        _puppet = new PaintedPuppet();
        AddChild(_puppet);

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
        Resized += SeatPuppet;
    }

    public void Bind(Actor actor, PaintedPuppet.Kind kind, string? intent, bool facesRight)
    {
        _kind = kind;
        if (!_built)
        {
            _puppet.Build(kind, facesRight);
            _built = true;
            CallDeferred(MethodName.SeatPuppet);
        }

        _name.Text = actor.Name;
        _intent.Text = intent ?? "";
        _intent.Visible = !string.IsNullOrEmpty(intent);
        var ratio = actor.MaxHp <= 0 ? 0 : (float)actor.Hp / actor.MaxHp;
        _hpFill.AnchorRight = Mathf.Clamp(ratio, 0, 1);
        _hp.Text = actor.Block > 0 ? $"{actor.Hp} / {actor.MaxHp}   Block {actor.Block}" : $"{actor.Hp} / {actor.MaxHp}";
        Modulate = actor.IsDead ? new Color(0.45f, 0.4f, 0.38f) : Colors.White;
    }

    public void Strike() => _puppet.Strike();

    public void Guard() => _puppet.Guard();

    public void Flinch() => _puppet.Flinch();

    private void SeatPuppet()
    {
        if (_puppet is null)
        {
            return;
        }

        _puppet.RestAt(new Vector2(Size.X * 0.5f, Size.Y * 0.62f));
    }
}

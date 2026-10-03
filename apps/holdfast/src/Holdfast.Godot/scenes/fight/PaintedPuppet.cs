using Godot;

namespace Holdfast.GodotGame;

public partial class PaintedPuppet : Node2D
{
    public enum Kind
    {
        Warrior,
        Knuckle
    }

    private Node2D _hip = null!;
    private Node2D _torso = null!;
    private Node2D _head = null!;
    private Node2D _armNear = null!;
    private Node2D _armFar = null!;
    private Node2D _legNear = null!;
    private Node2D _legFar = null!;
    private readonly List<Tween> _idle = [];
    private bool _facesRight = true;
    private Kind _kind;
    private float _restX;

    public void Build(Kind kind, bool facesRight)
    {
        foreach (var child in GetChildren())
        {
            child.QueueFree();
        }

        _kind = kind;
        _facesRight = facesRight;
        _hip = Bone("hip");
        _torso = Bone("torso");
        _head = Bone("head");
        _armFar = Bone("armFar");
        _armNear = Bone("armNear");
        _legFar = Bone("legFar");
        _legNear = Bone("legNear");
        AddChild(_hip);
        _hip.AddChild(_legFar);
        _hip.AddChild(_legNear);
        _hip.AddChild(_torso);
        _torso.AddChild(_armFar);
        _torso.AddChild(_head);
        _torso.AddChild(_armNear);

        if (kind == Kind.Warrior)
        {
            Place(_torso, 0, -6);
            Place(_head, 2, -78);
            Place(_armFar, 40, -36);
            Place(_armNear, -42, -28);
            Place(_legFar, 20, 10);
            Place(_legNear, -20, 12);
            Attach(_legFar, "res://art/puppets/w-legr.png", 110, 18);
            Attach(_legNear, "res://art/puppets/w-legl.png", 100, 18);
            Attach(_torso, "res://art/puppets/w-torso.png", 185, 390);
            Attach(_armFar, "res://art/puppets/w-off.png", 36, 28);
            Attach(_head, "res://art/puppets/w-head.png", 150, 328);
            Attach(_armNear, "res://art/puppets/w-axe.png", 318, 72);
        }
        else
        {
            Place(_torso, 0, -10);
            Place(_head, 0, -70);
            Place(_armFar, 52, -12);
            Place(_armNear, -18, 14);
            Place(_legFar, 16, 18);
            Place(_legNear, -12, 20);
            Attach(_legFar, "res://art/puppets/e-leg.png", 140, 16);
            Attach(_legNear, "res://art/puppets/e-leg.png", 140, 16);
            Attach(_torso, "res://art/puppets/e-torso.png", 260, 380);
            Attach(_armFar, "res://art/puppets/e-off.png", 40, 30);
            Attach(_head, "res://art/puppets/e-head.png", 215, 420);
            Attach(_armNear, "res://art/puppets/e-reach.png", 280, 40);
        }

        Scale = new Vector2(0.34f, 0.34f);
        StartIdle();
    }

    public void RestAt(Vector2 position)
    {
        Position = position;
        _restX = position.X;
    }

    public void StartIdle()
    {
        StopIdle();
        if (_torso is null)
        {
            return;
        }

        Breath(_torso, 0.045f, 1.05f);
        Breath(_head, 0.07f, 1.25f);
        Breath(_armNear, _kind == Kind.Warrior ? 0.14f : 0.10f, 0.8f);
        Breath(_armFar, 0.09f, 1.1f);
        Breath(_legNear, 0.04f, 1.3f);
        Breath(_legFar, -0.04f, 1.3f);
    }

    public void Strike()
    {
        StopIdle();
        var swing = _facesRight ? -1.25f : 1.25f;
        var lean = _facesRight ? 0.22f : -0.22f;
        var tw = CreateTween();
        tw.TweenProperty(_torso, "rotation", lean, 0.12f);
        tw.Parallel().TweenProperty(_armNear, "rotation", swing, 0.18f).SetTrans(Tween.TransitionType.Back);
        tw.Parallel().TweenProperty(this, "position:x", _restX + (_facesRight ? 30 : -30), 0.18f);
        tw.TweenProperty(_armNear, "rotation", 0f, 0.26f);
        tw.Parallel().TweenProperty(_torso, "rotation", 0f, 0.26f);
        tw.Parallel().TweenProperty(this, "position:x", _restX, 0.26f);
        tw.Finished += StartIdle;
    }

    public void Guard()
    {
        StopIdle();
        var lift = _facesRight ? -0.8f : 0.8f;
        var tw = CreateTween();
        tw.TweenProperty(_armFar, "rotation", lift, 0.12f);
        tw.Parallel().TweenProperty(_torso, "rotation", _facesRight ? -0.1f : 0.1f, 0.12f);
        tw.TweenProperty(_armFar, "rotation", 0f, 0.22f);
        tw.Parallel().TweenProperty(_torso, "rotation", 0f, 0.22f);
        tw.Finished += StartIdle;
    }

    public void Flinch()
    {
        StopIdle();
        var tw = CreateTween();
        tw.TweenProperty(_torso, "rotation", _facesRight ? -0.18f : 0.18f, 0.08f);
        tw.Parallel().TweenProperty(_head, "rotation", _facesRight ? -0.22f : 0.22f, 0.08f);
        tw.Parallel().TweenProperty(this, "modulate", new Color(1, 0.55f, 0.48f), 0.08f);
        tw.TweenProperty(_torso, "rotation", 0f, 0.2f);
        tw.Parallel().TweenProperty(_head, "rotation", 0f, 0.2f);
        tw.Parallel().TweenProperty(this, "modulate", Colors.White, 0.2f);
        tw.Finished += StartIdle;
    }

    private void StopIdle()
    {
        foreach (var tw in _idle)
        {
            tw.Kill();
        }

        _idle.Clear();
    }

    private void Breath(Node2D bone, float amount, float seconds)
    {
        var tw = CreateTween().SetLoops();
        tw.TweenProperty(bone, "rotation", amount, seconds)
            .SetTrans(Tween.TransitionType.Sine)
            .SetEase(Tween.EaseType.InOut);
        tw.TweenProperty(bone, "rotation", -amount, seconds)
            .SetTrans(Tween.TransitionType.Sine)
            .SetEase(Tween.EaseType.InOut);
        _idle.Add(tw);
    }

    private static Node2D Bone(string name) => new() { Name = name };

    private static void Place(Node2D bone, float x, float y) => bone.Position = new Vector2(x, y);

    private static void Attach(Node2D bone, string path, float jointX, float jointY)
    {
        bone.AddChild(new Sprite2D
        {
            Texture = GD.Load<Texture2D>(path),
            Centered = false,
            Position = new Vector2(-jointX, -jointY)
        });
    }
}

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
        var sheet = kind == Kind.Warrior ? "res://art/puppets/warrior.png" : "res://art/puppets/enemy.png";
        var tex = GD.Load<Texture2D>(sheet);
        var size = tex.GetSize();

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
            Place(_torso, 0, -36);
            Place(_head, 4, -88);
            Place(_armFar, 46, -28);
            Place(_armNear, -40, -22);
            Place(_legFar, 22, 10);
            Place(_legNear, -18, 12);
            Limb(_legFar, tex, size, 0.48f, 0.56f, 0.74f, 0.98f, 0.58f, 0.58f);
            Limb(_legNear, tex, size, 0.32f, 0.56f, 0.56f, 0.98f, 0.46f, 0.58f);
            Limb(_torso, tex, size, 0.34f, 0.26f, 0.74f, 0.60f, 0.54f, 0.56f);
            Limb(_armFar, tex, size, 0.60f, 0.32f, 0.88f, 0.72f, 0.66f, 0.36f);
            Limb(_head, tex, size, 0.36f, 0.02f, 0.70f, 0.36f, 0.54f, 0.32f);
            Limb(_armNear, tex, size, 0.06f, 0.28f, 0.46f, 0.80f, 0.40f, 0.36f);
        }
        else
        {
            Place(_torso, 0, -28);
            Place(_head, 0, -70);
            Place(_armFar, 56, -8);
            Place(_armNear, -20, 8);
            Place(_legFar, 18, 16);
            Place(_legNear, -14, 18);
            Limb(_legFar, tex, size, 0.48f, 0.68f, 0.72f, 0.98f, 0.58f, 0.70f);
            Limb(_legNear, tex, size, 0.36f, 0.68f, 0.56f, 0.98f, 0.48f, 0.70f);
            Limb(_torso, tex, size, 0.22f, 0.26f, 0.78f, 0.62f, 0.50f, 0.56f);
            Limb(_armFar, tex, size, 0.60f, 0.36f, 0.90f, 0.82f, 0.70f, 0.42f);
            Limb(_head, tex, size, 0.26f, 0.06f, 0.74f, 0.44f, 0.50f, 0.40f);
            Limb(_armNear, tex, size, 0.08f, 0.46f, 0.56f, 0.96f, 0.42f, 0.50f);
        }

        Scale = new Vector2(0.36f, 0.36f);
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

        Breath(_torso, 0.04f, 1.1f);
        Breath(_head, 0.06f, 1.3f);
        Breath(_armNear, _kind == Kind.Warrior ? 0.12f : 0.08f, 0.85f);
        Breath(_armFar, 0.08f, 1.15f);
        Breath(_legNear, 0.035f, 1.35f);
        Breath(_legFar, -0.035f, 1.35f);
    }

    public void Strike()
    {
        StopIdle();
        var swing = _facesRight ? -1.2f : 1.2f;
        var lean = _facesRight ? 0.2f : -0.2f;
        var tw = CreateTween();
        tw.TweenProperty(_torso, "rotation", lean, 0.12f);
        tw.Parallel().TweenProperty(_armNear, "rotation", swing, 0.16f).SetTrans(Tween.TransitionType.Back);
        tw.Parallel().TweenProperty(this, "position:x", _restX + (_facesRight ? 28 : -28), 0.16f);
        tw.TweenProperty(_armNear, "rotation", 0f, 0.24f);
        tw.Parallel().TweenProperty(_torso, "rotation", 0f, 0.24f);
        tw.Parallel().TweenProperty(this, "position:x", _restX, 0.24f);
        tw.Finished += StartIdle;
    }

    public void Guard()
    {
        StopIdle();
        var lift = _facesRight ? -0.75f : 0.75f;
        var tw = CreateTween();
        tw.TweenProperty(_armFar, "rotation", lift, 0.12f);
        tw.Parallel().TweenProperty(_torso, "rotation", _facesRight ? -0.08f : 0.08f, 0.12f);
        tw.TweenProperty(_armFar, "rotation", 0f, 0.2f);
        tw.Parallel().TweenProperty(_torso, "rotation", 0f, 0.2f);
        tw.Finished += StartIdle;
    }

    public void Flinch()
    {
        StopIdle();
        var tw = CreateTween();
        tw.TweenProperty(_torso, "rotation", _facesRight ? -0.16f : 0.16f, 0.08f);
        tw.Parallel().TweenProperty(_head, "rotation", _facesRight ? -0.2f : 0.2f, 0.08f);
        tw.Parallel().TweenProperty(this, "modulate", new Color(1, 0.55f, 0.48f), 0.08f);
        tw.TweenProperty(_torso, "rotation", 0f, 0.18f);
        tw.Parallel().TweenProperty(_head, "rotation", 0f, 0.18f);
        tw.Parallel().TweenProperty(this, "modulate", Colors.White, 0.18f);
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

    private static void Limb(Node2D bone, Texture2D sheet, Vector2 size, float x0, float y0, float x1, float y1, float jx, float jy)
    {
        var sprite = new Sprite2D
        {
            Texture = new AtlasTexture
            {
                Atlas = sheet,
                Region = new Rect2(size.X * x0, size.Y * y0, size.X * (x1 - x0), size.Y * (y1 - y0))
            },
            Centered = false,
            Position = new Vector2(-(size.X * (jx - x0)), -(size.Y * (jy - y0)))
        };
        bone.AddChild(sprite);
    }
}

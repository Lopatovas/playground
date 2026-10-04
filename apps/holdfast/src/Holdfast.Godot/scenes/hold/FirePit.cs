using Godot;

namespace Holdfast.GodotGame;

public partial class FirePit : Node3D
{
    private OmniLight3D _light = null!;
    private OmniLight3D _fill = null!;
    private float _t;

    public override void _Ready()
    {
        var stone = HoldMats.Stone(new Color(0.16f, 0.13f, 0.10f), 0.18f);
        var soot = HoldMats.Stone(new Color(0.07f, 0.05f, 0.04f), 0.08f);
        var wood = HoldMats.Wood();
        var ember = HoldMats.Emit(new Color(1f, 0.35f, 0.06f), 3.2f);

        AddChild(HoldGeom.Cylinder(new Vector3(1.55f, 0.28f, 1.55f), new Vector3(0, 0.12f, 0), stone, 16));
        AddChild(HoldGeom.Cylinder(new Vector3(1.22f, 0.16f, 1.22f), new Vector3(0, 0.22f, 0), soot, 16));
        AddChild(HoldGeom.Disk(1.05f, new Vector3(0, 0.18f, 0), ember));

        AddChild(HoldGeom.Box(new Vector3(0.85f, 0.12f, 0.18f), new Vector3(0.08f, 0.28f, 0.06f), wood, new Vector3(0, 18, 12)));
        AddChild(HoldGeom.Box(new Vector3(0.72f, 0.11f, 0.16f), new Vector3(-0.12f, 0.32f, -0.1f), wood, new Vector3(0, -28, -8)));
        AddChild(HoldGeom.Box(new Vector3(0.4f, 0.1f, 0.14f), new Vector3(0.22f, 0.3f, -0.18f), wood, new Vector3(12, 40, 6)));

        AddChild(MakeFlames());
        AddChild(MakeBurst("fire", 90, 1.15f, new Color(1f, 0.55f, 0.12f), 0.22f, 2.4f, 0.12f));
        AddChild(MakeBurst("smoke", 28, 2.6f, new Color(0.12f, 0.1f, 0.09f, 0.35f), 0.35f, 0.7f, 0.55f, true));
        AddChild(MakeSparks());

        _light = new OmniLight3D
        {
            LightColor = new Color(1f, 0.58f, 0.22f),
            LightEnergy = 6.4f,
            OmniRange = 14,
            ShadowEnabled = true,
            Position = new Vector3(0, 1.15f, 0)
        };
        _fill = new OmniLight3D
        {
            LightColor = new Color(1f, 0.32f, 0.08f),
            LightEnergy = 1.8f,
            OmniRange = 5.5f,
            Position = new Vector3(0.15f, 0.45f, 0.1f)
        };
        AddChild(_light);
        AddChild(_fill);
    }

    public override void _Process(double delta)
    {
        _t += (float)delta;
        var flicker = 1f + 0.18f * Mathf.Sin(_t * 17.3f) + 0.11f * Mathf.Sin(_t * 29.1f) + 0.07f * Mathf.Sin(_t * 41.7f);
        _light.LightEnergy = 6.2f * flicker;
        _light.Position = new Vector3(Mathf.Sin(_t * 6.2f) * 0.08f, 1.1f + Mathf.Sin(_t * 11.4f) * 0.06f, Mathf.Cos(_t * 5.1f) * 0.07f);
        _fill.LightEnergy = 1.5f + 0.45f * Mathf.Sin(_t * 13.8f);
    }

    private Node3D MakeFlames()
    {
        var root = new Node3D { Position = new Vector3(0, 0.34f, 0) };
        var noise = HoldMats.FireNoise();
        var shader = GD.Load<Shader>("res://shaders/hold_fire.gdshader");
        for (var i = 0; i < 3; i++)
        {
            var mat = new ShaderMaterial();
            mat.Shader = shader;
            mat.SetShaderParameter("noise_tex", noise);
            mat.SetShaderParameter("time_scale", 0.5f + i * 0.12f);
            var mesh = new MeshInstance3D
            {
                Mesh = new QuadMesh { Size = new Vector2(1.15f - i * 0.12f, 1.55f - i * 0.1f) },
                Position = new Vector3(0, 0.72f, 0),
                RotationDegrees = new Vector3(0, i * 60f, 0),
                MaterialOverride = mat,
                CastShadow = GeometryInstance3D.ShadowCastingSetting.Off
            };
            root.AddChild(mesh);
        }

        return root;
    }

    private GpuParticles3D MakeBurst(string name, int amount, float life, Color color, float scale, float speed, float radius, bool smoke = false)
    {
        var grad = new Gradient();
        if (smoke)
        {
            grad.AddPoint(0, new Color(0.2f, 0.16f, 0.12f, 0.0f));
            grad.AddPoint(0.25f, new Color(0.16f, 0.13f, 0.11f, 0.34f));
            grad.AddPoint(1, new Color(0.08f, 0.07f, 0.06f, 0));
        }
        else
        {
            grad.AddPoint(0, new Color(1f, 0.95f, 0.7f, 0));
            grad.AddPoint(0.18f, new Color(1f, 0.78f, 0.25f, 0.95f));
            grad.AddPoint(0.55f, color);
            grad.AddPoint(1, new Color(0.35f, 0.04f, 0.01f, 0));
        }

        var process = new ParticleProcessMaterial
        {
            Direction = new Vector3(0, 1, 0),
            Spread = smoke ? 22 : 16,
            InitialVelocityMin = speed * 0.45f,
            InitialVelocityMax = speed,
            Gravity = new Vector3(0, smoke ? 0.55f : 0.15f, 0),
            ScaleMin = scale * 0.55f,
            ScaleMax = scale,
            Color = Colors.White,
            ColorRamp = new GradientTexture1D { Gradient = grad },
            EmissionShape = ParticleProcessMaterial.EmissionShapeEnum.Sphere,
            EmissionSphereRadius = radius
        };

        var draw = new QuadMesh { Size = smoke ? new Vector2(0.7f, 0.7f) : new Vector2(0.28f, 0.36f) };
        var mat = new StandardMaterial3D
        {
            Transparency = BaseMaterial3D.TransparencyEnum.Alpha,
            ShadingMode = BaseMaterial3D.ShadingModeEnum.Unshaded,
            VertexColorUseAsAlbedo = true,
            BillboardMode = BaseMaterial3D.BillboardModeEnum.Enabled,
            AlbedoColor = Colors.White,
            EmissionEnabled = !smoke,
            Emission = smoke ? Colors.Black : new Color(1f, 0.45f, 0.08f),
            EmissionEnergyMultiplier = smoke ? 0 : 2.4f,
            DisableReceiveShadows = true
        };

        return new GpuParticles3D
        {
            Name = name,
            Amount = amount,
            Lifetime = life,
            Preprocess = 0.8f,
            VisibilityAabb = new Aabb(new Vector3(-2, -0.2f, -2), new Vector3(4, 5, 4)),
            ProcessMaterial = process,
            DrawPass1 = draw,
            MaterialOverride = mat,
            Position = new Vector3(0, 0.4f, 0)
        };
    }

    private GpuParticles3D MakeSparks()
    {
        var grad = new Gradient();
        grad.AddPoint(0, new Color(1f, 0.95f, 0.55f, 1));
        grad.AddPoint(1, new Color(1f, 0.2f, 0.0f, 0));
        var process = new ParticleProcessMaterial
        {
            Direction = new Vector3(0, 1, 0),
            Spread = 40,
            InitialVelocityMin = 1.4f,
            InitialVelocityMax = 3.4f,
            Gravity = new Vector3(0, -1.1f, 0),
            ScaleMin = 0.03f,
            ScaleMax = 0.07f,
            ColorRamp = new GradientTexture1D { Gradient = grad },
            EmissionShape = ParticleProcessMaterial.EmissionShapeEnum.Sphere,
            EmissionSphereRadius = 0.18f
        };
        return new GpuParticles3D
        {
            Name = "sparks",
            Amount = 24,
            Lifetime = 0.9f,
            Preprocess = 0.4f,
            ProcessMaterial = process,
            DrawPass1 = new QuadMesh { Size = new Vector2(0.06f, 0.06f) },
            MaterialOverride = new StandardMaterial3D
            {
                Transparency = BaseMaterial3D.TransparencyEnum.Alpha,
                ShadingMode = BaseMaterial3D.ShadingModeEnum.Unshaded,
                VertexColorUseAsAlbedo = true,
                BillboardMode = BaseMaterial3D.BillboardModeEnum.Enabled,
                EmissionEnabled = true,
                Emission = new Color(1f, 0.7f, 0.2f),
                EmissionEnergyMultiplier = 6
            },
            Position = new Vector3(0, 0.55f, 0)
        };
    }
}

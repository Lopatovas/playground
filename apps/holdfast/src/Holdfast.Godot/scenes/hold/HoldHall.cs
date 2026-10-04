using Godot;

namespace Holdfast.GodotGame;

public partial class HoldHall : Node3D
{
    private Camera3D _cam = null!;
    private float _t;

    public override void _Ready()
    {
        var stone = HoldMats.Stone(new Color(0.38f, 0.30f, 0.22f));
        var dark = HoldMats.Stone(new Color(0.16f, 0.12f, 0.10f), 0.12f);
        var floor = HoldMats.Stone(new Color(0.28f, 0.22f, 0.16f), 0.28f);
        var wood = HoldMats.Wood();
        var brass = HoldMats.Brass();

        AddChild(new WorldEnvironment
        {
            Environment = new Godot.Environment
            {
                BackgroundMode = Godot.Environment.BGMode.Color,
                BackgroundColor = new Color(0.015f, 0.012f, 0.01f),
                AmbientLightSource = Godot.Environment.AmbientSource.Color,
                AmbientLightColor = new Color(0.18f, 0.12f, 0.08f),
                AmbientLightEnergy = 0.55f,
                FogEnabled = true,
                FogLightColor = new Color(0.16f, 0.1f, 0.06f),
                FogDensity = 0.004f,
                FogAerialPerspective = 0.15f,
                GlowEnabled = false,
                TonemapMode = Godot.Environment.ToneMapper.Filmic,
                AdjustmentEnabled = true,
                AdjustmentSaturation = 1.08f
            }
        });

        AddChild(HoldGeom.Box(new Vector3(16, 0.35f, 18), new Vector3(0, -0.18f, 0), floor));
        AddChild(HoldGeom.Cylinder(new Vector3(4.6f, 0.06f, 4.6f), new Vector3(0, 0.02f, 0.2f), dark, 24));
        AddChild(HoldGeom.Cylinder(new Vector3(3.4f, 0.05f, 3.4f), new Vector3(0, 0.04f, 0.2f), stone, 24));
        AddChild(HoldGeom.Box(new Vector3(16, 5.2f, 0.5f), new Vector3(0, 2.4f, -8.4f), stone));
        AddChild(HoldGeom.Box(new Vector3(16, 5.2f, 0.5f), new Vector3(0, 2.4f, 8.4f), dark));
        AddChild(HoldGeom.Box(new Vector3(0.5f, 5.2f, 17), new Vector3(-7.8f, 2.4f, 0), stone));
        AddChild(HoldGeom.Box(new Vector3(0.5f, 5.2f, 17), new Vector3(7.8f, 2.4f, 0), stone));
        AddChild(HoldGeom.Box(new Vector3(16.4f, 0.4f, 18.4f), new Vector3(0, 5.05f, 0), dark));

        for (var i = -2; i <= 2; i++)
        {
            if (i == 0)
            {
                continue;
            }

            AddChild(HoldGeom.Cylinder(new Vector3(0.55f, 4.2f, 0.55f), new Vector3(-5.6f, 2.0f, i * 2.6f), stone, 10));
            AddChild(HoldGeom.Cylinder(new Vector3(0.7f, 0.22f, 0.7f), new Vector3(-5.6f, 4.15f, i * 2.6f), stone, 10));
            AddChild(HoldGeom.Cylinder(new Vector3(0.55f, 4.2f, 0.55f), new Vector3(5.6f, 2.0f, i * 2.6f), stone, 10));
            AddChild(HoldGeom.Cylinder(new Vector3(0.7f, 0.22f, 0.7f), new Vector3(5.6f, 4.15f, i * 2.6f), stone, 10));
        }

        AddDoor(wood, brass, stone);
        AddWinch(wood, brass, stone);
        AddBook(wood, brass);
        AddStairs(stone);
        AddTorches();
        AddDust();

        var fire = new FirePit { Position = new Vector3(0, 0, 0.2f) };
        AddChild(fire);
        AddChild(HoldGeom.Hit("fire", new Vector3(1.4f, 1.2f, 1.4f), new Vector3(0, 0.5f, 0.2f)));

        _cam = new Camera3D
        {
            Fov = 58,
            Current = true
        };
        AddChild(_cam);

        AddChild(new DirectionalLight3D
        {
            LightColor = new Color(0.15f, 0.18f, 0.28f),
            LightEnergy = 0.35f,
            RotationDegrees = new Vector3(-40, 30, 0)
        });
    }

    public override void _Process(double delta)
    {
        _t += (float)delta;
        var look = new Vector3(0.1f + Mathf.Sin(_t * 0.16f) * 0.06f, 1.45f, -7.2f);
        var pos = new Vector3(0.35f + Mathf.Sin(_t * 0.13f) * 0.04f, 1.78f, 6.4f);
        _cam.Position = pos;
        _cam.LookAt(look);
    }

    public string? Query(Vector2 local, Vector2 viewSize)
    {
        if (viewSize.X < 1 || viewSize.Y < 1)
        {
            return null;
        }

        var n = local / viewSize;
        var from = _cam.ProjectRayOrigin(n * _cam.GetViewport().GetVisibleRect().Size);
        var dir = _cam.ProjectRayNormal(n * _cam.GetViewport().GetVisibleRect().Size);
        var space = GetWorld3D().DirectSpaceState;
        var q = PhysicsRayQueryParameters3D.Create(from, from + dir * 40);
        q.CollideWithAreas = true;
        q.CollideWithBodies = false;
        var hit = space.IntersectRay(q);
        if (hit.Count == 0)
        {
            return null;
        }

        var collider = hit["collider"].AsGodotObject() as Node;
        return collider?.Name.ToString();
    }

    private void AddDoor(Material wood, Material brass, Material stone)
    {
        var oak = HoldMats.Stone(new Color(0.42f, 0.26f, 0.12f), 0.1f);
        AddChild(HoldGeom.Box(new Vector3(4.2f, 4.8f, 0.36f), new Vector3(0, 2.3f, -8.08f), stone));
        AddChild(HoldGeom.Box(new Vector3(1.55f, 3.7f, 0.18f), new Vector3(-0.82f, 1.95f, -7.84f), oak));
        AddChild(HoldGeom.Box(new Vector3(1.55f, 3.7f, 0.18f), new Vector3(0.82f, 1.95f, -7.84f), oak));
        AddChild(HoldGeom.Box(new Vector3(3.3f, 0.08f, 0.04f), new Vector3(0, 0.22f, -7.7f), HoldMats.Emit(new Color(1f, 0.7f, 0.25f), 2.4f)));
        for (var y = 0.7f; y <= 3.1f; y += 1.15f)
        {
            AddChild(HoldGeom.Box(new Vector3(3.05f, 0.08f, 0.05f), new Vector3(0, y, -7.76f), brass));
        }

        AddChild(HoldGeom.Cylinder(new Vector3(0.12f, 0.22f, 0.12f), new Vector3(-0.18f, 1.7f, -7.72f), brass, 8, new Vector3(90, 0, 0)));
        AddChild(HoldGeom.Cylinder(new Vector3(0.12f, 0.22f, 0.12f), new Vector3(0.18f, 1.7f, -7.72f), brass, 8, new Vector3(90, 0, 0)));
        AddChild(HoldGeom.Hit("door", new Vector3(3.4f, 4.0f, 1.1f), new Vector3(0, 2.0f, -7.6f)));
    }

    private void AddWinch(Material wood, Material brass, Material stone)
    {
        AddChild(HoldGeom.Box(new Vector3(0.22f, 3.4f, 0.22f), new Vector3(-5.1f, 1.7f, 2.4f), wood));
        AddChild(HoldGeom.Box(new Vector3(0.22f, 3.4f, 0.22f), new Vector3(-3.5f, 1.7f, 2.4f), wood));
        AddChild(HoldGeom.Box(new Vector3(2.0f, 0.18f, 0.18f), new Vector3(-4.3f, 3.35f, 2.4f), wood));
        AddChild(HoldGeom.Cylinder(new Vector3(1.15f, 1.05f, 1.15f), new Vector3(-4.3f, 1.55f, 2.4f), wood, 14, new Vector3(0, 0, 90)));
        AddChild(HoldGeom.Cylinder(new Vector3(0.08f, 1.8f, 0.08f), new Vector3(-4.3f, 1.55f, 2.4f), brass, 6, new Vector3(0, 0, 90)));
        AddChild(HoldGeom.Box(new Vector3(0.04f, 1.6f, 0.04f), new Vector3(-4.55f, 2.5f, 2.4f), brass));
        AddChild(HoldGeom.Box(new Vector3(0.04f, 1.9f, 0.04f), new Vector3(-4.05f, 2.35f, 2.55f), brass));
        AddChild(HoldGeom.Hit("winch", new Vector3(2.4f, 3.6f, 1.6f), new Vector3(-4.3f, 1.8f, 2.4f)));
    }

    private void AddBook(Material wood, Material brass)
    {
        var book = new Node3D { Position = new Vector3(1.15f, 0.22f, 1.45f), RotationDegrees = new Vector3(0, -28, 0) };
        book.AddChild(HoldGeom.Box(new Vector3(0.42f, 0.07f, 0.56f), Vector3.Zero, wood));
        book.AddChild(HoldGeom.Box(new Vector3(0.38f, 0.05f, 0.52f), new Vector3(0, 0.04f, 0), HoldMats.Stone(new Color(0.62f, 0.5f, 0.32f), 0.05f)));
        book.AddChild(HoldGeom.Box(new Vector3(0.06f, 0.02f, 0.12f), new Vector3(0.14f, 0.06f, 0.16f), brass));
        AddChild(book);
        AddChild(HoldGeom.Hit("book", new Vector3(1.1f, 0.7f, 1.2f), new Vector3(1.15f, 0.35f, 1.45f)));
    }

    private void AddStairs(Material stone)
    {
        for (var i = 0; i < 5; i++)
        {
            AddChild(HoldGeom.Box(new Vector3(2.2f, 0.18f, 0.7f), new Vector3(5.8f, 0.12f + i * 0.18f, -6.4f + i * 0.28f), stone));
        }

        AddChild(HoldGeom.Box(new Vector3(1.3f, 0.7f, 0.9f), new Vector3(6.2f, 1.15f, -5.2f), stone));
    }

    private void AddTorches()
    {
        foreach (var p in new[] { new Vector3(-5.4f, 2.5f, -4.6f), new Vector3(5.4f, 2.5f, -4.6f), new Vector3(-5.4f, 2.5f, 4.8f), new Vector3(5.4f, 2.5f, 4.8f) })
        {
            var torch = new Node3D { Position = p };
            torch.AddChild(HoldGeom.Cylinder(new Vector3(0.07f, 0.55f, 0.07f), Vector3.Zero, HoldMats.Wood(), 6));
            torch.AddChild(HoldGeom.Box(new Vector3(0.12f, 0.08f, 0.12f), new Vector3(0, 0.28f, 0), HoldMats.Brass()));
            var light = new OmniLight3D
            {
                LightColor = new Color(1f, 0.55f, 0.2f),
                LightEnergy = 1.6f,
                OmniRange = 5.5f,
                Position = new Vector3(0, 0.42f, 0)
            };
            torch.AddChild(light);
            torch.AddChild(MakeTorchFire());
            AddChild(torch);
        }
    }

    private static GpuParticles3D MakeTorchFire()
    {
        var grad = new Gradient();
        grad.AddPoint(0, new Color(1f, 0.9f, 0.4f, 0.9f));
        grad.AddPoint(1, new Color(0.8f, 0.1f, 0f, 0));
        return new GpuParticles3D
        {
            Amount = 18,
            Lifetime = 0.55f,
            Position = new Vector3(0, 0.38f, 0),
            ProcessMaterial = new ParticleProcessMaterial
            {
                Direction = new Vector3(0, 1, 0),
                Spread = 12,
                InitialVelocityMin = 0.4f,
                InitialVelocityMax = 1.1f,
                Gravity = new Vector3(0, 0.2f, 0),
                ScaleMin = 0.04f,
                ScaleMax = 0.1f,
                ColorRamp = new GradientTexture1D { Gradient = grad }
            },
            DrawPass1 = new QuadMesh { Size = new Vector2(0.12f, 0.16f) },
            MaterialOverride = new StandardMaterial3D
            {
                Transparency = BaseMaterial3D.TransparencyEnum.Alpha,
                ShadingMode = BaseMaterial3D.ShadingModeEnum.Unshaded,
                VertexColorUseAsAlbedo = true,
                BillboardMode = BaseMaterial3D.BillboardModeEnum.Enabled,
                EmissionEnabled = true,
                Emission = new Color(1f, 0.5f, 0.1f),
                EmissionEnergyMultiplier = 3
            }
        };
    }

    private void AddDust()
    {
        var grad = new Gradient();
        grad.AddPoint(0, new Color(1, 0.8f, 0.5f, 0));
        grad.AddPoint(0.5f, new Color(1, 0.75f, 0.4f, 0.22f));
        grad.AddPoint(1, new Color(1, 0.7f, 0.3f, 0));
        AddChild(new GpuParticles3D
        {
            Amount = 40,
            Lifetime = 8,
            Preprocess = 4,
            Position = new Vector3(0, 2.2f, 0),
            VisibilityAabb = new Aabb(new Vector3(-8, -2, -8), new Vector3(16, 8, 16)),
            ProcessMaterial = new ParticleProcessMaterial
            {
                Direction = new Vector3(0, 0.2f, 0.1f),
                Spread = 80,
                InitialVelocityMin = 0.02f,
                InitialVelocityMax = 0.12f,
                Gravity = new Vector3(0, 0.01f, 0),
                ScaleMin = 0.02f,
                ScaleMax = 0.05f,
                ColorRamp = new GradientTexture1D { Gradient = grad },
                EmissionShape = ParticleProcessMaterial.EmissionShapeEnum.Box,
                EmissionBoxExtents = new Vector3(6, 1.6f, 6)
            },
            DrawPass1 = new QuadMesh { Size = new Vector2(0.05f, 0.05f) },
            MaterialOverride = new StandardMaterial3D
            {
                Transparency = BaseMaterial3D.TransparencyEnum.Alpha,
                ShadingMode = BaseMaterial3D.ShadingModeEnum.Unshaded,
                VertexColorUseAsAlbedo = true,
                BillboardMode = BaseMaterial3D.BillboardModeEnum.Enabled
            }
        });
    }
}

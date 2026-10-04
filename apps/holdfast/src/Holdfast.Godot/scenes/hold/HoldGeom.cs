using Godot;

namespace Holdfast.GodotGame;

public static class HoldGeom
{
    public static MeshInstance3D Box(Vector3 size, Vector3 pos, Material mat, Vector3? rot = null)
    {
        var mesh = new MeshInstance3D
        {
            Mesh = new BoxMesh { Size = size },
            Position = pos,
            MaterialOverride = mat
        };
        if (rot is { } r)
        {
            mesh.RotationDegrees = r;
        }

        return mesh;
    }

    public static MeshInstance3D Cylinder(Vector3 size, Vector3 pos, Material mat, int sides = 12, Vector3? rot = null)
    {
        var mesh = new MeshInstance3D
        {
            Mesh = new CylinderMesh
            {
                TopRadius = size.X * 0.5f,
                BottomRadius = size.Z * 0.5f,
                Height = size.Y,
                RadialSegments = sides
            },
            Position = pos,
            MaterialOverride = mat
        };
        if (rot is { } r)
        {
            mesh.RotationDegrees = r;
        }

        return mesh;
    }

    public static MeshInstance3D Disk(float radius, Vector3 pos, Material mat)
    {
        return new MeshInstance3D
        {
            Mesh = new CylinderMesh
            {
                TopRadius = radius,
                BottomRadius = radius,
                Height = 0.03f,
                RadialSegments = 20
            },
            Position = pos,
            MaterialOverride = mat
        };
    }

    public static Area3D Hit(string name, Vector3 size, Vector3 pos)
    {
        var area = new Area3D
        {
            Name = name,
            Position = pos,
            CollisionLayer = 1,
            CollisionMask = 0,
            Monitoring = false,
            Monitorable = true
        };
        var shape = new CollisionShape3D
        {
            Shape = new BoxShape3D { Size = size }
        };
        area.AddChild(shape);
        return area;
    }
}

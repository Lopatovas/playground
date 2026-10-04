using Godot;

namespace Holdfast.GodotGame;

public static class HoldMats
{
    public static StandardMaterial3D Stone(Color tint, float grain = 0.22f)
    {
        return new StandardMaterial3D
        {
            AlbedoColor = tint,
            AlbedoTexture = Noise(grain, tint, tint.Darkened(0.35f)),
            Roughness = 0.92f,
            Metallic = 0.04f
        };
    }

    public static StandardMaterial3D Wood()
    {
        var tint = new Color(0.28f, 0.16f, 0.08f);
        return new StandardMaterial3D
        {
            AlbedoColor = tint,
            AlbedoTexture = Noise(0.08f, tint, new Color(0.14f, 0.07f, 0.03f), 6),
            Roughness = 0.78f,
            Uv1Scale = new Vector3(0.4f, 2.2f, 1)
        };
    }

    public static StandardMaterial3D Brass()
    {
        return new StandardMaterial3D
        {
            AlbedoColor = new Color(0.62f, 0.46f, 0.22f),
            Metallic = 0.85f,
            Roughness = 0.38f
        };
    }

    public static StandardMaterial3D Emit(Color color, float energy)
    {
        return new StandardMaterial3D
        {
            AlbedoColor = color,
            EmissionEnabled = true,
            Emission = color,
            EmissionEnergyMultiplier = energy,
            Roughness = 1
        };
    }

    public static NoiseTexture2D FireNoise()
    {
        return new NoiseTexture2D
        {
            Width = 256,
            Height = 256,
            Seamless = true,
            Noise = new FastNoiseLite
            {
                Seed = 17,
                Frequency = 0.045f,
                FractalOctaves = 4,
                NoiseType = FastNoiseLite.NoiseTypeEnum.SimplexSmooth
            }
        };
    }

    public static NoiseTexture2D Noise(float freq, Color a, Color b, int octaves = 4)
    {
        var grad = new Gradient();
        grad.AddPoint(0, b);
        grad.AddPoint(1, a);
        return new NoiseTexture2D
        {
            Width = 256,
            Height = 256,
            Seamless = true,
            ColorRamp = grad,
            Noise = new FastNoiseLite
            {
                Seed = 4,
                Frequency = freq,
                FractalOctaves = octaves,
                NoiseType = FastNoiseLite.NoiseTypeEnum.Simplex
            }
        };
    }
}

namespace Holdfast.Application.Settings;

public sealed class SettingsState
{
    public float MasterVolume { get; set; } = 1f;
    public float SfxVolume { get; set; } = 1f;
    public float MusicVolume { get; set; } = 0.7f;
    public float Brightness { get; set; } = 1f;
    public int Width { get; set; } = 390;
    public int Height { get; set; } = 844;
    public bool Fullscreen { get; set; }
    public bool Vsync { get; set; } = true;
}

public interface ISettingsStore
{
    SettingsState Load();
    void Save(SettingsState state);
}

public sealed class SettingsService
{
    private readonly ISettingsStore _store;
    public SettingsState Current { get; }

    public SettingsService(ISettingsStore store)
    {
        _store = store;
        Current = store.Load();
    }

    public void SetMasterVolume(float value)
    {
        Current.MasterVolume = Math.Clamp(value, 0, 1);
        _store.Save(Current);
    }

    public void SetBrightness(float value)
    {
        Current.Brightness = Math.Clamp(value, 0.4f, 1.4f);
        _store.Save(Current);
    }

    public void SetResolution(int width, int height)
    {
        Current.Width = width;
        Current.Height = height;
        _store.Save(Current);
    }
}

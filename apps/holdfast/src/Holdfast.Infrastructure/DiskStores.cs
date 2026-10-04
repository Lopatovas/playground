using System.Text.Json;
using Holdfast.Application.Save;
using Holdfast.Application.Settings;

namespace Holdfast.Infrastructure;

public sealed class FileSaveStore : ISaveStore
{
    private readonly string _path;
    public FileSaveStore(string path) => _path = path;

    public SaveBlob? Load() =>
        File.Exists(_path) ? JsonSerializer.Deserialize<SaveBlob>(File.ReadAllText(_path)) : null;

    public void Write(SaveBlob blob)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(_path)!);
        File.WriteAllText(_path, JsonSerializer.Serialize(blob));
    }
}

public sealed class MemorySettingsStore : ISettingsStore
{
    private SettingsState _state = new();
    public SettingsState Load() => _state;
    public void Save(SettingsState state) => _state = state;
}

public sealed class FileSettingsStore : ISettingsStore
{
    private readonly string _path;
    public FileSettingsStore(string path) => _path = path;

    public SettingsState Load() =>
        File.Exists(_path) ? JsonSerializer.Deserialize<SettingsState>(File.ReadAllText(_path)) ?? new() : new();

    public void Save(SettingsState state)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(_path)!);
        File.WriteAllText(_path, JsonSerializer.Serialize(state));
    }
}

using Godot;
using Holdfast.Application.Content;

namespace Holdfast.GodotGame;

public sealed class GodotContentSource : IContentSource
{
    public string ReadTuning() => Read("res://content/tuning.json");
    public string ReadLedger() => Read("res://content/ledger.json");
    public string ReadStarter(string classId) => Read($"res://content/{classId}/starter.json");
    public string ReadPool(string classId) => Read($"res://content/pools/{classId}.json");

    public IReadOnlyList<string> ReadEnemyFiles()
    {
        var files = new List<string>();
        using var dir = DirAccess.Open("res://content/enemies");
        if (dir is null)
        {
            return files;
        }

        dir.ListDirBegin();
        for (var name = dir.GetNext(); name != ""; name = dir.GetNext())
        {
            if (name.EndsWith(".json"))
            {
                files.Add(Read($"res://content/enemies/{name}"));
            }
        }

        return files;
    }

    private static string Read(string path)
    {
        using var file = Godot.FileAccess.Open(path, Godot.FileAccess.ModeFlags.Read);
        if (file is null)
        {
            throw new InvalidOperationException($"Missing {path}");
        }

        return file.GetAsText();
    }
}

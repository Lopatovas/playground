using Holdfast.Application.Content;

namespace Holdfast.Infrastructure;

public sealed class FileContentSource : IContentSource
{
    private readonly string _root;
    public FileContentSource(string root) => _root = root;

    public string ReadTuning() => File.ReadAllText(Path.Combine(_root, "tuning.json"));
    public string ReadLedger() => File.ReadAllText(Path.Combine(_root, "ledger.json"));
    public string ReadStarter(string classId) => File.ReadAllText(Path.Combine(_root, classId, "starter.json"));
    public string ReadPool(string classId) => File.ReadAllText(Path.Combine(_root, "pools", $"{classId}.json"));
    public IReadOnlyList<string> ReadEnemyFiles()
    {
        var dir = Path.Combine(_root, "enemies");
        return Directory.Exists(dir)
            ? Directory.GetFiles(dir, "*.json").Select(File.ReadAllText).ToList()
            : [];
    }
}

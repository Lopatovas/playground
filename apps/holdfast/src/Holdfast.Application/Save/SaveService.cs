using Holdfast.Domain.Hold;

namespace Holdfast.Application.Save;

public sealed class SaveBlob
{
    public int Runestones { get; set; }
    public List<string> Bought { get; set; } = [];
    public List<string> Unlocked { get; set; } = [];
}

public interface ISaveStore
{
    SaveBlob? Load();
    void Write(SaveBlob blob);
}

public sealed class SaveService
{
    private readonly ISaveStore _store;

    public SaveService(ISaveStore store) => _store = store;

    public void WriteHold(HoldProgress progress)
    {
        _store.Write(new SaveBlob
        {
            Runestones = progress.Runestones,
            Bought = [..progress.Bought],
            Unlocked = progress.Unlocked.Select(c => c.ToString()).ToList()
        });
    }

    public void ReadHold(HoldProgress progress)
    {
        var blob = _store.Load();
        if (blob is null)
        {
            return;
        }

        progress.Runestones = blob.Runestones;
        progress.Bought.Clear();
        foreach (var id in blob.Bought)
        {
            progress.Bought.Add(id);
        }

        foreach (var name in blob.Unlocked)
        {
            if (Enum.TryParse<Domain.Actors.ClassId>(name, out var cls))
            {
                progress.Unlocked.Add(cls);
            }
        }
    }
}

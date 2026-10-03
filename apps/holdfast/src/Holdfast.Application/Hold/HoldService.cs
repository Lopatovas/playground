using Holdfast.Domain.Actors;
using Holdfast.Domain.Hold;

namespace Holdfast.Application.HoldCamp;

public sealed class HoldService
{
    public HoldProgress Progress { get; }
    public Ledger Ledger { get; }

    public HoldService(HoldProgress progress, Ledger ledger)
    {
        Progress = progress;
        Ledger = ledger;
    }

    public IEnumerable<LedgerNode> Available() =>
        Ledger.All.Where(n =>
            !Progress.Has(n.Id) &&
            n.Requires.All(Progress.Has) &&
            (n.Effect.GetValueOrDefault("unlockClass") is not string cls ||
             cls != "runesmith" || !Progress.Unlocked.Contains(ClassId.Runesmith)));

    public bool Buy(string nodeId)
    {
        var node = Ledger.Get(nodeId);
        if (Progress.Has(node.Id) || Progress.Runestones < node.Cost || !node.Requires.All(Progress.Has))
        {
            return false;
        }

        Progress.Runestones -= node.Cost;
        Progress.Bought.Add(node.Id);
        if (node.Effect.GetValueOrDefault("unlockClass") is string { Length: > 0 } cls &&
            cls.Equals("runesmith", StringComparison.OrdinalIgnoreCase))
        {
            Progress.Unlocked.Add(ClassId.Runesmith);
        }

        return true;
    }

    public void GrantRunestones(int amount) => Progress.Runestones += Math.Max(0, amount);
}

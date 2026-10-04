using Holdfast.Domain.Actors;

namespace Holdfast.Domain.Hold;

public sealed class LedgerNode
{
    public string Id { get; }
    public string Name { get; }
    public int Cost { get; }
    public IReadOnlyList<string> Requires { get; }
    public Dictionary<string, object> Effect { get; }

    public LedgerNode(string id, string name, int cost, IReadOnlyList<string> requires, Dictionary<string, object> effect)
    {
        Id = id;
        Name = name;
        Cost = cost;
        Requires = requires;
        Effect = effect;
    }
}

public sealed class Ledger
{
    public List<LedgerNode> Frame { get; }
    public List<LedgerNode> Hearth { get; }
    public Dictionary<ClassId, List<LedgerNode>> Spark { get; }

    public Ledger(List<LedgerNode> frame, List<LedgerNode> hearth, Dictionary<ClassId, List<LedgerNode>> spark)
    {
        Frame = frame;
        Hearth = hearth;
        Spark = spark;
    }

    public IEnumerable<LedgerNode> All
    {
        get
        {
            foreach (var n in Frame) yield return n;
            foreach (var n in Hearth) yield return n;
            foreach (var list in Spark.Values)
            {
                foreach (var n in list) yield return n;
            }
        }
    }

    public LedgerNode Get(string id) => All.First(n => n.Id == id);
}

public sealed class HoldProgress
{
    public int Runestones { get; set; }
    public HashSet<string> Bought { get; } = [];
    public HashSet<ClassId> Unlocked { get; } = [ClassId.Warrior];
    public Dictionary<ClassId, int> Brand { get; } = new()
    {
        [ClassId.Warrior] = 0,
        [ClassId.Runesmith] = 0
    };

    public bool Has(string id) => Bought.Contains(id);

    public int ExtraStartingHp =>
        (Has("hp_1") ? 8 : 0) + (Has("hp_2") ? 8 : 0);

    public int ExtraStartingGold => Has("gold_1") ? 25 : 0;

    public bool ShopReroll => Has("shop_reroll");
    public bool RestUpgrade => Has("rest_upgrade");
    public bool ExtraRemove => Has("extra_remove");
}

namespace Holdfast.Domain.Actors;

public readonly record struct Hit(int Rolled, int Might)
{
    public int Total => Rolled + Might;
}

public readonly record struct IncomingResult(bool Shrugged, int HpLost, int BlockSpent, string Text);

public abstract class Actor
{
    public string Id { get; }
    public string Name { get; }
    public int MaxHp { get; protected set; }
    public int Hp { get; protected set; }
    public int Block { get; protected set; }
    public int Might { get; set; }
    public int Brace { get; set; }
    public bool IsDead => Hp <= 0;

    protected Actor(string id, string name, int maxHp)
    {
        Id = id;
        Name = name;
        MaxHp = maxHp;
        Hp = maxHp;
    }

    public void GainBlock(int amount) => Block += Math.Max(0, amount);

    public void ClearBlock() => Block = 0;

    public void Heal(int amount) => Hp = Math.Min(MaxHp, Hp + Math.Max(0, amount));

    public void RaiseMaxHp(int amount)
    {
        MaxHp += amount;
        Hp += amount;
    }

    public virtual IncomingResult Incoming(Hit hit)
    {
        var absorb = Math.Min(Block, hit.Total);
        Block -= absorb;
        var hpLost = Math.Max(0, hit.Total - absorb);
        Hp = Math.Max(0, Hp - hpLost);
        var text = hpLost == 0
            ? $"{Name} blocks {hit.Total}."
            : $"{Name} takes {hpLost} ({hit.Total} hit, {absorb} blocked).";
        return new IncomingResult(false, hpLost, absorb, text);
    }
}

public enum ClassId
{
    Warrior,
    Runesmith
}

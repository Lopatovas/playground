using Holdfast.Domain.Cards;
using Holdfast.Domain.Combat;
using Holdfast.Domain.Dice;

namespace Holdfast.Domain.Actors;

public enum IntentKind
{
    Attack,
    Block,
    BuffMight
}

public sealed record IntentSpec(IntentKind Kind, string? Dice, int Amount, int Weight);

public sealed class Intent
{
    public IntentKind Kind { get; }
    public DiceExpression? Dice { get; }
    public int Amount { get; }
    public string Label { get; }

    public Intent(IntentKind kind, DiceExpression? dice, int amount, string label)
    {
        Kind = kind;
        Dice = dice;
        Amount = amount;
        Label = label;
    }
}

public sealed class Enemy : Actor
{
    public string Portrait { get; }
    public IReadOnlyList<IntentSpec> Kit { get; }
    public Intent? Intent { get; private set; }

    public Enemy(string id, string name, int maxHp, string portrait, IReadOnlyList<IntentSpec> kit)
        : base(id, name, maxHp)
    {
        Portrait = portrait;
        Kit = kit;
    }

    public Enemy Spawn() => new(Id, Name, MaxHp, Portrait, Kit);

    public void Telegraph(IRandom random)
    {
        var spec = Pick(random);
        var dice = DiceExpression.ParseOrNull(spec.Dice);
        var label = spec.Kind switch
        {
            IntentKind.Attack => $"Attack {dice?.Printed ?? spec.Amount.ToString()}",
            IntentKind.Block => $"Block {dice?.Printed ?? spec.Amount.ToString()}",
            IntentKind.BuffMight => $"+{spec.Amount} Might",
            _ => spec.Kind.ToString()
        };
        Intent = new Intent(spec.Kind, dice, spec.Amount, label);
    }

    public IReadOnlyList<FightEvent> ResolveIntent(Encounter encounter, IRandom random)
    {
        var events = new List<FightEvent>();
        if (IsDead || Intent is null)
        {
            return events;
        }

        switch (Intent.Kind)
        {
            case IntentKind.Attack:
            {
                var rolled = Intent.Dice?.Roll(random) ?? Intent.Amount;
                var hit = new Hit(rolled, Might);
                var incoming = encounter.Dwarf.Incoming(hit);
                events.Add(new FightEvent(
                    incoming.Shrugged ? "shrug" : "enemyHit",
                    $"{Name} {Intent.Label}: {incoming.Text}",
                    incoming.HpLost));
                break;
            }
            case IntentKind.Block:
            {
                var gain = Intent.Dice?.Roll(random) ?? Intent.Amount;
                gain += Brace;
                GainBlock(gain);
                events.Add(new FightEvent("block", $"{Name} gains {gain} Block.", gain));
                break;
            }
            case IntentKind.BuffMight:
                Might += Intent.Amount;
                events.Add(new FightEvent("might", $"{Name} gains {Intent.Amount} Might.", Intent.Amount));
                break;
        }

        return events;
    }

    private IntentSpec Pick(IRandom random)
    {
        var total = Kit.Sum(k => k.Weight);
        var roll = random.Next(0, Math.Max(1, total));
        var acc = 0;
        foreach (var spec in Kit)
        {
            acc += spec.Weight;
            if (roll < acc)
            {
                return spec;
            }
        }

        return Kit[0];
    }
}

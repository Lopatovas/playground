using Holdfast.Domain.Actors;
using Holdfast.Domain.Combat;
using Holdfast.Domain.Dice;

namespace Holdfast.Domain.Cards;

public interface IEffect
{
    void Apply(PlayContext ctx, List<FightEvent> events);
}

public sealed class GainGritEffect : IEffect
{
    public int Amount { get; }
    public GainGritEffect(int amount) => Amount = amount;

    public void Apply(PlayContext ctx, List<FightEvent> events)
    {
        if (ctx.Source is not Dwarf dwarf)
        {
            return;
        }

        dwarf.Grit += Amount;
        events.Add(new FightEvent("grit", $"{dwarf.Name} gains {Amount} Grit.", Amount));
    }
}

public sealed class GainMightEffect : IEffect
{
    public int Amount { get; }
    public GainMightEffect(int amount) => Amount = amount;

    public void Apply(PlayContext ctx, List<FightEvent> events)
    {
        ctx.Source.Might += Amount;
        events.Add(new FightEvent("might", $"{ctx.Source.Name} gains {Amount} Might.", Amount));
    }
}

public sealed class GainBraceEffect : IEffect
{
    public int Amount { get; }
    public GainBraceEffect(int amount) => Amount = amount;

    public void Apply(PlayContext ctx, List<FightEvent> events)
    {
        ctx.Source.Brace += Amount;
        events.Add(new FightEvent("brace", $"{ctx.Source.Name} gains {Amount} Brace.", Amount));
    }
}

public sealed class InscribeNextAttackEffect : IEffect
{
    public DiceExpression Extra { get; }
    public InscribeNextAttackEffect(DiceExpression extra) => Extra = extra;

    public void Apply(PlayContext ctx, List<FightEvent> events)
    {
        if (ctx.Source is not Dwarf dwarf)
        {
            return;
        }

        dwarf.Runes.Add(new NextAttackBonusRune(Extra));
        events.Add(new FightEvent("inscribe", $"{dwarf.Name} inscribes +{Extra.Printed} on the next Attack."));
    }
}

using Holdfast.Domain.Actors;
using Holdfast.Domain.Combat;
using Holdfast.Domain.Dice;

namespace Holdfast.Domain.Cards;

public sealed class AttackCard : Card
{
    public DiceExpression Damage { get; }
    public IEffect? Effect { get; }

    public AttackCard(string id, string name, int cost, DiceExpression damage, string text, IEffect? effect = null, string? performKey = null)
        : base(id, name, cost, CardType.Attack, text, performKey)
    {
        Damage = damage;
        Effect = effect;
    }

    public override PlayResult OnPlay(PlayContext ctx)
    {
        var events = new List<FightEvent>();
        var extra = 0;
        if (ctx.Source is Dwarf dwarf)
        {
            extra = dwarf.Runes.SpendAttackBonus(ctx.Random);
        }

        var rolled = Damage.Roll(ctx.Random) + extra;
        var hit = new Hit(rolled, ctx.Source.Might);
        events.Add(new FightEvent("roll", $"{Name} rolls {rolled} + {ctx.Source.Might} Might.", hit.Total));

        foreach (var target in ctx.Targets)
        {
            var incoming = target.Incoming(hit);
            events.Add(new FightEvent(incoming.Shrugged ? "shrug" : "hit", incoming.Text, incoming.HpLost));
        }

        Effect?.Apply(ctx, events);
        return new PlayResult(events, PerformKey);
    }
}

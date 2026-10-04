using Holdfast.Domain.Dice;

namespace Holdfast.Domain.Cards;

public sealed class SkillCard : Card
{
    public DiceExpression? Block { get; }
    public IEffect? Effect { get; }

    public SkillCard(
        string id,
        string name,
        int cost,
        string text,
        DiceExpression? block = null,
        IEffect? effect = null,
        string? performKey = null)
        : base(id, name, cost, CardType.Skill, text, performKey)
    {
        Block = block;
        Effect = effect;
    }

    public override PlayResult OnPlay(PlayContext ctx)
    {
        var events = new List<FightEvent>();
        if (Block is not null)
        {
            var rolled = Block.Roll(ctx.Random);
            var gain = rolled + ctx.Source.Brace;
            ctx.Source.GainBlock(gain);
            events.Add(new FightEvent("block", $"{ctx.Source.Name} gains {gain} Block.", gain));
        }

        Effect?.Apply(ctx, events);
        return new PlayResult(events, PerformKey);
    }
}

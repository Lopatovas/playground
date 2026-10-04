namespace Holdfast.Domain.Cards;

public sealed class PowerCard : Card
{
    public IEffect Effect { get; }

    public PowerCard(string id, string name, int cost, string text, IEffect effect, string? performKey = null)
        : base(id, name, cost, CardType.Power, text, performKey)
    {
        Effect = effect;
    }

    public override PlayResult OnPlay(PlayContext ctx)
    {
        var events = new List<FightEvent>();
        Effect.Apply(ctx, events);
        return new PlayResult(events, PerformKey);
    }
}

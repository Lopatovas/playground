using Holdfast.Domain.Actors;
using Holdfast.Domain.Combat;
using Holdfast.Domain.Dice;

namespace Holdfast.Domain.Cards;

public enum CardType
{
    Attack,
    Skill,
    Power
}

public sealed record PlayContext(
    Actor Source,
    IReadOnlyList<Actor> Targets,
    Encounter Encounter,
    IRandom Random);

public sealed record FightEvent(string Kind, string Text, int Amount = 0);

public sealed record PlayResult(IReadOnlyList<FightEvent> Events, string PerformKey);

public abstract class Card
{
    public string Id { get; }
    public string Name { get; }
    public int Cost { get; }
    public CardType Type { get; }
    public string Text { get; }
    public string PerformKey { get; }

    protected Card(string id, string name, int cost, CardType type, string text, string? performKey = null)
    {
        Id = id;
        Name = name;
        Cost = cost;
        Type = type;
        Text = text;
        PerformKey = performKey ?? id;
    }

    public abstract PlayResult OnPlay(PlayContext ctx);
}

using Holdfast.Domain.Actors;
using Holdfast.Domain.Cards;
using Holdfast.Domain.Dice;

namespace Holdfast.Domain.Combat;

public enum EncounterStatus
{
    Fighting,
    Won,
    Lost
}

public sealed class Encounter
{
    public Dwarf Dwarf { get; }
    public List<Enemy> Enemies { get; }
    public int HandSize { get; }
    public EncounterStatus Status { get; private set; } = EncounterStatus.Fighting;

    public Encounter(Dwarf dwarf, IEnumerable<Enemy> enemies, int handSize)
    {
        Dwarf = dwarf;
        Enemies = [..enemies];
        HandSize = handSize;
    }

    public IReadOnlyList<Enemy> Living => Enemies.Where(e => !e.IsDead).ToList();

    public void Open(IRandom random)
    {
        Dwarf.BeginFight();
        Dwarf.Deck.ShuffleDraw(random);
        Dwarf.Deck.DrawTo(HandSize, random);
        Dwarf.Energy = Dwarf.MaxEnergy;
        foreach (var enemy in Living)
        {
            enemy.Telegraph(random);
        }
    }

    public PlayResult Play(int handIndex, int targetIndex, IRandom random)
    {
        if (Status != EncounterStatus.Fighting)
        {
            throw new InvalidOperationException("Fight is over.");
        }

        var card = Dwarf.Deck.Hand[handIndex];
        if (card.Cost > Dwarf.Energy)
        {
            throw new InvalidOperationException("Not enough energy.");
        }

        var targets = PickTargets(card, targetIndex);
        Dwarf.Energy -= card.Cost;
        Dwarf.Deck.TakeHand(handIndex);
        var result = card.OnPlay(new PlayContext(Dwarf, targets, this, random));
        Dwarf.Deck.Discard(card);
        RefreshStatus();
        return result;
    }

    public List<FightEvent> EndTurn(IRandom random)
    {
        var events = new List<FightEvent>();
        Dwarf.Deck.DiscardHand();
        foreach (var enemy in Living)
        {
            events.AddRange(enemy.ResolveIntent(this, random));
            if (Dwarf.IsDead)
            {
                Status = EncounterStatus.Lost;
                return events;
            }
        }

        RefreshStatus();
        if (Status != EncounterStatus.Fighting)
        {
            return events;
        }

        Dwarf.ClearBlock();
        foreach (var enemy in Living)
        {
            enemy.ClearBlock();
        }

        Dwarf.Energy = Dwarf.MaxEnergy;
        Dwarf.Deck.DrawTo(HandSize, random);
        foreach (var enemy in Living)
        {
            enemy.Telegraph(random);
        }

        return events;
    }

    private List<Actor> PickTargets(Card card, int targetIndex)
    {
        var living = Living;
        if (card.Type != CardType.Attack || living.Count == 0)
        {
            return [];
        }

        var i = Math.Clamp(targetIndex, 0, living.Count - 1);
        return [living[i]];
    }

    private void RefreshStatus()
    {
        if (Dwarf.IsDead)
        {
            Status = EncounterStatus.Lost;
        }
        else if (Living.Count == 0)
        {
            Status = EncounterStatus.Won;
        }
    }
}

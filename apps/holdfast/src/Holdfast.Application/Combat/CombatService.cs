using Holdfast.Domain;
using Holdfast.Domain.Actors;
using Holdfast.Domain.Cards;
using Holdfast.Domain.Combat;
using Holdfast.Domain.Dice;

namespace Holdfast.Application.Combat;

public sealed class CombatService
{
    public Encounter Start(Dwarf dwarf, IReadOnlyList<Enemy> enemies, GameTuning tuning, IRandom rng)
    {
        var encounter = new Encounter(dwarf, enemies.Select(e => e.Spawn()), tuning.HandSize);
        encounter.Open(rng);
        return encounter;
    }

    public PlayResult Play(Encounter encounter, int handIndex, int targetIndex, IRandom rng) =>
        encounter.Play(handIndex, targetIndex, rng);

    public IReadOnlyList<FightEvent> EndTurn(Encounter encounter, IRandom rng) =>
        encounter.EndTurn(rng);
}

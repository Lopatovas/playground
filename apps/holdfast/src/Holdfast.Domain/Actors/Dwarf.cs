using Holdfast.Domain.Cards;
using Holdfast.Domain.Combat;

namespace Holdfast.Domain.Actors;

public sealed class Dwarf : Actor
{
    public ClassId Class { get; }
    public int Energy { get; set; }
    public int MaxEnergy { get; }
    public int Grit { get; set; }
    public RuneList Runes { get; } = new();
    public Deck Deck { get; }

    public Dwarf(ClassId cls, int maxHp, int maxEnergy, IEnumerable<Card> starter)
        : base("dwarf", cls == ClassId.Warrior ? "Warrior" : "Runesmith", maxHp)
    {
        Class = cls;
        MaxEnergy = maxEnergy;
        Energy = maxEnergy;
        Deck = new Deck(starter);
    }

    public override IncomingResult Incoming(Hit hit)
    {
        if (hit.Total < Grit)
        {
            return new IncomingResult(true, 0, 0, $"{Name} shrugs {hit.Total} (Grit {Grit}).");
        }

        return base.Incoming(hit);
    }

    public void BeginFight()
    {
        Grit = 0;
        Might = 0;
        Brace = 0;
        Block = 0;
        Runes.Clear();
        Energy = MaxEnergy;
        Deck.ResetForFight();
    }
}

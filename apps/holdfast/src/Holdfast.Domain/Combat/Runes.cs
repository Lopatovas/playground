using Holdfast.Domain.Dice;

namespace Holdfast.Domain.Combat;

public abstract class Rune
{
    public abstract string Label { get; }
}

public sealed class NextAttackBonusRune : Rune
{
    public DiceExpression Extra { get; }
    public NextAttackBonusRune(DiceExpression extra) => Extra = extra;
    public override string Label => $"+{Extra.Printed} next Attack";
}

public sealed class RuneList
{
    private readonly List<Rune> _runes = [];
    public IReadOnlyList<Rune> All => _runes;
    public void Add(Rune rune) => _runes.Add(rune);
    public void Clear() => _runes.Clear();

    public int SpendAttackBonus(IRandom random)
    {
        var extra = 0;
        for (var i = _runes.Count - 1; i >= 0; i--)
        {
            if (_runes[i] is NextAttackBonusRune bonus)
            {
                extra += bonus.Extra.Roll(random);
                _runes.RemoveAt(i);
            }
        }

        return extra;
    }
}

using System.Text.RegularExpressions;

namespace Holdfast.Domain.Dice;

public sealed partial class DiceExpression
{
    private static readonly Regex Pattern = ParseRegex();

    public int Count { get; }
    public int Sides { get; }
    public int Bonus { get; }

    public DiceExpression(int count, int sides, int bonus)
    {
        Count = count;
        Sides = sides;
        Bonus = bonus;
    }

    public int Min => (Sides == 0 ? 0 : Count) + Bonus;
    public int Max => (Sides == 0 ? 0 : Count * Sides) + Bonus;
    public string Printed => Sides == 0 ? Bonus.ToString() : $"{Count}d{Sides}{(Bonus > 0 ? $"+{Bonus}" : Bonus < 0 ? $"{Bonus}" : "")}";

    public int Roll(IRandom random)
    {
        var total = Bonus;
        for (var i = 0; i < Count; i++)
        {
            total += Sides <= 0 ? 0 : random.Next(1, Sides + 1);
        }

        return total;
    }

    public static DiceExpression Parse(string text)
    {
        if (int.TryParse(text.Trim(), out var flat))
        {
            return new DiceExpression(0, 0, flat);
        }

        var m = Pattern.Match(text.Trim());
        if (!m.Success)
        {
            throw new FormatException($"Bad dice '{text}'.");
        }

        var count = int.Parse(m.Groups[1].Value);
        var sides = int.Parse(m.Groups[2].Value);
        var bonus = m.Groups[3].Success ? int.Parse(m.Groups[3].Value) : 0;
        return new DiceExpression(count, sides, bonus);
    }

    public static DiceExpression? ParseOrNull(string? text) =>
        string.IsNullOrWhiteSpace(text) ? null : Parse(text);

    [GeneratedRegex(@"^(\d+)d(\d+)([+-]\d+)?$", RegexOptions.IgnoreCase)]
    private static partial Regex ParseRegex();
}

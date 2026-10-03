using Holdfast.Domain.Actors;
using Holdfast.Domain.Cards;
using Holdfast.Domain.Dice;

namespace Holdfast.Application.Content;

public sealed class CardDto
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Type { get; set; } = "";
    public int Cost { get; set; }
    public int Count { get; set; } = 1;
    public string? Dice { get; set; }
    public string Text { get; set; } = "";
    public EffectDto? Effect { get; set; }
}

public sealed class EffectDto
{
    public string Kind { get; set; } = "";
    public int Amount { get; set; }
    public string? Dice { get; set; }
}

public static class CardFactory
{
    public static Card FromDto(CardDto dto)
    {
        var type = Enum.Parse<CardType>(dto.Type, true);
        var effect = ToEffect(dto.Effect);
        var dice = DiceExpression.ParseOrNull(dto.Dice);
        return type switch
        {
            CardType.Attack => new AttackCard(dto.Id, dto.Name, dto.Cost, dice ?? throw new InvalidOperationException(dto.Id), dto.Text, effect),
            CardType.Power => new PowerCard(dto.Id, dto.Name, dto.Cost, dto.Text, effect ?? throw new InvalidOperationException(dto.Id)),
            _ => new SkillCard(dto.Id, dto.Name, dto.Cost, dto.Text, dice, effect)
        };
    }

    public static IEffect? ToEffect(EffectDto? dto)
    {
        if (dto is null || string.IsNullOrWhiteSpace(dto.Kind))
        {
            return null;
        }

        return dto.Kind switch
        {
            "gainGrit" => new GainGritEffect(dto.Amount),
            "gainMight" => new GainMightEffect(dto.Amount),
            "gainBrace" => new GainBraceEffect(dto.Amount),
            "inscribeNextAttack" => new InscribeNextAttackEffect(DiceExpression.Parse(dto.Dice ?? "1d4")),
            _ => throw new InvalidOperationException($"Unknown effect '{dto.Kind}'.")
        };
    }
}

public sealed class EnemyDto
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public int Hp { get; set; }
    public string Portrait { get; set; } = "knuckle";
    public List<IntentDto> Intents { get; set; } = [];
}

public sealed class IntentDto
{
    public string Kind { get; set; } = "Attack";
    public string? Dice { get; set; }
    public int Amount { get; set; }
    public int Weight { get; set; } = 1;
}

public static class EnemyFactory
{
    public static Enemy FromDto(EnemyDto dto) =>
        new(
            dto.Id,
            dto.Name,
            dto.Hp,
            dto.Portrait,
            dto.Intents.Select(i => new IntentSpec(
                Enum.Parse<IntentKind>(i.Kind, true),
                i.Dice,
                i.Amount,
                i.Weight)).ToList());
}

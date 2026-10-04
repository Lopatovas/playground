namespace Holdfast.Domain;

public sealed class GameTuning
{
    public int HandSize { get; init; } = 5;
    public int Energy { get; init; } = 3;
    public int StartingHp { get; init; } = 40;
    public int StartingGold { get; init; } = 50;
    public int MapNodes { get; init; } = 10;
    public int CardRewardChoices { get; init; } = 3;
    public int ShowUp { get; init; } = 4;
    public int PerNode { get; init; } = 2;
    public int EliteBonus { get; init; } = 6;
    public int TreasureBonus { get; init; } = 4;
    public int DoorBonus { get; init; } = 12;
    public int FirstSeenBonus { get; init; } = 2;
}

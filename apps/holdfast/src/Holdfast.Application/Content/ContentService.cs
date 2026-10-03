using System.Text.Json;
using Holdfast.Domain;
using Holdfast.Domain.Actors;
using Holdfast.Domain.Cards;
using Holdfast.Domain.Hold;

namespace Holdfast.Application.Content;

public interface IContentSource
{
    string ReadTuning();
    string ReadLedger();
    string ReadStarter(string classId);
    string ReadPool(string classId);
    IReadOnlyList<string> ReadEnemyFiles();
}

public sealed class GameCatalog
{
    public GameTuning Tuning { get; init; } = new();
    public Ledger Ledger { get; init; } = new([], [], []);
    public Dictionary<ClassId, List<CardDto>> Starters { get; init; } = [];
    public Dictionary<ClassId, List<Card>> Pools { get; init; } = [];
    public List<Enemy> Enemies { get; init; } = [];
    public Enemy Elite { get; init; } = EnemyFactory.FromDto(new EnemyDto { Id = "elite", Name = "Deep Knuckle", Hp = 28, Portrait = "knuckle", Intents = [new() { Kind = "Attack", Dice = "2d4", Weight = 2 }, new() { Kind = "BuffMight", Amount = 2, Weight = 1 }] });
    public Enemy Door { get; init; } = EnemyFactory.FromDto(new EnemyDto { Id = "door", Name = "The Door", Hp = 42, Portrait = "knuckle", Intents = [new() { Kind = "Attack", Dice = "1d6+1", Weight = 2 }, new() { Kind = "BuffMight", Amount = 2, Weight = 1 }] });

    public List<Card> StarterCards(ClassId cls) =>
        Starters[cls].SelectMany(d => Enumerable.Range(0, Math.Max(1, d.Count)).Select(_ => CardFactory.FromDto(d))).ToList();

    public Enemy RandomTrash(Random rng) => Enemies[rng.Next(Enemies.Count)].Spawn();
}

public sealed class ContentService
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly IContentSource _source;
    public GameCatalog Catalog { get; }

    public ContentService(IContentSource source)
    {
        _source = source;
        Catalog = Load();
    }

    private GameCatalog Load()
    {
        var tuningRaw = JsonDocument.Parse(_source.ReadTuning()).RootElement;
        var tuning = new GameTuning
        {
            HandSize = tuningRaw.GetProperty("handSize").GetInt32(),
            Energy = tuningRaw.GetProperty("energy").GetInt32(),
            StartingHp = tuningRaw.GetProperty("startingHp").GetInt32(),
            StartingGold = tuningRaw.GetProperty("startingGold").GetInt32(),
            MapNodes = tuningRaw.GetProperty("mapNodes").GetInt32(),
            CardRewardChoices = tuningRaw.GetProperty("cardRewardChoices").GetInt32(),
            ShowUp = tuningRaw.GetProperty("runestones").GetProperty("showUp").GetInt32(),
            PerNode = tuningRaw.GetProperty("runestones").GetProperty("perNode").GetInt32(),
            EliteBonus = tuningRaw.GetProperty("runestones").GetProperty("eliteBonus").GetInt32(),
            TreasureBonus = tuningRaw.GetProperty("runestones").GetProperty("treasureBonus").GetInt32(),
            DoorBonus = tuningRaw.GetProperty("runestones").GetProperty("doorBonus").GetInt32(),
            FirstSeenBonus = tuningRaw.GetProperty("runestones").GetProperty("firstSeenBonus").GetInt32()
        };

        var starters = new Dictionary<ClassId, List<CardDto>>
        {
            [ClassId.Warrior] = ReadStarter("warrior"),
            [ClassId.Runesmith] = ReadStarter("runesmith")
        };
        var pools = new Dictionary<ClassId, List<Card>>
        {
            [ClassId.Warrior] = ReadPool("warrior"),
            [ClassId.Runesmith] = ReadPool("runesmith")
        };
        var enemies = _source.ReadEnemyFiles()
            .Select(json => EnemyFactory.FromDto(JsonSerializer.Deserialize<EnemyDto>(json, JsonOpts)!))
            .ToList();

        return new GameCatalog
        {
            Tuning = tuning,
            Ledger = ReadLedger(),
            Starters = starters,
            Pools = pools,
            Enemies = enemies
        };
    }

    private List<CardDto> ReadStarter(string classId)
    {
        using var doc = JsonDocument.Parse(_source.ReadStarter(classId));
        return doc.RootElement.GetProperty("cards").EnumerateArray()
            .Select(el => JsonSerializer.Deserialize<CardDto>(el.GetRawText(), JsonOpts)!)
            .ToList();
    }

    private List<Card> ReadPool(string classId)
    {
        var json = _source.ReadPool(classId);
        var list = JsonSerializer.Deserialize<List<CardDto>>(json, JsonOpts) ?? [];
        return list.Select(CardFactory.FromDto).ToList();
    }

    private Ledger ReadLedger()
    {
        using var doc = JsonDocument.Parse(_source.ReadLedger());
        var root = doc.RootElement;
        return new Ledger(
            ReadNodes(root.GetProperty("frame")),
            ReadNodes(root.GetProperty("hearth")),
            new Dictionary<ClassId, List<LedgerNode>>
            {
                [ClassId.Warrior] = ReadNodes(root.GetProperty("spark").GetProperty("warrior")),
                [ClassId.Runesmith] = ReadNodes(root.GetProperty("spark").GetProperty("runesmith"))
            });
    }

    private static List<LedgerNode> ReadNodes(JsonElement arr)
    {
        var list = new List<LedgerNode>();
        foreach (var el in arr.EnumerateArray())
        {
            var requires = el.TryGetProperty("requires", out var req)
                ? req.EnumerateArray().Select(x => x.GetString()!).ToList()
                : [];
            var effect = new Dictionary<string, object>();
            if (el.TryGetProperty("effect", out var fx))
            {
                foreach (var p in fx.EnumerateObject())
                {
                    effect[p.Name] = p.Value.ValueKind == JsonValueKind.Number
                        ? p.Value.GetInt32()
                        : p.Value.ToString();
                }
            }

            list.Add(new LedgerNode(
                el.GetProperty("id").GetString()!,
                el.GetProperty("name").GetString()!,
                el.GetProperty("cost").GetInt32(),
                requires,
                effect));
        }

        return list;
    }
}

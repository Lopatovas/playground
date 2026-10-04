using Holdfast.Application.Content;
using Holdfast.Domain;
using Holdfast.Domain.Actors;
using Holdfast.Domain.Cards;
using Holdfast.Domain.Combat;
using Holdfast.Domain.Dice;
using Holdfast.Domain.Hold;
using Holdfast.Domain.Map;

namespace Holdfast.Application.Run;

public sealed class RunState
{
    public ClassId Class { get; init; }
    public Dwarf Dwarf { get; init; } = null!;
    public int Gold { get; set; }
    public MapGraph Map { get; init; } = null!;
    public string CurrentId { get; set; } = "";
    public int NodesWalked { get; set; }
    public int Elites { get; set; }
    public int Treasures { get; set; }
    public bool HitDoor { get; set; }
    public Encounter? Fight { get; set; }
    public List<Card> RewardChoices { get; } = [];
    public List<Card> ShopStock { get; } = [];
    public bool Alive { get; set; } = true;
    public bool Won { get; set; }
}

public sealed class RunService
{
    private readonly GameCatalog _catalog;
    private readonly GameTuning _tuning;
    private readonly HoldProgress _hold;
    private readonly IRandom _rng;

    public RunState? Current { get; private set; }

    public RunService(GameCatalog catalog, HoldProgress hold, IRandom rng)
    {
        _catalog = catalog;
        _tuning = catalog.Tuning;
        _hold = hold;
        _rng = rng;
    }

    public RunState Start(ClassId cls)
    {
        if (!_hold.Unlocked.Contains(cls))
        {
            throw new InvalidOperationException("Class is locked.");
        }

        var hp = _tuning.StartingHp + _hold.ExtraStartingHp;
        var dwarf = new Dwarf(cls, hp, _tuning.Energy, _catalog.StarterCards(cls));
        var map = MapGraph.Generate(_tuning.MapNodes, _rng);
        Current = new RunState
        {
            Class = cls,
            Dwarf = dwarf,
            Gold = _tuning.StartingGold + _hold.ExtraStartingGold,
            Map = map,
            CurrentId = map.StartId
        };
        return Current;
    }

    public MapNode Here() => Current!.Map.Get(Current.CurrentId);

    public void EnterCurrent()
    {
        var run = Current ?? throw new InvalidOperationException("No run.");
        var node = run.Map.Get(run.CurrentId);
        run.Fight = null;
        run.RewardChoices.Clear();
        run.ShopStock.Clear();
        switch (node.Kind)
        {
            case NodeKind.Fight:
                run.Fight = OpenFight([_catalog.RandomTrash(SystemRng())]);
                break;
            case NodeKind.Elite:
                run.Elites++;
                run.Fight = OpenFight([_catalog.Elite.Spawn()]);
                break;
            case NodeKind.Door:
                run.HitDoor = true;
                run.Fight = OpenFight([_catalog.Door.Spawn()]);
                break;
            case NodeKind.Shop:
                FillShop(run);
                break;
            case NodeKind.Treasure:
                run.Treasures++;
                run.Gold += 40;
                break;
            case NodeKind.Event:
                if (SystemRng().Next(0, 2) == 0)
                {
                    run.Gold += 25;
                }
                else
                {
                    run.Dwarf.Heal(8);
                }

                break;
        }
    }

    public void FinishNode()
    {
        var run = Current!;
        var node = run.Map.Get(run.CurrentId);
        node.Cleared = true;
        run.NodesWalked++;
        if (node.Kind == NodeKind.Door && run.Dwarf.Hp > 0)
        {
            run.Won = true;
        }
    }

    public void WalkTo(string nodeId)
    {
        var run = Current!;
        var here = run.Map.Get(run.CurrentId);
        if (!here.Next.Contains(nodeId) && here.Id != nodeId)
        {
            throw new InvalidOperationException("That path is closed.");
        }

        run.CurrentId = nodeId;
        EnterCurrent();
    }

    public void OfferRewards()
    {
        var run = Current!;
        run.RewardChoices.Clear();
        var pool = _catalog.Pools[run.Class];
        var take = Math.Min(_tuning.CardRewardChoices, pool.Count);
        var bag = pool.OrderBy(_ => _rng.Next(0, 9999)).Take(take).ToList();
        run.RewardChoices.AddRange(bag);
    }

    public void PickReward(int index)
    {
        var run = Current!;
        if (index < 0 || index >= run.RewardChoices.Count)
        {
            return;
        }

        run.Dwarf.Deck.AddToMaster(run.RewardChoices[index]);
        run.RewardChoices.Clear();
    }

    public void Rest()
    {
        var run = Current!;
        var amount = Math.Max(8, run.Dwarf.MaxHp * (_hold.RestUpgrade ? 40 : 30) / 100);
        run.Dwarf.Heal(amount);
    }

    public bool BuyShop(int index)
    {
        var run = Current!;
        if (index < 0 || index >= run.ShopStock.Count)
        {
            return false;
        }

        var price = 50;
        if (run.Gold < price)
        {
            return false;
        }

        run.Gold -= price;
        run.Dwarf.Deck.AddToMaster(run.ShopStock[index]);
        run.ShopStock.RemoveAt(index);
        return true;
    }

    public bool RemoveCard(string cardId)
    {
        var run = Current!;
        var price = 50;
        if (run.Gold < price)
        {
            return false;
        }

        if (!run.Dwarf.Deck.RemoveFromMaster(cardId))
        {
            return false;
        }

        run.Gold -= price;
        return true;
    }

    public int PayoutRunestones()
    {
        var run = Current!;
        var stones = _tuning.ShowUp + run.NodesWalked * _tuning.PerNode
                     + run.Elites * _tuning.EliteBonus
                     + run.Treasures * _tuning.TreasureBonus
                     + (run.HitDoor ? _tuning.DoorBonus : 0);
        return stones;
    }

    public void Die() => Current!.Alive = false;

    private Encounter OpenFight(IReadOnlyList<Enemy> enemies)
    {
        var enc = new Encounter(Current!.Dwarf, enemies, _tuning.HandSize);
        enc.Open(_rng);
        return enc;
    }

    private void FillShop(RunState run)
    {
        var pool = _catalog.Pools[run.Class];
        run.ShopStock.AddRange(pool.OrderBy(_ => _rng.Next(0, 9999)).Take(3));
    }

    private Random SystemRng() => Random.Shared;
}

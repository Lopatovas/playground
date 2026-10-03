using Holdfast.Application.Combat;
using Holdfast.Application.Content;
using Holdfast.Application.HoldCamp;
using Holdfast.Application.Run;
using Holdfast.Domain.Actors;
using Holdfast.Domain.Hold;
using Holdfast.Domain.Combat;
using Holdfast.Domain.Dice;
using Holdfast.Domain.Map;
using Holdfast.Infrastructure;
using Xunit;

namespace Holdfast.Domain.Tests;

public class PlaythroughTests
{
    [Fact]
    public void Autoplay_reaches_rope_or_door()
    {
        var root = ContentRoot();
        var content = new ContentService(new FileContentSource(root));
        var hold = new HoldProgress();
        var runs = new RunService(content.Catalog, hold, new SystemRandom(7));
        var combat = new CombatService();
        var rng = new SystemRandom(7);
        var run = runs.Start(ClassId.Warrior);
        runs.EnterCurrent();
        var guard = 0;
        while (run.Alive && !run.Won && guard++ < 80)
        {
            var node = runs.Here();
            if (run.Fight is { } fight && !node.Cleared)
            {
                PlayFight(combat, fight, rng);
                if (fight.Status == EncounterStatus.Lost)
                {
                    run.Alive = false;
                    break;
                }

                if (node.Kind == NodeKind.Door)
                {
                    runs.FinishNode();
                    break;
                }

                runs.OfferRewards();
                if (run.RewardChoices.Count > 0)
                {
                    runs.PickReward(0);
                }

                runs.FinishNode();
                continue;
            }

            if (!node.Cleared)
            {
                if (node.Kind == NodeKind.Rest)
                {
                    runs.Rest();
                }

                if (node.Kind == NodeKind.Shop && run.ShopStock.Count > 0 && run.Gold >= 50)
                {
                    runs.BuyShop(0);
                }

                runs.FinishNode();
            }

            if (node.Next.Count == 0)
            {
                break;
            }

            runs.WalkTo(node.Next[0]);
        }

        Assert.True(run.Won || !run.Alive || runs.PayoutRunestones() >= 4);
        var stones = runs.PayoutRunestones();
        var camp = new HoldService(hold, content.Catalog.Ledger);
        camp.GrantRunestones(stones);
        Assert.True(camp.Progress.Runestones >= 4);
    }

    private static void PlayFight(CombatService combat, Encounter fight, IRandom rng)
    {
        var turns = 0;
        while (fight.Status == EncounterStatus.Fighting && turns++ < 30)
        {
            var played = false;
            for (var i = 0; i < fight.Dwarf.Deck.Hand.Count; i++)
            {
                if (fight.Dwarf.Deck.Hand[i].Cost <= fight.Dwarf.Energy)
                {
                    combat.Play(fight, i, 0, rng);
                    played = true;
                    break;
                }
            }

            if (!played || fight.Dwarf.Energy == 0 || fight.Dwarf.Deck.Hand.All(c => c.Cost > fight.Dwarf.Energy))
            {
                combat.EndTurn(fight, rng);
            }
        }
    }

    private static string ContentRoot()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir is not null && !File.Exists(Path.Combine(dir.FullName, "content", "tuning.json")))
        {
            dir = dir.Parent;
        }

        return Path.Combine(dir!.FullName, "content");
    }
}

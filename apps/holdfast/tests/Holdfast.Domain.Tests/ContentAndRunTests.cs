using Holdfast.Application.Content;
using Holdfast.Application.HoldCamp;
using Holdfast.Application.Run;
using Holdfast.Domain.Actors;
using Holdfast.Domain.Dice;
using Holdfast.Infrastructure;
using Xunit;

namespace Holdfast.Domain.Tests;

public class ContentAndRunTests
{
    private static string ContentRoot()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir is not null && !File.Exists(Path.Combine(dir.FullName, "content", "tuning.json")))
        {
            dir = dir.Parent;
        }

        Assert.NotNull(dir);
        return Path.Combine(dir!.FullName, "content");
    }

    [Fact]
    public void Catalog_reads_json_starters()
    {
        var content = new ContentService(new FileContentSource(ContentRoot()));
        var cards = content.Catalog.StarterCards(ClassId.Warrior);
        Assert.Equal(10, cards.Count);
        Assert.Contains(cards, c => c.Name == "Hew");
        Assert.Contains(cards, c => c.Name == "Numb");
    }

    [Fact]
    public void Floor4_rope_buys_frame()
    {
        var content = new ContentService(new FileContentSource(ContentRoot()));
        var hold = new HoldService(new Domain.Hold.HoldProgress { Runestones = 0 }, content.Catalog.Ledger);
        var stones = content.Catalog.Tuning.ShowUp + 4 * content.Catalog.Tuning.PerNode;
        hold.GrantRunestones(stones);
        Assert.True(hold.Buy("hp_1"));
        Assert.Equal(stones - 6, hold.Progress.Runestones);
    }

    [Fact]
    public void Run_can_start_and_fight()
    {
        var content = new ContentService(new FileContentSource(ContentRoot()));
        var runs = new RunService(content.Catalog, new Domain.Hold.HoldProgress(), new SystemRandom(1));
        var run = runs.Start(ClassId.Warrior);
        runs.EnterCurrent();
        Assert.NotNull(run.Fight);
        Assert.Equal(5, run.Dwarf.Deck.Hand.Count);
    }
}

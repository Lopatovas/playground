using Holdfast.Application.Combat;
using Holdfast.Application.Content;
using Holdfast.Domain;
using Holdfast.Domain.Actors;
using Holdfast.Domain.Cards;
using Holdfast.Domain.Combat;
using Holdfast.Domain.Dice;
using Xunit;

namespace Holdfast.Domain.Tests;

public class CombatTests
{
    [Fact]
    public void Dice_prints_and_rolls_fixed()
    {
        var d = DiceExpression.Parse("1d4+2");
        Assert.Equal("1d4+2", d.Printed);
        Assert.Equal(3, d.Min);
        Assert.Equal(6, d.Max);
        Assert.Equal(5, d.Roll(new FixedRandom(3)));
    }

    [Fact]
    public void Grit_shrugs_nicks()
    {
        var dwarf = new Dwarf(ClassId.Warrior, 40, 3, []);
        dwarf.Grit = 5;
        var r = dwarf.Incoming(new Hit(2, 2));
        Assert.True(r.Shrugged);
        Assert.Equal(40, dwarf.Hp);
        Assert.Equal(0, dwarf.Block);
    }

    [Fact]
    public void Grit_fails_and_block_works()
    {
        var dwarf = new Dwarf(ClassId.Warrior, 40, 3, []);
        dwarf.Grit = 5;
        dwarf.GainBlock(3);
        var r = dwarf.Incoming(new Hit(4, 2));
        Assert.False(r.Shrugged);
        Assert.Equal(3, r.BlockSpent);
        Assert.Equal(37, dwarf.Hp);
    }

    [Fact]
    public void Hew_onPlay_hits_via_subclass_not_id_switch()
    {
        var hew = new AttackCard("w_strike", "Hew", 1, DiceExpression.Parse("1d6"), "Deal");
        var dwarf = new Dwarf(ClassId.Warrior, 40, 3, [hew]);
        var enemy = new Enemy("k", "Knuckle", 14, "knuckle", [new IntentSpec(IntentKind.Attack, "1d4", 0, 1)]);
        var enc = new Encounter(dwarf, [enemy], 5);
        dwarf.BeginFight();
        dwarf.Deck.DrawTo(1, new FixedRandom());
        dwarf.Energy = 3;
        var combat = new CombatService();
        var result = combat.Play(enc, 0, 0, new FixedRandom(6));
        Assert.Contains(result.Events, e => e.Kind == "hit");
        Assert.True(enemy.Hp < 14);
    }

    [Fact]
    public void Numb_is_skill_effect()
    {
        var numb = new SkillCard("w_numb", "Numb", 1, "Grit", effect: new GainGritEffect(2));
        var dwarf = new Dwarf(ClassId.Warrior, 40, 3, [numb]);
        var enc = new Encounter(dwarf, [], 5);
        dwarf.BeginFight();
        dwarf.Deck.DrawTo(1, new FixedRandom());
        numb.OnPlay(new PlayContext(dwarf, [], enc, new FixedRandom()));
        Assert.Equal(2, dwarf.Grit);
    }
}

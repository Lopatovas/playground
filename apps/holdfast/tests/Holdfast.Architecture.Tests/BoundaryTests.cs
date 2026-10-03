using System.Reflection;
using Holdfast.Application.Settings;
using Holdfast.Domain.Cards;
using Xunit;

namespace Holdfast.Architecture.Tests;

public class BoundaryTests
{
    [Fact]
    public void Domain_has_no_godot_reference()
    {
        var asm = typeof(Card).Assembly;
        Assert.DoesNotContain(asm.GetReferencedAssemblies(), a => a.Name!.Contains("Godot", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Settings_type_does_not_touch_cards()
    {
        var settings = typeof(SettingsService);
        Assert.DoesNotContain(settings.Assembly.GetTypes().Where(t => t.Namespace == settings.Namespace), t => t.Name.Contains("Card"));
        var src = settings.ToString();
        Assert.DoesNotContain("AttackCard", src);
    }

    [Fact]
    public void Card_is_abstract_and_has_onplay()
    {
        Assert.True(typeof(Card).IsAbstract);
        Assert.NotNull(typeof(Card).GetMethod("OnPlay"));
        Assert.True(typeof(AttackCard).IsSubclassOf(typeof(Card)));
        Assert.True(typeof(SkillCard).IsSubclassOf(typeof(Card)));
        Assert.True(typeof(PowerCard).IsSubclassOf(typeof(Card)));
    }
}

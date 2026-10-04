using Godot;
using Holdfast.Domain.Cards;

namespace Holdfast.GodotGame;

public static class CardArt
{
    public static Texture2D Frame() =>
        GD.Load<Texture2D>("res://art/card-frame.jpg");

    public static Texture2D For(Card card)
    {
        var path = card.Id switch
        {
            "w_strike" => "res://art/cards/hew.jpg",
            "w_guard" => "res://art/cards/raise.jpg",
            "w_numb" => "res://art/cards/numb.jpg",
            "w_flex" => "res://art/cards/shoulder.jpg",
            _ => card.Type == CardType.Attack ? "res://art/cards/hew.jpg" : "res://art/cards/raise.jpg"
        };
        return GD.Load<Texture2D>(path);
    }
}

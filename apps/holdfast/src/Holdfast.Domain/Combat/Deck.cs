using Holdfast.Domain.Cards;
using Holdfast.Domain.Dice;

namespace Holdfast.Domain.Combat;

public sealed class Deck
{
    private readonly List<Card> _draw = [];
    private readonly List<Card> _discard = [];
    private readonly List<Card> _hand = [];
    private readonly List<Card> _master;

    public IReadOnlyList<Card> Hand => _hand;
    public IReadOnlyList<Card> DrawPile => _draw;
    public IReadOnlyList<Card> DiscardPile => _discard;
    public IReadOnlyList<Card> Master => _master;
    public int Count => _master.Count;

    public Deck(IEnumerable<Card> cards) => _master = [..cards];

    public void ResetForFight()
    {
        _hand.Clear();
        _discard.Clear();
        _draw.Clear();
        _draw.AddRange(_master);
    }

    public void ShuffleDraw(IRandom random)
    {
        for (var i = _draw.Count - 1; i > 0; i--)
        {
            var j = random.Next(0, i + 1);
            (_draw[i], _draw[j]) = (_draw[j], _draw[i]);
        }
    }

    public void DrawTo(int handSize, IRandom random)
    {
        while (_hand.Count < handSize)
        {
            if (_draw.Count == 0)
            {
                if (_discard.Count == 0)
                {
                    break;
                }

                _draw.AddRange(_discard);
                _discard.Clear();
                ShuffleDraw(random);
            }

            var i = _draw.Count - 1;
            _hand.Add(_draw[i]);
            _draw.RemoveAt(i);
        }
    }

    public Card TakeHand(int index)
    {
        var card = _hand[index];
        _hand.RemoveAt(index);
        return card;
    }

    public void Discard(Card card) => _discard.Add(card);

    public void DiscardHand()
    {
        _discard.AddRange(_hand);
        _hand.Clear();
    }

    public void AddToMaster(Card card) => _master.Add(card);

    public bool RemoveFromMaster(string cardId)
    {
        var i = _master.FindIndex(c => c.Id == cardId);
        if (i < 0)
        {
            return false;
        }

        _master.RemoveAt(i);
        return true;
    }
}

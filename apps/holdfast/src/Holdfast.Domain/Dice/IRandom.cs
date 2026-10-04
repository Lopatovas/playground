namespace Holdfast.Domain.Dice;

public interface IRandom
{
    int Next(int minInclusive, int maxExclusive);
}

public sealed class SystemRandom : IRandom
{
    private readonly Random _r;
    public SystemRandom(int? seed = null) => _r = seed is int s ? new Random(s) : new Random();
    public int Next(int minInclusive, int maxExclusive) => _r.Next(minInclusive, maxExclusive);
}

public sealed class FixedRandom : IRandom
{
    private readonly Queue<int> _values;
    public FixedRandom(params int[] values) => _values = new Queue<int>(values);
    public int Next(int minInclusive, int maxExclusive)
    {
        if (_values.Count == 0)
        {
            return minInclusive;
        }

        var v = _values.Dequeue();
        if (v < minInclusive)
        {
            return minInclusive;
        }

        if (v >= maxExclusive)
        {
            return maxExclusive - 1;
        }

        return v;
    }
}

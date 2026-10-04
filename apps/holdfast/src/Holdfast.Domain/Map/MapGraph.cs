using Holdfast.Domain.Dice;

namespace Holdfast.Domain.Map;

public enum NodeKind
{
    Fight,
    Elite,
    Shop,
    Rest,
    Event,
    Treasure,
    Door
}

public sealed class MapNode
{
    public string Id { get; }
    public int Layer { get; }
    public int Slot { get; }
    public NodeKind Kind { get; }
    public List<string> Next { get; } = [];
    public bool Cleared { get; set; }

    public MapNode(string id, int layer, int slot, NodeKind kind)
    {
        Id = id;
        Layer = layer;
        Slot = slot;
        Kind = kind;
    }
}

public sealed class MapGraph
{
    public List<MapNode> Nodes { get; }
    public string StartId { get; }

    public MapGraph(List<MapNode> nodes, string startId)
    {
        Nodes = nodes;
        StartId = startId;
    }

    public MapNode Get(string id) => Nodes.First(n => n.Id == id);

    public static MapGraph Generate(int layers, IRandom random)
    {
        layers = Math.Max(6, layers);
        var nodes = new List<MapNode>();
        var byLayer = new List<List<MapNode>>();

        for (var layer = 0; layer < layers; layer++)
        {
            var row = new List<MapNode>();
            var count = layer == 0 || layer == layers - 1 ? 1 : layer is 3 or 6 ? 2 : 3;
            if (layer == 1)
            {
                count = 2;
            }

            for (var slot = 0; slot < count; slot++)
            {
                var kind = PickKind(layer, layers, slot, random);
                var node = new MapNode($"{layer}-{slot}", layer, slot, kind);
                row.Add(node);
                nodes.Add(node);
            }

            byLayer.Add(row);
        }

        for (var layer = 0; layer < layers - 1; layer++)
        {
            var next = byLayer[layer + 1];
            foreach (var node in byLayer[layer])
            {
                var left = Math.Clamp(node.Slot, 0, next.Count - 1);
                node.Next.Add(next[left].Id);
                if (next.Count > 1 && left + 1 < next.Count && random.Next(0, 2) == 0)
                {
                    node.Next.Add(next[left + 1].Id);
                }

                if (node.Next.Count == 0)
                {
                    node.Next.Add(next[0].Id);
                }
            }

            foreach (var nxt in next)
            {
                if (byLayer[layer].All(n => !n.Next.Contains(nxt.Id)))
                {
                    byLayer[layer][0].Next.Add(nxt.Id);
                }
            }
        }

        return new MapGraph(nodes, byLayer[0][0].Id);
    }

    private static NodeKind PickKind(int layer, int layers, int slot, IRandom random)
    {
        if (layer == 0)
        {
            return NodeKind.Fight;
        }

        if (layer == layers - 1)
        {
            return NodeKind.Door;
        }

        if (layer == layers - 2)
        {
            return slot == 0 ? NodeKind.Rest : NodeKind.Shop;
        }

        if (layer == 3)
        {
            return slot == 0 ? NodeKind.Shop : NodeKind.Rest;
        }

        if (layer == 5)
        {
            return slot == 0 ? NodeKind.Elite : NodeKind.Treasure;
        }

        if (layer == 4 && slot == 2)
        {
            return NodeKind.Event;
        }

        return random.Next(0, 6) == 0 ? NodeKind.Event : NodeKind.Fight;
    }
}

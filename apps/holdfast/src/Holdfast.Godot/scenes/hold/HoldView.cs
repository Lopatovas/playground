using Godot;
using Holdfast.Application.HoldCamp;
using Holdfast.Domain.Actors;

namespace Holdfast.GodotGame;

public partial class HoldView : Control
{
    public event Action<ClassId>? Walk;
    public event Action<string>? Buy;
    public event Action? Peek;

    private HoldHall _hall = null!;
    private HoldHud _hud = null!;
    private SubViewport _view = null!;

    public override void _Ready()
    {
        SetAnchorsAndOffsetsPreset(LayoutPreset.FullRect);
        MouseFilter = MouseFilterEnum.Stop;

        var host = new SubViewportContainer
        {
            Stretch = true,
            MouseFilter = MouseFilterEnum.Ignore
        };
        host.SetAnchorsAndOffsetsPreset(LayoutPreset.FullRect);
        _view = new SubViewport
        {
            Size = new Vector2I(1280, 720),
            HandleInputLocally = false,
            PhysicsObjectPicking = true,
            OwnWorld3D = true,
            RenderTargetUpdateMode = SubViewport.UpdateMode.Always,
            Msaa3D = Viewport.Msaa.Msaa2X
        };
        _hall = new HoldHall();
        _view.AddChild(_hall);
        host.AddChild(_view);
        AddChild(host);

        _hud = new HoldHud();
        _hud.SetAnchorsAndOffsetsPreset(LayoutPreset.FullRect);
        _hud.Buy += id => Buy?.Invoke(id);
        AddChild(_hud);
    }

    public override void _Process(double delta)
    {
        if (!Visible)
        {
            return;
        }

        _hud.SetFocus(_hall.Query(GetLocalMousePosition(), Size));
    }

    public override void _GuiInput(InputEvent @event)
    {
        if (@event is not InputEventMouseButton { Pressed: true, ButtonIndex: MouseButton.Left })
        {
            return;
        }

        var hit = _hall.Query(GetLocalMousePosition(), Size);
        switch (hit)
        {
            case "door":
                Walk?.Invoke(ClassId.Warrior);
                break;
            case "book":
                _hud.ToggleJournal();
                break;
            case "winch":
                _hud.Whisper("The rope-crews wait. The dark is still.");
                Peek?.Invoke();
                break;
        }
    }

    public void Bind(HoldService hold)
    {
        _hud.Bind(hold);
    }
}

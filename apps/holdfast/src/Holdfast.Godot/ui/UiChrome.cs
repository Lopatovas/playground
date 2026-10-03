using Godot;

namespace Holdfast.GodotGame;

public static class UiChrome
{
    public static readonly Color Gold = new(0.91f, 0.84f, 0.64f);
    public static readonly Color Muted = new(0.78f, 0.70f, 0.52f);
    public static readonly Color Ink = new(0.05f, 0.04f, 0.03f);
    public static readonly Color Stone = new(0.10f, 0.08f, 0.06f, 0.90f);
    public static readonly Color Brass = new(0.72f, 0.58f, 0.32f);
    public static readonly Color Blood = new(0.62f, 0.18f, 0.14f);
    public static readonly Color Moss = new(0.28f, 0.42f, 0.30f);

    public static FontFile Regular { get; private set; } = null!;
    public static FontFile Bold { get; private set; } = null!;
    public static Texture2D CardPlate { get; private set; } = null!;

    public static void Ensure()
    {
        if (Regular is not null)
        {
            return;
        }

        Regular = GD.Load<FontFile>("res://fonts/LiberationSans-Regular.ttf")
            ?? throw new InvalidOperationException("Missing LiberationSans-Regular.ttf");
        Bold = GD.Load<FontFile>("res://fonts/LiberationSans-Bold.ttf") ?? Regular;
        CardPlate = GD.Load<Texture2D>("res://art/card-plate.jpg");
        Warm(Regular);
        Warm(Bold);
    }

    public static Theme GameTheme()
    {
        Ensure();
        var theme = new Theme();
        theme.DefaultFont = Regular;
        theme.DefaultFontSize = 18;
        theme.SetFont("font", "Button", Regular);
        theme.SetFontSize("font_size", "Button", 18);
        theme.SetFont("font", "Label", Regular);
        theme.SetFontSize("font_size", "Label", 18);
        theme.SetColor("font_color", "Button", Gold);
        theme.SetColor("font_hover_color", "Button", Gold);
        theme.SetColor("font_pressed_color", "Button", Gold);
        theme.SetColor("font_disabled_color", "Button", Muted);
        theme.SetStylebox("normal", "Button", StoneBox());
        theme.SetStylebox("hover", "Button", StoneBox(new Color(0.16f, 0.13f, 0.09f, 0.95f)));
        theme.SetStylebox("pressed", "Button", StoneBox(new Color(0.08f, 0.06f, 0.04f, 0.95f)));
        theme.SetStylebox("disabled", "Button", StoneBox(new Color(0.08f, 0.07f, 0.06f, 0.7f)));
        return theme;
    }

    public static StyleBoxFlat StoneBox(Color? fill = null)
    {
        return new StyleBoxFlat
        {
            BgColor = fill ?? Stone,
            BorderColor = Brass,
            BorderWidthLeft = 2,
            BorderWidthTop = 2,
            BorderWidthRight = 2,
            BorderWidthBottom = 2,
            CornerRadiusTopLeft = 3,
            CornerRadiusTopRight = 3,
            CornerRadiusBottomRight = 3,
            CornerRadiusBottomLeft = 3,
            ContentMarginLeft = 14,
            ContentMarginTop = 8,
            ContentMarginRight = 14,
            ContentMarginBottom = 8
        };
    }

    public static StyleBoxFlat GhostBox()
    {
        return new StyleBoxFlat
        {
            BgColor = Colors.Transparent,
            BorderWidthLeft = 0,
            BorderWidthTop = 0,
            BorderWidthRight = 0,
            BorderWidthBottom = 0
        };
    }

    public static Label Text(string value, int size, FontFile? font = null, Color? color = null, bool wrap = false)
    {
        Ensure();
        var l = new Label
        {
            Text = value,
            AutowrapMode = wrap ? TextServer.AutowrapMode.Word : TextServer.AutowrapMode.Off,
            SizeFlagsHorizontal = Control.SizeFlags.ExpandFill
        };
        l.AddThemeFontOverride("font", font ?? Regular);
        l.AddThemeFontSizeOverride("font_size", size);
        l.AddThemeColorOverride("font_color", color ?? Muted);
        return l;
    }

    public static Button StoneButton(string text, Action onPressed, bool enabled = true)
    {
        Ensure();
        var b = new Button
        {
            Text = text,
            Disabled = !enabled,
            AutowrapMode = TextServer.AutowrapMode.WordSmart,
            ClipText = false,
            CustomMinimumSize = new Vector2(0, 48),
            SizeFlagsHorizontal = Control.SizeFlags.ExpandFill
        };
        b.AddThemeFontOverride("font", Regular);
        b.AddThemeFontSizeOverride("font_size", 17);
        b.AddThemeColorOverride("font_color", Gold);
        b.AddThemeStyleboxOverride("normal", StoneBox());
        b.AddThemeStyleboxOverride("hover", StoneBox(new Color(0.16f, 0.13f, 0.09f, 0.95f)));
        b.AddThemeStyleboxOverride("pressed", StoneBox(new Color(0.08f, 0.06f, 0.04f, 0.95f)));
        b.Pressed += onPressed;
        return b;
    }

    public static TextureRect Cover(string path)
    {
        var tex = GD.Load<Texture2D>(path);
        var rect = new TextureRect
        {
            Texture = tex,
            ExpandMode = TextureRect.ExpandModeEnum.IgnoreSize,
            StretchMode = TextureRect.StretchModeEnum.KeepAspectCovered,
            MouseFilter = Control.MouseFilterEnum.Ignore
        };
        rect.SetAnchorsAndOffsetsPreset(Control.LayoutPreset.FullRect);
        return rect;
    }

    public static Texture2D StageTexture(string path, float top = 0.28f, float height = 0.55f)
    {
        var tex = GD.Load<Texture2D>(path);
        if (tex is null)
        {
            throw new InvalidOperationException($"Missing {path}");
        }

        return new AtlasTexture
        {
            Atlas = tex,
            Region = new Rect2(0, tex.GetHeight() * top, tex.GetWidth(), tex.GetHeight() * height)
        };
    }

    private static void Warm(FontFile font)
    {
        const string sample = " ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/-·+";
        foreach (var size in new[] { 14, 16, 18, 22, 28, 40 })
        {
            font.GetStringSize(sample, HorizontalAlignment.Left, -1, size);
        }
    }
}

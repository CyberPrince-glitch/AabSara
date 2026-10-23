import os
from PIL import Image, ImageDraw, ImageFilter

def create_aabsara_icon(size=512):
    # High resolution master (super-sampling for ultra crisp edges)
    SCALE = 4
    W = size * SCALE
    H = size * SCALE
    
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    cx = W / 2
    cy = H / 2
    r_outer = W * 0.46
    
    # Hexagon points (pointed top and bottom)
    # 50,6  88,27  88,73  50,94  12,73  12,27 in 100x100
    hex_pts = [
        (W * 0.50, H * 0.05),
        (W * 0.90, H * 0.27),
        (W * 0.90, H * 0.73),
        (W * 0.50, H * 0.95),
        (W * 0.10, H * 0.73),
        (W * 0.10, H * 0.27),
    ]
    
    # 1. Subtle Outer Glow
    glow_img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_img)
    glow_draw.polygon(hex_pts, fill=(0, 229, 255, 60))
    glow_img = glow_img.filter(ImageFilter.GaussianBlur(radius=W * 0.04))
    img.paste(glow_img, (0, 0), glow_img)
    
    # 2. Dark Shield Body
    draw.polygon(hex_pts, fill=(11, 14, 26, 255))
    
    # 3. Gold Hex Shield Border (simulate gold metallic stroke)
    stroke_w = int(W * 0.045)
    for i in range(len(hex_pts)):
        p1 = hex_pts[i]
        p2 = hex_pts[(i + 1) % len(hex_pts)]
        # Gold gradient tint from top to bottom
        gold_color = (245, 200, 66, 255) if (p1[1] + p2[1]) / 2 < cy else (180, 130, 20, 255)
        draw.line([p1, p2], fill=gold_color, width=stroke_w)
    
    # Inner border highlight
    inner_hex = [
        (W * 0.50, H * 0.08),
        (W * 0.86, H * 0.28),
        (W * 0.86, H * 0.72),
        (W * 0.50, H * 0.92),
        (W * 0.14, H * 0.72),
        (W * 0.14, H * 0.28),
    ]
    for i in range(len(inner_hex)):
        p1 = inner_hex[i]
        p2 = inner_hex[(i + 1) % len(inner_hex)]
        draw.line([p1, p2], fill=(255, 235, 150, 140), width=int(stroke_w * 0.2))

    # 4. Stylized 'A' Wings in Royal Gold
    # 50,18  76,78  63,78  50,48  37,78  24,78
    a_pts = [
        (W * 0.50, H * 0.19),
        (W * 0.77, H * 0.78),
        (W * 0.64, H * 0.78),
        (W * 0.50, H * 0.48),
        (W * 0.36, H * 0.78),
        (W * 0.23, H * 0.78),
    ]
    draw.polygon(a_pts, fill=(238, 186, 45, 255))
    
    # Center highlight on 'A'
    a_highlight = [
        (W * 0.50, H * 0.20),
        (W * 0.52, H * 0.48),
        (W * 0.48, H * 0.48),
    ]
    draw.polygon(a_highlight, fill=(255, 255, 220, 200))
    
    # 5. Inner Crimson Recording Core (Lens)
    lens_r = W * 0.12
    lens_cy = H * 0.59
    lens_cx = cx
    
    # Glow for lens
    lens_glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    lg_draw = ImageDraw.Draw(lens_glow)
    lg_draw.ellipse(
        [lens_cx - lens_r * 1.5, lens_cy - lens_r * 1.5, lens_cx + lens_r * 1.5, lens_cy + lens_r * 1.5],
        fill=(255, 20, 50, 120)
    )
    lens_glow = lens_glow.filter(ImageFilter.GaussianBlur(radius=W * 0.03))
    img.paste(lens_glow, (0, 0), lens_glow)
    
    # Solid crimson lens with gradient ring
    draw.ellipse(
        [lens_cx - lens_r, lens_cy - lens_r, lens_cx + lens_r, lens_cy + lens_r],
        fill=(220, 10, 40, 255),
        outline=(255, 100, 120, 255),
        width=int(W * 0.015)
    )
    
    # Lens reflection spot
    ref_r = lens_r * 0.32
    draw.ellipse(
        [lens_cx - ref_r * 1.6, lens_cy - ref_r * 1.6, lens_cx - ref_r * 0.3, lens_cy - ref_r * 0.3],
        fill=(255, 255, 255, 220)
    )
    
    # Downsample to target size with high-quality Lanczos resampling
    final = img.resize((size, size), Image.Resampling.LANCZOS)
    return final

out_dir = r"D:\AabSara\src-tauri\icons"
os.makedirs(out_dir, exist_ok=True)

# Generate master PNG
master = create_aabsara_icon(512)
master.save(os.path.join(out_dir, "icon.png"), "PNG")
print("Saved icon.png (512x512)")

# Generate required icon sizes
sizes = {
    "32x32.png": 32,
    "128x128.png": 128,
    "128x128@2x.png": 256,
    "Square44x44Logo.png": 44,
    "Square71x71Logo.png": 71,
    "Square89x89Logo.png": 89,
    "Square107x107Logo.png": 107,
    "Square142x142Logo.png": 142,
    "Square150x150Logo.png": 150,
    "Square284x284Logo.png": 284,
    "Square310x310Logo.png": 310,
    "StoreLogo.png": 50,
}

ico_frames = []
for name, s in sizes.items():
    icon_img = create_aabsara_icon(s)
    icon_img.save(os.path.join(out_dir, name), "PNG")

# Also copy to frontend public and assets
public_dir = r"D:\AabSara\public"
os.makedirs(public_dir, exist_ok=True)
master.save(os.path.join(public_dir, "aabsara_logo.png"), "PNG")

# Generate Multi-size Windows .ICO from high-resolution master
ico_sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
master.save(
    os.path.join(out_dir, "icon.ico"),
    format="ICO",
    sizes=ico_sizes
)
print("Saved multi-size icon.ico successfully!")

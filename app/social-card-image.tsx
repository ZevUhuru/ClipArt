import { ImageResponse } from "next/og";

const CARD_SIZE = {
  width: 1200,
  height: 630,
};

const CARD_TILES = [
  { mark: "✿", label: "Flowers", bg: "#fce7f3", fg: "#db2777" },
  { mark: "★", label: "Stickers", bg: "#ffedd5", fg: "#ea580c" },
  { mark: "♥", label: "Hearts", bg: "#ffe4e6", fg: "#e11d48" },
  { mark: "A+", label: "School", bg: "#dcfce7", fg: "#16a34a" },
  { mark: "☕", label: "Cafe", bg: "#fef3c7", fg: "#b45309" },
  { mark: "✚", label: "Icons", bg: "#e0f2fe", fg: "#0284c7" },
  { mark: "✦", label: "Crafts", bg: "#ede9fe", fg: "#7c3aed" },
  { mark: "☺", label: "Characters", bg: "#f3f4f6", fg: "#374151" },
];

export function createSocialCardImage() {
  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          background: "#0b0b12",
          color: "white",
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 18% 18%, rgba(236,72,153,0.34), transparent 28%), radial-gradient(circle at 82% 22%, rgba(251,146,60,0.28), transparent 28%), radial-gradient(circle at 70% 88%, rgba(34,197,94,0.18), transparent 28%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 28,
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 42,
            background: "rgba(255,255,255,0.045)",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            width: "100%",
            padding: "62px 68px",
            gap: 54,
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", width: 560 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 42,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 50,
                  height: 50,
                  borderRadius: 16,
                  background:
                    "linear-gradient(135deg, rgba(236,72,153,1), rgba(251,146,60,1), rgba(34,197,94,1))",
                  fontSize: 28,
                  fontWeight: 900,
                }}
              >
                ✂
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 30, fontWeight: 850, letterSpacing: -1 }}>
                  clip.art
                </div>
                <div
                  style={{
                    color: "rgba(255,255,255,0.56)",
                    fontSize: 18,
                    fontWeight: 700,
                  }}
                >
                  AI Clip Art Generator
                </div>
              </div>
            </div>

            <div
              style={{
                color: "rgba(255,255,255,0.64)",
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: 3.8,
                textTransform: "uppercase",
                marginBottom: 18,
              }}
            >
              Free transparent clip art
            </div>
            <div
              style={{
                fontSize: 68,
                lineHeight: 0.94,
                fontWeight: 900,
                letterSpacing: -3.8,
                marginBottom: 26,
              }}
            >
              Generate clip art for real projects.
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.70)",
                fontSize: 28,
                lineHeight: 1.28,
                fontWeight: 650,
                maxWidth: 540,
              }}
            >
              Describe what you need, choose a style, and download reusable images for
              classrooms, shops, crafts, and everyday design.
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 38 }}>
              {["10 free credits", "Transparent PNG", "Commercial use"].map((label) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.10)",
                    border: "1px solid rgba(255,255,255,0.16)",
                    padding: "10px 16px",
                    color: "rgba(255,255,255,0.86)",
                    fontSize: 17,
                    fontWeight: 800,
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flex: 1,
              padding: 16,
              borderRadius: 36,
              background: "rgba(255,255,255,0.94)",
              boxShadow: "0 32px 90px rgba(0,0,0,0.42)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                width: 420,
              }}
            >
              {CARD_TILES.map((tile, index) => (
                <div
                  key={tile.label}
                  style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    width: index === 0 ? 204 : 96,
                    height: index === 0 ? 204 : 96,
                    borderRadius: index === 0 ? 30 : 22,
                    background: tile.bg,
                    border: "1px solid #eef2f7",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      color: tile.fg,
                      fontSize: index === 0 ? 104 : 42,
                      lineHeight: 1,
                      fontWeight: 900,
                      letterSpacing: -3,
                    }}
                  >
                    {tile.mark}
                  </div>
                  <div
                    style={{
                      marginTop: index === 0 ? 14 : 6,
                      color: tile.fg,
                      fontSize: index === 0 ? 20 : 11,
                      fontWeight: 850,
                    }}
                  >
                    {tile.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    CARD_SIZE,
  );
}

export const socialCardSize = CARD_SIZE;

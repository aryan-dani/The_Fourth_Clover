import { ImageResponse } from "next/og";

const BRAND_GREEN = "#2F6B52";
const CREAM = "#F7F4EE";
const INK = "#1A1A16";
const MUTED = "#6B6560";

export type OgImageOptions = {
  title: string;
  sectionLabel: string;
};

export function createOgImage({ title, sectionLabel }: OgImageOptions) {
  const trimmed =
    title.trim().length > 90 ? `${title.trim().slice(0, 87)}…` : title.trim();

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: CREAM,
          backgroundImage:
            "linear-gradient(160deg, #F7F4EE 0%, #EFE9DF 55%, #E6E0D4 100%)",
          padding: "56px 64px",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "10px",
              height: "10px",
              backgroundColor: BRAND_GREEN,
            }}
          />
          <div
            style={{
              fontSize: 22,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: BRAND_GREEN,
              fontFamily: "ui-monospace, Menlo, monospace",
            }}
          >
            {sectionLabel}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            maxWidth: "980px",
          }}
        >
          <div
            style={{
              fontSize: trimmed.length > 48 ? 56 : 64,
              lineHeight: 1.15,
              fontWeight: 600,
              color: INK,
              letterSpacing: "-0.02em",
            }}
          >
            {trimmed || "The Fourth Clover"}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: `1px solid ${MUTED}33`,
            paddingTop: "28px",
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: INK,
              letterSpacing: "-0.01em",
            }}
          >
            The Fourth Clover
          </div>
          <div
            style={{
              fontSize: 18,
              color: MUTED,
              fontFamily: "ui-monospace, Menlo, monospace",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            fourthclover.bio
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}

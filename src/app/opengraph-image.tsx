import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Calimbus - Google Calendar Kanban Board";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              background: "white",
              borderRadius: 16,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              marginRight: 24,
              padding: 6,
              position: "relative",
            }}
          >
            {/* Binding rings */}
            <div style={{ display: "flex", justifyContent: "center", gap: 20, position: "absolute", top: -2, left: 0, right: 0 }}>
              <div style={{ width: 7, height: 12, background: "#f97316", borderRadius: 2 }} />
              <div style={{ width: 7, height: 12, background: "#f97316", borderRadius: 2 }} />
            </div>
            {/* Top bar */}
            <div style={{ width: "100%", height: 14, background: "rgba(249,115,22,0.3)", borderRadius: 4, marginTop: 12 }} />
            {/* Date grid */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: 3, marginTop: 4, justifyContent: "center" }}>
              <div style={{ width: 10, height: 10, background: "#f97316", borderRadius: 2 }} />
              <div style={{ width: 10, height: 10, background: "#f97316", borderRadius: 2 }} />
              <div style={{ width: 10, height: 10, background: "#f97316", borderRadius: 2 }} />
              <div style={{ width: 10, height: 10, background: "#f97316", borderRadius: 2 }} />
              <div style={{ width: 10, height: 10, background: "#f97316", borderRadius: 2 }} />
              <div style={{ width: 10, height: 10, background: "#f97316", borderRadius: 2 }} />
              <div style={{ width: 10, height: 10, background: "rgba(249,115,22,0.4)", borderRadius: 2 }} />
              <div style={{ width: 10, height: 10, background: "rgba(249,115,22,0.4)", borderRadius: 2 }} />
              <div style={{ width: 10, height: 10, background: "rgba(249,115,22,0.4)", borderRadius: 2 }} />
            </div>
          </div>
          <span
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "white",
            }}
          >
            Calimbus
          </span>
        </div>
        <div
          style={{
            fontSize: 32,
            color: "rgba(255, 255, 255, 0.9)",
            textAlign: "center",
            maxWidth: 800,
          }}
        >
          Organize your Google Calendar events and tasks in a Kanban board
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

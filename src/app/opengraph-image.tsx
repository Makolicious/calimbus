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
              alignItems: "center",
              justifyContent: "center",
              marginRight: 24,
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#f97316"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
              <path d="M9 5a2 2 0 002 2h2a2 2 0 002-2" />
              <path d="M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
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

import { NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Construct auth URL from request headers for proper redirect URI
const getAuthUrl = (req: NextRequest) => {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }

  // For Vercel: use the VERCEL_URL environment variable
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Fallback: construct from request headers
  const proto = req.headers.get("x-forwarded-proto") || "http";
  const host = req.headers.get("host") || "localhost:3000";
  return `${proto}://${host}`;
};

const handler = NextAuth(authOptions);

// Wrap handlers to inject the NEXTAUTH_URL from the request
export async function GET(req: NextRequest, context: any) {
  process.env.NEXTAUTH_URL = getAuthUrl(req);
  return handler(req, context);
}

export async function POST(req: NextRequest, context: any) {
  process.env.NEXTAUTH_URL = getAuthUrl(req);
  return handler(req, context);
}

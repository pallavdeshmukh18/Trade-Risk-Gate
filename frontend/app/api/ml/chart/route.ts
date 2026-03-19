import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "";

export async function GET(request: NextRequest) {
    try {
        if (!BACKEND_URL) {
            return NextResponse.json({ error: "Backend unavailable" }, { status: 503 });
        }

        const search = request.nextUrl.searchParams.toString();
        const symbol = request.nextUrl.searchParams.get("symbol") || "UNKNOWN";
        const range = request.nextUrl.searchParams.get("range") || "1D";
        const response = await fetch(`${BACKEND_URL}/chart?${search}`, {
            cache: "no-store",
        });

        const data = await response.json().catch(() => ({}));
        const candleCount = Array.isArray(data?.candles) ? data.candles.length : 0;

        console.log(
            `[chart proxy] symbol=${symbol} range=${range} status=${response.status} candles=${candleCount}`
        );

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error("[chart proxy] request failed:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Chart proxy failed" },
            { status: 500 }
        );
    }
}

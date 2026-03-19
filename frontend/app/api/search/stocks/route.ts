import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "";

export async function GET(request: NextRequest) {
    try {
        if (!BACKEND_URL) {
            return NextResponse.json({ results: [] }, { status: 503 });
        }

        const search = request.nextUrl.searchParams.toString();
        const response = await fetch(`${BACKEND_URL}/search/stocks?${search}`, {
            cache: "no-store",
        });

        const data = await response.json().catch(() => ({ results: [] }));
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json(
            { results: [], error: error instanceof Error ? error.message : "Search proxy failed" },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "";

export async function GET(request: NextRequest) {
    try {
        if (!BACKEND_URL) {
            return NextResponse.json({ error: "Backend unavailable" }, { status: 503 });
        }

        const search = request.nextUrl.searchParams.toString();
        const response = await fetch(`${BACKEND_URL}/chart/data?${search}`, {
            cache: "no-store",
        });

        const data = await response.json().catch(() => ({}));
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Chart proxy failed" },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "";

export async function POST(request: NextRequest) {
    try {
        if (!BACKEND_URL) {
            return NextResponse.json({ error: "Backend unavailable" }, { status: 503 });
        }

        const body = await request.json();

        const response = await fetch(`${BACKEND_URL}/api/predict-risk`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(body),
            cache: "no-store",
        });

        const data = await response.json().catch(() => ({}));
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Prediction proxy failed" },
            { status: 500 }
        );
    }
}

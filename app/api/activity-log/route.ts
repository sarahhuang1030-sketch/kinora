import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    console.log("USER ACTIVITY", {
      ...data,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("ACTIVITY LOG ERROR:", error);

    return NextResponse.json(
      { error: "Failed to log activity" },
      { status: 500 }
    );
  }
}
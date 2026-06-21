import { NextResponse } from "next/server";

export async function POST() {
  try {
    console.log("FEEDBACK FORM OPENED", {
      openedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      message: "Feedback click tracked",
    });
  } catch (error) {
    console.error("FEEDBACK TRACKING ERROR:", error);

    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
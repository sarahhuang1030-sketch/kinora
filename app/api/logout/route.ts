import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    console.log("USER LOGOUT", {
      email,
      logoutTime: new Date().toISOString(),
    });

    return NextResponse.json({
      message: "Logout tracked",
    });
  } catch (error) {
    console.error("LOGOUT ERROR:", error);

    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
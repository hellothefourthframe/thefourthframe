import { NextResponse } from "next/server";
import { signToken } from "@/app/lib/auth";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const expectedUsername = process.env.SITE_USERNAME as string;
    const expectedPassword = process.env.SITE_PASSWORD as string;

    if (username !== expectedUsername || password !== expectedPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = signToken({
      id: "admin-env",
      username: expectedUsername,
    });

    const response = NextResponse.json({
      success: true,
      admin: { username: expectedUsername },
    });

    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, createUser, findUserByEmail, setSessionCookie } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const signupSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().email(),
  password: z.string().min(8)
});

export async function POST(request: Request) {
  try {
    const payload = signupSchema.parse(await request.json());
    const existingUser = await findUserByEmail(payload.email);

    if (existingUser) {
      return NextResponse.json({ error: "An account already exists for this email." }, { status: 409 });
    }

    const user = await createUser(payload.email, payload.name, payload.password);
    const token = await createSession(user.id);
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    }, { status: 201 });

    setSessionCookie(response, token, request);
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to create account." }, { status: 500 });
  }
}

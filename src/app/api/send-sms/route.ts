import { NextResponse } from "next/server";
const AfricasTalking = require("africastalking");

const at = AfricasTalking({
  apiKey: process.env.AT_API_KEY,
  username: process.env.AT_USERNAME,
});

export async function POST(req: Request) {
  try {
    const { to, message } = await req.json();

    // Ensure phone number starts with + (e.g., +254...)
    const sms = at.SMS;
    const options = {
      to: [to],
      message: message,
      enqueue: true,
    };

    const response = await sms.send(options);
    return NextResponse.json({ success: true, response });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

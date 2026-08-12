import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return new NextResponse(`Authentication failed: ${error}`, { status: 400 });
  }

  if (!code) {
    return new NextResponse("Missing authorization code", { status: 400 });
  }

  const clientId = process.env.DRIVE_CLIENT_ID;
  const clientSecret = process.env.DRIVE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new NextResponse(
      "Missing DRIVE_CLIENT_ID or DRIVE_CLIENT_SECRET in environment variables.",
      { status: 500 }
    );
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      "http://localhost:3000/api/auth/callback"
    );

    const { tokens } = await oauth2Client.getToken(code);
    const refreshToken = tokens.refresh_token;

    if (refreshToken) {
      console.log("\n==========================================");
      console.log("NEW GOOGLE DRIVE REFRESH TOKEN GENERATED:");
      console.log(refreshToken);
      console.log("==========================================\n");
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Google Drive Refresh Token</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #090d16; color: #f8fafc; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
            .card { background: #131c2e; border-radius: 16px; padding: 36px; max-width: 640px; width: 100%; box-shadow: 0 20px 40px rgba(0,0,0,0.6); border: 1px solid #1e293b; }
            h1 { color: #38bdf8; margin-top: 0; font-size: 24px; display: flex; align-items: center; gap: 10px; }
            p { color: #94a3b8; line-height: 1.6; font-size: 15px; }
            .token-box { background: #070a11; border: 1px solid #334155; padding: 18px; border-radius: 10px; word-break: break-all; font-family: monospace; font-size: 13px; color: #4ade80; margin: 18px 0; max-height: 150px; overflow-y: auto; }
            .btn { background: #0284c7; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; transition: background 0.2s; }
            .btn:hover { background: #0369a1; }
            .steps { background: #1e293b; padding: 20px; border-radius: 10px; margin-top: 24px; border: 1px solid #334155; }
            .steps h3 { margin-top: 0; color: #f1f5f9; font-size: 16px; }
            .steps ol { margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 14px; line-height: 1.8; }
            .steps li code { background: #0f172a; padding: 2px 6px; border-radius: 4px; color: #38bdf8; font-size: 13px; }
            .alert { background: #451a03; border: 1px solid #78350f; color: #fdba74; padding: 14px; border-radius: 8px; margin-top: 20px; font-size: 13px; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>✅ Authorization Successful!</h1>
            <p>Your new Google Drive <code>DRIVE_REFRESH_TOKEN</code> has been generated successfully.</p>
            ${refreshToken ? `
              <div class="token-box" id="token">${refreshToken}</div>
              <button class="btn" onclick="navigator.clipboard.writeText(document.getElementById('token').innerText); alert('Refresh Token copied to clipboard!');">📋 Copy Refresh Token</button>
            ` : `
              <div class="alert">
                ⚠️ No new refresh token was returned by Google. This happens if access was already granted previously without requesting consent.<br><br>
                Please go to <a href="/api/auth/google" style="color: #38bdf8;">/api/auth/google</a> again to force the consent screen.
              </div>
            `}
            <div class="steps">
              <h3>Next Steps:</h3>
              <ol>
                <li>Click <strong>Copy Refresh Token</strong> above.</li>
                <li>Open your <code>.env</code> file in your project directory.</li>
                <li>Update or add <code>DRIVE_REFRESH_TOKEN=your_copied_token</code>.</li>
                <li>Restart your local server (<code>npm run dev</code>).</li>
              </ol>
            </div>
            <div class="alert">
              💡 <strong>Tip to prevent future expirations:</strong><br>
              In Google Cloud Console under <em>OAuth Consent Screen</em>, change the <em>Publishing status</em> from <strong>Testing</strong> to <strong>In Production</strong>. Otherwise Google refresh tokens expire every 7 days!
            </div>
          </div>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (err: any) {
    console.error("Failed to exchange code for tokens:", err);
    return new NextResponse(`Error exchanging auth code: ${err.message}`, { status: 500 });
  }
}

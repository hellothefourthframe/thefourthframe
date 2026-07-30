import dotenv from "dotenv";
dotenv.config();
dotenv.config({ path: ".env.local" });

import { google } from "googleapis";
import * as readline from "readline";

console.log("CLIENT_ID:", process.env.DRIVE_CLIENT_ID);
console.log("CLIENT_SECRET:", process.env.DRIVE_CLIENT_SECRET);

const oauth2Client = new google.auth.OAuth2(
  process.env.DRIVE_CLIENT_ID!,
  process.env.DRIVE_CLIENT_SECRET!,
  "http://localhost:3000/api/auth/callback"
);

const scopes = [
  "https://www.googleapis.com/auth/drive.file",
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  include_granted_scopes: true,
  scope: scopes,
});

console.log("\nOpen this URL in your browser:\n");
console.log(authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("\nPaste the code here: ", async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);

    console.log("\n==============================");
    console.log("Access Token:");
    console.log(tokens.access_token);

    console.log("\nRefresh Token:");
    console.log(tokens.refresh_token);
    console.log("==============================");

    rl.close();
  } catch (err) {
    console.error(err);
    rl.close();
  }
});
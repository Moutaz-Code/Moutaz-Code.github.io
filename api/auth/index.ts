import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "node:crypto";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const redirectUri = process.env.GITHUB_OAUTH_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return res.status(500).json({ error: "OAuth not configured" });
  }

  // Generate CSRF state token
  const state = crypto.randomBytes(16).toString("hex");

  // Store state in httpOnly cookie for validation in callback
  res.setHeader(
    "Set-Cookie",
    `cms_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
  );

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "repo",
    state,
  });

  res.redirect(302, `https://github.com/login/oauth/authorize?${params}`);
}

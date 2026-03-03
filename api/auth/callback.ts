import type { VercelRequest, VercelResponse } from "@vercel/node";

function parseCookies(header: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  for (const pair of header.split(";")) {
    const [key, ...rest] = pair.trim().split("=");
    if (key) cookies[key] = rest.join("=");
  }
  return cookies;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  const { code, state } = req.query;

  if (!code || typeof code !== "string") {
    return sendError(res, "Missing authorization code");
  }

  // Validate CSRF state
  const cookies = parseCookies(req.headers.cookie ?? "");
  const storedState = cookies.cms_oauth_state;

  if (!state || state !== storedState) {
    return sendError(res, "Invalid state parameter — possible CSRF attack");
  }

  // Exchange code for access token
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GITHUB_OAUTH_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return sendError(res, "OAuth not configured on server");
  }

  const tokenRes = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    },
  );

  const data = (await tokenRes.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (data.error || !data.access_token) {
    return sendError(res, data.error_description ?? data.error ?? "Token exchange failed");
  }

  // Clear state cookie
  res.setHeader(
    "Set-Cookie",
    "cms_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
  );

  // Send token back to CMS via postMessage
  const token = data.access_token;
  const provider = "github";
  const message = `authorization:${provider}:success:${JSON.stringify({ token, provider })}`;

  res.setHeader("Content-Type", "text/html");
  res.send(`<!DOCTYPE html>
<html>
<body>
<p>Authenticating...</p>
<script>
(function() {
  if (window.opener) {
    window.opener.postMessage(${JSON.stringify(message)}, window.location.origin);
    window.close();
  }
})();
</script>
</body>
</html>`);
}

function sendError(res: VercelResponse, message: string) {
  const provider = "github";
  const errorMessage = `authorization:${provider}:error:${message}`;

  res.setHeader("Content-Type", "text/html");
  res.send(`<!DOCTYPE html>
<html>
<body>
<p>Authentication failed: ${escapeHtml(message)}</p>
<script>
(function() {
  if (window.opener) {
    window.opener.postMessage(${JSON.stringify(errorMessage)}, window.location.origin);
    window.close();
  }
})();
</script>
</body>
</html>`);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function reconnectDelayMs(
  attempt,
  opts = { baseMs: 1000, maxMs: 30000, jitterMs: 1000, random: Math.random },
) {
  const baseMs = Number.isFinite(opts.baseMs) ? opts.baseMs : 1000;
  const maxMs = Number.isFinite(opts.maxMs) ? opts.maxMs : 30000;
  const jitterMs = Number.isFinite(opts.jitterMs) ? opts.jitterMs : 1000;
  const random = typeof opts.random === "function" ? opts.random : Math.random;
  const safeAttempt = Math.max(0, Number.isFinite(attempt) ? attempt : 0);
  const backoff = Math.min(baseMs * 2 ** safeAttempt, maxMs);
  return backoff + Math.max(0, jitterMs) * random();
}

export async function deriveRelayToken(gatewayToken, port) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(gatewayToken),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    enc.encode(`openclaw-extension-relay-v1:${port}`),
  );
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Build the WebSocket URL for the relay connection.
 *
 * @param {object} settings - { connectionMode, port, remoteUrl, gatewayToken }
 * @returns {Promise<string>} WebSocket URL
 *
 * Remote mode: wss://{host}/browser-relay/extension?token={hmacToken}
 *   HMAC is ALWAYS derived with port 18792 (the actual relay port inside the container).
 *
 * Local mode: ws://127.0.0.1:{port}/extension?token={hmacToken}
 *   HMAC is derived with the configured port.
 */
export async function buildRelayWsUrl(settings) {
  const token = String(settings.gatewayToken || "").trim();
  if (!token) {
    throw new Error(
      "Missing gatewayToken in extension settings (chrome.storage.local.gatewayToken)",
    );
  }

  if (settings.connectionMode === "remote") {
    const url = String(settings.remoteUrl || "").trim();
    if (!url) {
      throw new Error("Missing remote URL in extension settings");
    }
    // Parse the remote URL to get the host
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error(`Invalid remote URL: ${url}`);
    }
    const host = parsed.host;
    // Relay validates the raw gateway token
    return `wss://${host}/browser-relay/extension?token=${encodeURIComponent(token)}`;
  }

  // Local mode - uses HMAC-derived token (original OpenClaw extension behavior)
  const port = settings.port || 18792;
  const relayToken = await deriveRelayToken(token, port);
  return `ws://127.0.0.1:${port}/extension?token=${encodeURIComponent(relayToken)}`;
}

/**
 * Build the preflight URL for connectivity checks.
 *
 * @param {object} settings - { connectionMode, port, remoteUrl }
 * @returns {string} Preflight URL
 *
 * Remote mode: https://{host}/browser-relay/json/version
 * Local mode: http://127.0.0.1:{port}/json/version
 */
export function buildPreflightUrl(settings) {
  if (settings.connectionMode === "remote") {
    const url = String(settings.remoteUrl || "").trim();
    if (!url) {
      throw new Error("Missing remote URL in extension settings");
    }
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error(`Invalid remote URL: ${url}`);
    }
    return `https://${parsed.host}/browser-relay/json/version`;
  }

  // Local mode
  const port = settings.port || 18792;
  return `http://127.0.0.1:${port}/json/version`;
}

/**
 * Build the base URL for the relay (used for preflight HEAD check).
 *
 * @param {object} settings - { connectionMode, port, remoteUrl }
 * @returns {string} Base URL
 */
export function buildPreflightBaseUrl(settings) {
  if (settings.connectionMode === "remote") {
    const url = String(settings.remoteUrl || "").trim();
    if (!url) {
      throw new Error("Missing remote URL in extension settings");
    }
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error(`Invalid remote URL: ${url}`);
    }
    return `https://${parsed.host}/browser-relay/`;
  }

  const port = settings.port || 18792;
  return `http://127.0.0.1:${port}/`;
}

export function isRetryableReconnectError(err) {
  const message = err instanceof Error ? err.message : String(err || "");
  if (message.includes("Missing gatewayToken")) {
    return false;
  }
  if (message.includes("Missing remote URL")) {
    return false;
  }
  return true;
}

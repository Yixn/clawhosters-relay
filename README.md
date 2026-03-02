# ClawHosters Browser Relay

A Chrome extension that connects your ClawHosters OpenClaw instance to your browser tabs, enabling AI-powered browser automation via the Chrome DevTools Protocol (CDP).

This is a fork of the official OpenClaw Browser Relay extension, adding support for remote WebSocket connections (`wss://`) to ClawHosters VPS instances in addition to the existing localhost connections.

## What it does

The extension attaches to Chrome tabs using the Debugger API and relays CDP commands between your OpenClaw instance and the browser. This allows your AI agent to:

- Navigate to URLs
- Click elements, fill forms, type text
- Take screenshots
- Execute JavaScript
- Create and close tabs
- Any other CDP operation

## Connection Modes

### Remote (ClawHosters)

Connect to your ClawHosters VPS instance over the internet using secure WebSocket (`wss://`). This is the primary use case for ClawHosters customers.

- Enter your instance URL (e.g., `https://mybot.clawhosters.com`)
- Enter your gateway token
- The extension connects via `wss://<host>/browser-relay/extension`

### Local

Connect to a relay running on your local machine via `ws://127.0.0.1:<port>`. This is for self-hosted OpenClaw setups or local development.

- Configure the relay port (default: `18792`)
- Enter your gateway token
- The extension connects via `ws://127.0.0.1:<port>/extension`

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top right)
4. Click "Load unpacked" and select the `clawhosters-relay` directory
5. The extension options page will open automatically

## Setup

1. Open the extension options (right-click the extension icon > Options)
2. Choose your connection mode:
   - **Remote**: Enter your ClawHosters instance URL
   - **Local**: Configure the relay port (default 18792)
3. Enter your gateway token (must match `gateway.auth.token` or `OPENCLAW_GATEWAY_TOKEN` in your instance config)
4. Click **Save**
5. The status indicator will show whether the relay is reachable

## Usage

1. Navigate to any webpage in Chrome
2. Click the ClawHosters Browser Relay icon in the toolbar
3. The badge shows the connection state:
   - **ON** (orange): Tab attached and relay connected
   - **...** (yellow): Connecting or reconnecting
   - **!** (red): Error, relay not reachable
   - No badge: Tab not attached
4. Click the icon again to detach from the tab

The extension automatically:
- Reconnects when the relay connection drops (exponential backoff)
- Re-attaches to tabs after page navigation
- Persists attached tab state across service worker restarts

## Security

- Authentication uses HMAC-SHA256 token derivation
- Remote connections use `wss://` (TLS encrypted)
- The gateway token is stored locally in `chrome.storage.local`
- No data is sent to any third party (see PRIVACY.md)

## Permissions

| Permission | Reason |
|------------|--------|
| `debugger` | Attach to tabs via Chrome DevTools Protocol |
| `tabs` | Query and manage browser tabs |
| `activeTab` | Access the currently active tab |
| `storage` | Persist settings and connection state |
| `alarms` | Periodic keepalive checks |
| `webNavigation` | Detect page navigations for re-attach |

## License

Apache License 2.0. See [LICENSE](LICENSE).

# Privacy Policy - ClawHosters Browser Relay

## Data Collection

This extension does **not** collect, store, or transmit any personal data, browsing history, or usage analytics.

## What the extension stores locally

The following settings are stored in `chrome.storage.local` on your device only:

- **Connection mode** (local or remote)
- **Relay port** (for local connections)
- **Remote URL** (your ClawHosters instance URL)
- **Gateway token** (authentication credential for the relay)

This data never leaves your device except as described below.

## Network communication

The extension communicates **only** with the relay endpoint you configure:

- **Local mode**: `ws://127.0.0.1:<port>` (your own machine)
- **Remote mode**: `wss://<your-instance>.clawhosters.com` (your own ClawHosters VPS)

The extension does not contact any other servers. There are no analytics endpoints, no telemetry, no crash reporting, and no phone-home behavior.

## Chrome DevTools Protocol (CDP) data

CDP commands and events (page content, screenshots, DOM data) flow directly between your browser and the configured relay server. This data is:

- Never stored by the extension beyond the current session
- Never sent to any third party
- Never logged or recorded by the extension

## Third-party services

This extension uses **zero** third-party services, SDKs, or tracking libraries.

## Gateway token

Your gateway token is used solely to authenticate with the relay server. It is:

- Stored locally in `chrome.storage.local`
- Used to derive HMAC-SHA256 authentication tokens
- Never sent in plaintext over the network (only the derived HMAC token is transmitted)
- Never shared with any third party

## Updates to this policy

Any changes to this privacy policy will be reflected in this file within the extension package.

## Contact

For questions about this privacy policy, visit [clawhosters.com](https://clawhosters.com).

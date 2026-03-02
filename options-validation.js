const PORT_GUIDANCE = 'Use gateway port + 3 (for gateway 18789, relay is 18792).'

function hasCdpVersionShape(data) {
  return !!data && typeof data === 'object' && 'Browser' in data && 'Protocol-Version' in data
}

function getDisplayUrl(settings) {
  if (settings.connectionMode === 'remote') {
    const url = String(settings.remoteUrl || '').trim()
    try {
      return new URL(url).host
    } catch {
      return url || 'remote host'
    }
  }
  const port = settings.port || 18792
  return `http://127.0.0.1:${port}/`
}

export function classifyRelayCheckResponse(res, settings) {
  if (!res) {
    return { action: 'throw', error: 'No response from service worker' }
  }

  if (res.status === 401) {
    return { action: 'status', kind: 'error', message: 'Gateway token rejected. Check token and save again.' }
  }

  if (res.error) {
    return { action: 'throw', error: res.error }
  }

  if (!res.ok) {
    return { action: 'throw', error: `HTTP ${res.status}` }
  }

  const contentType = String(res.contentType || '')

  if (settings.connectionMode === 'remote') {
    // Remote mode validation
    if (!contentType.includes('application/json')) {
      return {
        action: 'status',
        kind: 'error',
        message: `Unexpected response from ${getDisplayUrl(settings)}. Make sure the instance is running and browser relay is enabled.`,
      }
    }

    if (!hasCdpVersionShape(res.json)) {
      return {
        action: 'status',
        kind: 'error',
        message: `Connected to ${getDisplayUrl(settings)} but got unexpected response. Check that browser relay is enabled on this instance.`,
      }
    }

    return {
      action: 'status',
      kind: 'ok',
      message: `Connected to ${getDisplayUrl(settings)} relay.`,
    }
  }

  // Local mode validation
  if (!contentType.includes('application/json')) {
    return {
      action: 'status',
      kind: 'error',
      message: `Wrong port: this is likely the gateway, not the relay. ${PORT_GUIDANCE}`,
    }
  }

  if (!hasCdpVersionShape(res.json)) {
    return {
      action: 'status',
      kind: 'error',
      message: `Wrong port: expected relay /json/version response. ${PORT_GUIDANCE}`,
    }
  }

  return { action: 'status', kind: 'ok', message: `Relay reachable and authenticated at ${getDisplayUrl(settings)}` }
}

export function classifyRelayCheckException(err, settings) {
  const message = String(err || '').toLowerCase()

  if (settings.connectionMode === 'remote') {
    if (message.includes('json') || message.includes('syntax')) {
      return {
        kind: 'error',
        message: `Unexpected response from ${getDisplayUrl(settings)}. The endpoint may not be a browser relay.`,
      }
    }

    return {
      kind: 'error',
      message: `Cannot reach relay at ${getDisplayUrl(settings)}. Check that the instance is running and accessible.`,
    }
  }

  // Local mode
  if (message.includes('json') || message.includes('syntax')) {
    return {
      kind: 'error',
      message: `Wrong port: this is not a relay endpoint. ${PORT_GUIDANCE}`,
    }
  }

  const port = settings.port || 18792
  return {
    kind: 'error',
    message: `Relay not reachable/authenticated at http://127.0.0.1:${port}/. Start OpenClaw browser relay and verify token.`,
  }
}

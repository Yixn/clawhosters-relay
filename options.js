import { buildPreflightUrl } from './background-utils.js'
import { classifyRelayCheckException, classifyRelayCheckResponse } from './options-validation.js'

const DEFAULT_PORT = 18792

function clampPort(value) {
  const n = Number.parseInt(String(value || ''), 10)
  if (!Number.isFinite(n)) return DEFAULT_PORT
  if (n <= 0 || n > 65535) return DEFAULT_PORT
  return n
}

function updateRelayUrl(port) {
  const el = document.getElementById('relay-url')
  if (!el) return
  el.textContent = `http://127.0.0.1:${port}/`
}

function setStatus(kind, message) {
  const status = document.getElementById('status')
  if (!status) return
  status.dataset.kind = kind || ''
  status.textContent = message || ''
}

function getSettings() {
  const mode = document.querySelector('input[name="mode"]:checked')?.value || 'local'
  const port = clampPort(document.getElementById('port').value)
  const remoteUrl = String(document.getElementById('remote-url').value || '').trim()
  const token = String(document.getElementById('token').value || '').trim()
  return {
    connectionMode: mode,
    port,
    remoteUrl,
    gatewayToken: token,
  }
}

function updateModeUI(mode) {
  const localFields = document.getElementById('local-fields')
  const remoteFields = document.getElementById('remote-fields')

  if (mode === 'remote') {
    localFields.classList.remove('active')
    remoteFields.classList.add('active')
  } else {
    localFields.classList.add('active')
    remoteFields.classList.remove('active')
  }
}

async function checkRelayReachable(settings) {
  const trimmedToken = String(settings.gatewayToken || '').trim()
  if (!trimmedToken) {
    setStatus('error', 'Gateway token required. Save your gateway token to connect.')
    return
  }

  if (settings.connectionMode === 'remote' && !settings.remoteUrl) {
    setStatus('error', 'Instance URL required. Enter your ClawHosters instance URL.')
    return
  }

  try {
    const checkUrl = buildPreflightUrl(settings)
    // Relay validates the raw gateway token, not an HMAC derivative
    const res = await chrome.runtime.sendMessage({
      type: 'relayCheck',
      url: checkUrl,
      token: trimmedToken,
    })
    const result = classifyRelayCheckResponse(res, settings)
    if (result.action === 'throw') throw new Error(result.error)
    setStatus(result.kind, result.message)
  } catch (err) {
    const result = classifyRelayCheckException(err, settings)
    setStatus(result.kind, result.message)
  }
}

async function load() {
  const stored = await chrome.storage.local.get(['connectionMode', 'relayPort', 'remoteUrl', 'gatewayToken'])
  const mode = stored.connectionMode || 'local'
  const port = clampPort(stored.relayPort)
  const remoteUrl = String(stored.remoteUrl || '').trim()
  const token = String(stored.gatewayToken || '').trim()

  // Set radio button
  const modeRadio = document.getElementById(mode === 'remote' ? 'mode-remote' : 'mode-local')
  if (modeRadio) modeRadio.checked = true

  document.getElementById('port').value = String(port)
  document.getElementById('remote-url').value = remoteUrl
  document.getElementById('token').value = token

  updateModeUI(mode)
  updateRelayUrl(port)

  const settings = { connectionMode: mode, port, remoteUrl, gatewayToken: token }
  await checkRelayReachable(settings)
}

async function save() {
  const settings = getSettings()
  await chrome.storage.local.set({
    connectionMode: settings.connectionMode,
    relayPort: settings.port,
    remoteUrl: settings.remoteUrl,
    gatewayToken: settings.gatewayToken,
  })

  document.getElementById('port').value = String(settings.port)
  document.getElementById('remote-url').value = settings.remoteUrl
  document.getElementById('token').value = settings.gatewayToken

  updateRelayUrl(settings.port)
  await checkRelayReachable(settings)
}

// Mode toggle handlers
document.getElementById('mode-local').addEventListener('change', () => updateModeUI('local'))
document.getElementById('mode-remote').addEventListener('change', () => updateModeUI('remote'))

// Port input live update
document.getElementById('port').addEventListener('input', (e) => {
  const port = clampPort(e.target.value)
  updateRelayUrl(port)
})

document.getElementById('save').addEventListener('click', () => void save())
void load()

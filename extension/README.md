# Synapse Browser Extension (Stub)

Manifest V3 extension that adds:
- Toolbar popup to save current page or open New Idea form on Synapse
- Right-click context menu: "Save page to Synapse" + "Save selection as note"
- Keyboard shortcut: ⌘⇧S (Ctrl+Shift+S on Win/Linux) for quick-save
- Background service worker that POSTs to `https://api.synapse.app/v1/research-notes`

## Loading for development

1. Visit `chrome://extensions` → enable Developer mode
2. Click **Load unpacked** → pick this `extension/` folder
3. Pin "Synapse" to your toolbar
4. Add your bearer token via the popup once we ship the auth flow

## TODO before publishing

- [ ] Add real icons (16/32/48/128 PNG) to `extension/icons/`
- [ ] Wire OAuth flow with PKCE to fetch the user token
- [ ] Implement `/v1/research-notes` endpoint on the backend
- [ ] Bundle the popup with the same theme as the main app
- [ ] Submit to Chrome Web Store + Firefox AMO

/* Synapse browser-extension service worker (Manifest V3).
 * Handles toolbar actions, hotkeys, and context menu items.
 *
 * To enable real saves: set SYNAPSE_API_URL + an OAuth-issued token.
 */

const API = 'https://api.synapse.app/v1';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-page-to-synapse',
    title: 'Save page to Synapse',
    contexts: ['page'],
  });
  chrome.contextMenus.create({
    id: 'save-selection-to-synapse',
    title: 'Save "%s" to Synapse as note',
    contexts: ['selection'],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;
  if (info.menuItemId === 'save-page-to-synapse') {
    await savePage({ url: tab.url, title: tab.title });
  } else if (info.menuItemId === 'save-selection-to-synapse') {
    await savePage({ url: tab.url, title: tab.title, excerpt: info.selectionText });
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'quick-save') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) await savePage({ url: tab.url, title: tab.title });
  }
});

async function savePage({ url, title, excerpt }) {
  const { token } = await chrome.storage.local.get(['token']);
  if (!token) {
    chrome.notifications?.create?.({
      type: 'basic',
      iconUrl: 'icons/icon-128.png',
      title: 'Synapse',
      message: 'Sign in via the extension popup first.',
    });
    return;
  }
  try {
    await fetch(`${API}/research-notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url, title, excerpt }),
    });
    chrome.notifications?.create?.({
      type: 'basic',
      iconUrl: 'icons/icon-128.png',
      title: 'Saved to Synapse',
      message: title || url,
    });
  } catch (e) {
    console.error('Save failed:', e);
  }
}

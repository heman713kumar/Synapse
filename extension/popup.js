/* eslint-env browser, webextensions */
const $ = (s) => document.querySelector(s);

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.title) $('#title').value = tab.title;

  $('#save').addEventListener('click', async () => {
    const title = $('#title').value;
    const note = $('#note').value;
    await chrome.runtime.sendMessage({ type: 'save', url: tab.url, title, note });
    window.close();
  });

  $('#new-idea').addEventListener('click', async () => {
    const url = `https://synapse.app/?action=new-idea&url=${encodeURIComponent(tab.url)}&title=${encodeURIComponent(tab.title || '')}`;
    chrome.tabs.create({ url });
  });
}

init();

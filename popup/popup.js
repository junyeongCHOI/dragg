const DEBUG = false;

function log(...message) {
  if (DEBUG) {
    console.log(`[Dragg]`, ...message);
  }
}

function updateTranslateOnDragDOMElement(value) {
  const translateOnDrag = document.getElementById('translateOnDrag');
  translateOnDrag.checked = !!value;
}

function updateTargetLanguageDOMElement(value) {
  const targetLanguage = document.getElementById('targetLanguage');
  targetLanguage.value = value;
}

function updateDarkModeDOMElement(value) {
  const darkMode = document.getElementById('darkMode');
  darkMode.checked = !!value;
}
(async function () {
  const storedSettings = await chrome.storage.local.get();

  log('storedSettings', storedSettings);

  updateTranslateOnDragDOMElement(storedSettings.translateOnDrag);
  updateTargetLanguageDOMElement(storedSettings.targetLanguage);
  updateDarkModeDOMElement(storedSettings.darkMode);

  // 설정 변경 감지
  chrome.storage.onChanged.addListener((changes) => {
    log('changes', changes);

    if (typeof changes.translateOnDrag?.newValue === 'boolean') {
      updateTranslateOnDragDOMElement(changes.translateOnDrag.newValue);
    }
    if (typeof changes.targetLanguage?.newValue === 'string') {
      updateTargetLanguageDOMElement(changes.targetLanguage.newValue);
    }
    if (typeof changes.darkMode?.newValue === 'boolean') {
      updateDarkModeDOMElement(changes.darkMode.newValue);
    }
  });

  // 설정
  const translateOnDragSetting = document.getElementById('translateOnDragSetting');
  translateOnDragSetting.addEventListener('click', () => {
    const translateOnDrag = document.getElementById('translateOnDrag');
    chrome.storage.local.set({ translateOnDrag: !translateOnDrag.checked });
  });

  targetLanguage.addEventListener('change', (event) => {
    chrome.storage.local.set({ targetLanguage: event.target.value });
  });

  const darkModeSetting = document.getElementById('darkModeSetting');
  darkModeSetting.addEventListener('click', () => {
    const darkMode = document.getElementById('darkMode');
    chrome.storage.local.set({ darkMode: !darkMode.checked });
  });

  const logo = document.getElementById('logo');
  logo.addEventListener('click', async () => {
    chrome.storage.local.clear();
  });
})();

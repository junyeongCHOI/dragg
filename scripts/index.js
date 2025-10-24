const DEBUG = false;

const BOX_ID = 'dagg-box-junyeong';
const storage = chrome.storage.local;
const LanguageDetector = window.LanguageDetector;
const Translator = window.Translator;

let currentTranslator = null;

let settings = {
  translateOnDrag: true, // 드래그 시 자동 번역 여부
  targetLanguage: 'ko', // 번역 대상 언어
  darkMode: true, // 다크 모드 여부
  extensionEnabled: false, // 확장 프로그램 활성화 여부
};

function log(...message) {
  if (DEBUG) {
    console.log(`[Dragg]`, ...message);
  }
}

function getBrowserLanguage() {
  const language = navigator.language;
  return language.split('-')[0] ?? settings.targetLanguage;
}

function getBrowserDarkMode() {
  const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return darkMode;
}

async function guessLanguage(text) {
  const detector = await LanguageDetector.create();
  const results = await detector.detect(text);
  return results[0].detectedLanguage;
}

async function translate(text, language) {
  if (currentTranslator) {
    await currentTranslator.destroy();
  }

  const translator = await Translator.create({
    sourceLanguage: language,
    targetLanguage: settings.targetLanguage,
  });

  currentTranslator = translator;

  const translated = [];

  for (const chunk of text.split('\n')) {
    const translatedChunk = await translator.translate(chunk);
    translated.push(translatedChunk);
  }

  return translated.join('\n');
}

function getBox(rect, text) {
  // 바디 기준으로 박스 위치 계산
  const paddingHorizontal = 8;
  const paddingVertical = 6;
  const bodyX = rect.left + window.scrollX - paddingHorizontal; // 양쪽 패딩
  const bodyY = rect.bottom + window.scrollY + paddingVertical; // 아래 패딩
  const width = rect.width + paddingHorizontal * 2; // 양쪽 패딩
  const box = document.createElement('div');

  box.id = BOX_ID;

  box.style.position = 'absolute';
  box.style.left = `${bodyX}px`;
  box.style.top = `${bodyY}px`;
  box.style.width = `${width}px`;
  box.style.height = 'auto';
  box.style.zIndex = '9999999999';
  box.style.fontSize = '14px';
  box.style.fontWeight = '400';
  box.style.lineHeight = '1.6';
  box.style.letterSpacing = '0.01em';
  box.style.whiteSpace = 'pre-wrap';
  box.style.padding = `${paddingVertical}px ${paddingHorizontal}px`;
  box.style.borderRadius = '13px';

  if (settings.darkMode) {
    box.style.backgroundColor = 'rgba(22, 22, 22, 0.68)';
    box.style.color = 'rgba(255, 255, 255, 0.8)';
    box.style.boxShadow = '0 1px 1px rgba(22, 22, 22, 0.1)';
    box.style.backdropFilter = 'blur(5px)';
    box.style.border = '1px solid rgba(255, 255, 255, 0.05)';
  } else {
    box.style.backgroundColor = 'rgba(246, 246, 246, 0.64)';
    box.style.color = 'rgba(22, 22, 22, 0.85)';
    box.style.boxShadow = '0 1px 1px rgba(22, 22, 22, 0.1)';
    box.style.backdropFilter = 'blur(5px)';
    box.style.border = '1px solid rgba(255, 255, 255, 0.15)';
  }

  box.innerHTML = text;

  // 나타나는 transition
  box.style.transition = 'opacity 0.1s ease-in-out';
  box.style.opacity = '0';

  setTimeout(() => {
    box.style.opacity = '1';
  }, 1);

  return box;
}

function removeBox() {
  document.getElementById(BOX_ID)?.remove();
}

function mouseDownHandler() {
  log('mouse down');
  removeBox();
}

async function mouseUpHandler() {
  try {
    log('mouse up');

    removeBox();

    if (!settings.translateOnDrag) return;

    const selection = window.getSelection();
    log('selection', selection);

    if (!selection) return;

    const selectionText = selection.toString().trim();
    const sourceLanguage = await guessLanguage(selectionText);
    log('sourceLanguage', sourceLanguage);

    if (selectionText.length === 0) return;

    if (sourceLanguage !== settings.targetLanguage) {
      const translated = await translate(selectionText, sourceLanguage);
      log('translated', translated);
      const range = selection.getRangeAt(0);
      log('range', range);
      const rect = range.getBoundingClientRect();
      log('rect', rect);
      const box = getBox(rect, translated);
      removeBox();
      document.body.appendChild(box);
    }
  } catch (error) {
    if (DEBUG) {
      console.error(error);
    }
  }
}

// 초기화
(async function () {
  if (LanguageDetector && Translator) {
    settings.extensionEnabled = true;
  }
  // 설정 동기화
  const storedSettings = await storage.get();

  if (!storedSettings) {
    const targetLanguage = getBrowserLanguage();
    const darkMode = getBrowserDarkMode();
    settings.darkMode = darkMode;
    settings.targetLanguage = targetLanguage;
    await storage.set(settings);
  } else {
    Object.assign(settings, storedSettings);
    await storage.set(settings);
  }

  log('settings', settings);

  // 설정 변경 감지
  storage.onChanged.addListener((changes) => {
    log('changes', changes);

    if (typeof changes.translateOnDrag?.newValue === 'boolean') {
      settings.translateOnDrag = changes.translateOnDrag.newValue;
    }
    if (typeof changes.targetLanguage?.newValue === 'string') {
      settings.targetLanguage = changes.targetLanguage.newValue;
    }
    if (typeof changes.darkMode?.newValue === 'boolean') {
      settings.darkMode = changes.darkMode.newValue;
    }
  });

  // 이벤트 등록
  if (!window.DRAGG_AI_EVENT_ATTACHED) {
    log('attach event');
    document.removeEventListener('mousedown', mouseDownHandler);
    document.addEventListener('mousedown', mouseDownHandler);
    document.removeEventListener('mouseup', mouseUpHandler);
    document.addEventListener('mouseup', mouseUpHandler);
    window.DRAGG_AI_EVENT_ATTACHED = true;
  }
})();

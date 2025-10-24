## 테스트 환경

1. chrome://extensions/
2. 개발자 모드 ON
3. Dir 등록 후 테스트

## 배포

1. ```bash
   zip -r ../extension.zip . \
     -x '\*.DS_Store' '\_\_MACOSX' \
     '.git/*' 'images/*' \
     '.prettierrc' 'README.md' '.gitignore'
   ```
2. https://chrome.google.com/u/2/webstore/devconsole
3. 업로드

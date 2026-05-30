@echo off
cd /d "F:\AI\个站"
echo.
echo === Deploying to Dev Branch ===
npx netlify deploy --dir="." --alias dev
echo.
echo === Done! Dev site updated at https://dev--aristerzzshagentstrategyhook.netlify.app ===
pause

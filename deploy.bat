@echo off
cd /d "F:\AI\个站"
echo.
echo === Deploying to Netlify ===
npx netlify deploy --prod --dir="."
echo.
echo === Done! Site updated at https://aristerzzshagentstrategyhook.netlify.app ===
pause

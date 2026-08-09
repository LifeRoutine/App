@echo off
cd /d "%~dp0apps\prototype"
echo LifeRoutine Prototyp startet...
echo http://localhost:3001
npm run dev -- -p 3001
pause

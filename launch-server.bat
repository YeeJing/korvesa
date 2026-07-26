@echo off
cd /d "%~dp0"

if not exist node_modules (
    echo Installing dependencies...
    call npm.cmd install
)

call npm.cmd run dev -- --host 0.0.0.0
pause

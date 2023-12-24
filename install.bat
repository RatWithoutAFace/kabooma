@echo off
node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed.
    winget install -e --id OpenJS.NodeJ
    echo Installed Node.js.
) else (
    echo Node.js is already installed.
)

echo Now installing Kabooma dependencies...
npm install

:loop
set /p "runProgram=Do you wish to run this program? [Y/N]: "
if /i "%runProgram%"=="Y" (
    node index
    exit /b
) else if /i "%runProgram%"=="N" (
    exit /b
) else (
    echo Please answer yes or no.
    goto loop
)
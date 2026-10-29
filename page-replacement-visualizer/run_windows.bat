@echo off
setlocal EnableDelayedExpansion

title Page Replacement Visualization System - Launcher

echo =====================================================================
echo    Page Replacement Visualization System - Windows Launcher
echo =====================================================================
echo.

:: 1. Check Python installation
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python was not found in your system PATH!
    echo Please install Python 3.10 or newer from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('python --version') do set PYTHON_VER=%%i
echo [*] Detected %PYTHON_VER%

:: 2. Check and create virtual environment in project root
set "PROJECT_DIR=%~dp0"
set "VENV_DIR=%PROJECT_DIR%.venv"
set "VENV_PYTHON=%VENV_DIR%\Scripts\python.exe"
set "VENV_ACTIVATE=%VENV_DIR%\Scripts\activate.bat"

if not exist "%VENV_PYTHON%" (
    echo [*] Creating virtual environment (.venv)...
    python -m venv "%VENV_DIR%"
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to create virtual environment!
        pause
        exit /b 1
    )
    echo [*] Virtual environment created successfully.
)

:: 3. Activate virtual environment
echo [*] Activating virtual environment...
call "%VENV_ACTIVATE%"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to activate virtual environment!
    pause
    exit /b 1
)

:: 4. Verify and install requirements if needed
echo [*] Checking dependencies...
"%VENV_PYTHON%" -c "import streamlit, plotly, pandas, pytest" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [*] Installing or updating dependencies from requirements.txt...
    "%VENV_PYTHON%" -m pip install --upgrade pip
    "%VENV_PYTHON%" -m pip install -r "%PROJECT_DIR%requirements.txt"
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Dependency installation failed! Check your internet connection.
        pause
        exit /b 1
    )
    echo [*] Dependencies installed successfully.
) else (
    echo [*] All required packages are already installed. Skipping reinstallation.
)

:: 5. Launch Streamlit application
echo.
echo =====================================================================
echo    Launching Page Replacement Visualization System Dashboard...
echo =====================================================================
echo    URL will open in your default browser.
echo    Press Ctrl+C in this terminal window to stop the server.
echo =====================================================================
echo.

streamlit run "%PROJECT_DIR%app.py"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Streamlit encountered an issue or closed unexpectedly.
    pause
)

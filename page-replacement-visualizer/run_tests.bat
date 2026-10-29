@echo off
setlocal EnableDelayedExpansion

title Page Replacement Visualization System - Test Runner

echo =====================================================================
echo    Running Automated Test Suite (Pytest)
echo =====================================================================
echo.

set "PROJECT_DIR=%~dp0"
set "VENV_PYTHON=%PROJECT_DIR%.venv\Scripts\python.exe"

if exist "%VENV_PYTHON%" (
    echo [*] Using virtual environment Python...
    "%VENV_PYTHON%" -m pytest -v "%PROJECT_DIR%tests"
) else (
    echo [*] Virtual environment not found, falling back to system Python...
    python -m pytest -v "%PROJECT_DIR%tests"
)

set TEST_EXIT_CODE=%ERRORLEVEL%
echo.
if %TEST_EXIT_CODE% EQU 0 (
    echo =====================================================================
    echo    [SUCCESS] ALL TESTS PASSED SUCCESSFULLY!
    echo =====================================================================
) else (
    echo =====================================================================
    echo    [FAILURE] SOME TESTS FAILED (Exit Code: %TEST_EXIT_CODE%)
    echo =====================================================================
)

echo.
pause
exit /b %TEST_EXIT_CODE%

@echo off

set assignment=%1

if "%~1"=="" goto :error

set test=%2

set proj_name=%assignment%

cmake --build ./build --config Release --target %proj_name%
if not %ERRORLEVEL% == 0 goto :error

cd tutorials\%assignment%
..\..\build\tutorials\%assignment%\Release\%proj_name%.exe %test%
cd ..\..\
if not %ERRORLEVEL% == 0 goto :error



goto :endofscript

:error
echo =========================
echo There was an error!
echo =========================

:endofscript

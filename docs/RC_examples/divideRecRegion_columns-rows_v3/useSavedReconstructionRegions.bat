::CapturingReality

@ echo off

:: Call a batch file where variables for RealityCaptyre .exe file and root folder are stored.
call SetVariables.bat

:: Here we check how many rows and columns were used when divided, from the file table.txt.
(
set /p totalRows=
set /p totalColumns=
)<table.txt

:: Below here place any commands you would like to do before cycling through the reconstruction regions (such as selecting a model to work with).
%RealityCaptureExe% -delegateTo * 


:: Set variables which help recognizing when processing has finished a column or a row by comparing these values to the totalRows and totalColumns values.
set /a columnNum=1
set /a rowNum=1

:actionLoop
:: Here we cycle through the import of the reconstruction region.
%RealityCaptureExe% -delegateTo * -setReconstructionRegion "%RootFolder%reconRegions\row%rowNum%column%columnNum%.rcbox"

:: Below here place any commands you would like to do with every reconstruction region (remove pause if you don't need to work in the GUI).
pause
%RealityCaptureExe% -delegateTo * 


::  Import the next reconstruction region in the column or go to the next row.
if %rowNum% == %totalColumns% goto nextRow
set /a rowNum+=1
goto actionLoop

:: Import the reconstruction region from the first column in the next row.
:nextRow
if %columnNum% == %totalRows% goto end
set /a rowNum=1
set /a columnNum+=1
goto actionLoop

:: Finish processing.
:end
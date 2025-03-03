
rem By turning the echo off, you are turning off writing every step of the process into the Command Line
@echo off

rem Setting variables for most used directories. They can be called later by putting their name into %%, e.g. %workingDir%
rem in this case workingDir is a path to the folder where this BAT file is located
set app="C:\Program Files\Capturing Reality\RealityCapture\RealityCapture.exe"
set workingDir=%~dp0\\..\\

rem calls batch file which starts RC or just creates a new scene in already created RC instance
call startApp.bat

rem RC commands which create a model, simplify it and export it to a folder model using the export settings from RC - exportModel.xml
%app% ^
-delegateTo RC1 ^
-importComponent "%workingDir%\components\component1234.rcalign" ^
-importLicense "%workingDir%\license\ppi-licenses.rclicense" ^
-setReconstructionRegionAuto ^
-calculateNormalModel ^
-simplify 1000000 ^
-renameSelectedModel model4-1 ^
-exportSelectedModel "%workingDir%\model\model4-1.obj" "%~dp0\exportModel.xml"

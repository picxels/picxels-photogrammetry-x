
rem By turning the echo off, you are turning off writing every step of the process into the Command Line
@echo off

rem Setting variables for most used directories. They can be called later by putting their name into %%, e.g. %workingDir%
rem in this case workingDir is a path to the folder where this BAT file is located
set app="C:\Program Files\Capturing Reality\RealityCapture\RealityCapture.exe"
set workingDir=%~dp0\\..\\

rem calls batch file which starts RealityCapture or just creates a new scene in an already created RC instance
call startApp.bat

rem add and register images from folder images1
%app% -delegateTo RC1 -addFolder "%workingDir%\images1" -align

rem add and register images from folder images2
%app% -delegateTo RC1 -addFolder "%workingDir%\images2" -align

rem add and register images from folder images3
%app% -delegateTo RC1 -addFolder "%workingDir%\images3" -importLicense "%workingDir%\license\ppi-licenses.rclicense" -align

rem Following are RealityCapture commands that export XMP metadata files for the largest component in the scene
%app% ^
-delegateTo RC1 ^
-selectMaximalComponent ^
-renameSelectedComponent component123 ^
-exportXMPForSelectedComponent ^
-exportSelectedComponent "%workingDir%\components\\"

rem Waits for the last preceding process to be finished before it continues
call waitCompleted.bat 

rem Cycle which moves XMP files from folders images1/2/3 to the folder cameras123
FOR /L %%I IN (1,1,3) DO (
    MOVE /Y "%workingDir%\images%%I\*.xmp" "%workingDir%\cameras123\\"
)

REM These scripts were created by Epic Games Slovakia, who doesn't carry any liability in case issues related to the sample occur.

REM Disable the Command Prompt comments.
@echo off

REM Enable delayed expansion to be able to change values in the FOR cycle.
setlocal enabledelayedexpansion

REM Set the path to the RealityCapture executable file.
set RCexe="C:\Program Files\Capturing Reality\RealityCapture\RealityCapture.exe"

REM Create an image list from the open project.
set "imageListFile=%~dp0images_speedtex.imagelist"

REM Disable Texturing in all of the images in the project.
%RCexe% -delegateTo * -selectAllImages -editInputSelection "Enable texturing and coloring=False" -deselectAllImages -exportRegistration "%imageListFile%" "%~dp0imageListSetting.xml"

REM Ask what percentage of images to use.
set /p option="Which images should be used in texturing? (1 for every image, 2 for every other, 3 for every 3rd....etc ): "

REM Enable texturing for selected images.
set "counter=0"

REM Start the FOR cycle.
for /f "delims=" %%i in ('type "%imageListFile%"') do (
    REM Increase the counter value by 1.
    set /a "counter+=1"
    REM If the counter valye equals the option value, enable for texturing the image from the current row.
    if !counter! equ %option% (
        %RCexe% -delegateTo * -selectImage "%%i" -editInputSelection "Enable texturing and coloring=True"
        set "counter=0"
    )
)

REM Clean up: Delete the image list file.
del "%imageListFile%"

REM End the delayed expansion.
endlocal
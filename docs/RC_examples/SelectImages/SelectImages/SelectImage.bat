::This script was created by Epic Games Slovakia

:: Switch off console output.
@echo off

call SetVariables.bat

:: A path to the folder with images
set Images=%RootFolder%Images

:: Select one specific image
set Select_1=%Images%\IMG_3478.JPG

:: Select all images with "IMG" in their name or path
set Select_2=g/IMG/

:: Select images which contain "I" and "G" and have one character in between
set Select_3=g/I.G/

:: Select images which contain "I" and "7" and have other characters in between
set Select_4=g/I.*7/

:: Select images which end on "2", "3" and "7" before the extensions
set Select_5=g/[237]\./

:: Select images which end on "2" and "5" and have .jpg extension
set Select_6=g/[25]\.jpg/

:: Select images which contain "IMG", and ends with "5" 
set Select_7=g/IMG.*[5]/


:: Run RealityCapture
%RealityCaptureExe% -newScene ^
        -addFolder %Images% ^
        -selectImage %Select_1% 
        
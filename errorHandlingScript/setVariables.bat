@echo off

:: Set the RealityCapture execution file.
set RCexe="C:\Program Files\Capturing Reality\RealityCapture\RealityCapture.exe"

:: The name of the RealityCapture instance that is going to be used.
set instanceName=RC1

:: Set a path to the folder in which the batch files are located.
set rootFolder=%~dp0

:: Set a path to the folder where project is going to be saved.
set projectFolder=%rootFolder%\project

:: Set a path to the folder with images.
set imageFolder="%rootFolder%\images"

:: Set a path to the folder for the metadata.
set metadata=%rootFolder%\metadata

:: Set a path to the file with the RealityCapture commands.
set commandFile=%rootFolder%\commandFile.bat

:: Set a path to the RealityCapture log file.
set RClog="C:\Users\%username%\AppData\Local\Temp\RealityCapture.log"

:: Set a path where the project will be saved, as well as its name and the .rcproj extension.
set projectFile="%projectFolder%\project.rcproj"
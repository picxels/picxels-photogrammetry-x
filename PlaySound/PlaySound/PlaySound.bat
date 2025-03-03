::CapturingReality

@echo off

:: set the path to the audio file which you want to play when process is finished.
set AudioFile="%~dp0\MissionComplete.mp3"

:: set the name of the execution file of the player used to run audio files in your machine
set Player="wmplayer.exe"

:: open audio file
%AudioFile%

:: timeout before closing the player - the length of the audio file is also taken into the consideration
timeout 5

:: closes player
taskkill /f /im %Player%

:: closes CMD window
exit /b
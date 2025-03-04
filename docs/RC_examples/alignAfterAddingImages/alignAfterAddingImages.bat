@echo off

:: Calls a batch file which containt important variables.
call SetVariables.bat

:: Asks user to write the name of the folder with images in the Command Prompt window.
set /p imageFolder="What is the name of the folder with the images in it? "

:: Minimal amount of images that needs to be added to re-run the alignment.
set /a minimalImages=5

:: The amount of images registered in the previous iteration.
set /a previousImages=0

:: Timeout between processes.
set /a delay=5

:: A process which constantly checks folder for new images.
:checkFolder

:: Varible which is going to be used to store the amount of images registered in the folder.
set /a amountImages=0

:: Cycle which checks the amount of images in the folder, and assign this number to the variable amountImages.
for %%f in ("%imageFolder%"\*.jpg) do (
  set /a amountImages+=1
  )

:: Variable containing the amount of added images.
set /a addedImages=%amountImages%-%previousImages%

set /a missingImages=%minimalImages%-%addedImages%

:: If the amount of images in the folder has not changed loop (checkFolder) goes back to start.
if %amountImages%==%previousImages% (
echo "There are %amountImages% images in "%RootFolder%%imageFolder%"."
echo "No more images have been added to the folder."
timeout %delay% 
goto checkFolder 
)

:: If the amount of images is smaller then the amount of defined minimal amount of images, loop will go back to start.
if %addedImages% lss %minimalImages% (
echo "There are %amountImages% images in "%RootFolder%%imageFolder%"."
echo "Minimum number of added images (%minimalImages%) not met, please add %missingImages% more images"
timeout %delay% 
goto checkFolder 
)

:: If the amount of images in the folder has changed, and their count is larger than 5, images will be imported and aligned.
echo "The required amount of added images detected (%addedImages%). RealityCapture will align images."
%RealityCaptureExe% -delegateTo * -addFolder "%RootFolder%%imageFolder%" -align
timeout %delay%

:: Set the current amount of images to the variable containing previous amount og images.
set /a previousImages=%amountImages%

::Repeat the loop.
goto checkFolder



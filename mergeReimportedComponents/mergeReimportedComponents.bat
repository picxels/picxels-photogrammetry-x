:: This script was created by Capturing Reality ©

:: Disable the Command Prompt output.
@ echo off

:: Call a batch file where variables for ReconstructionRegion .exe file and root folder are stored.
call SetVariables.bat

:: Input the format of the imgaes. Requires an interaction in the Command Prompt.
set /p format="FORMAT OF THE IMAGES: "

:: Enables the delayed environment variable expansion until the matching endlocal command is encountered.
setlocal EnableDelayedExpansion

:: A value that is used to export the components in an order starting from 1.
set componentOrder=1

:: A FOR cycle in which JPG images are listed in an image list, uploaded to RealityCapture, aligned, and exported as a component.
:: The cycle goes through the subfolders in the root folder.
for /d %%G in ("%RootFolder%\*") do (

    :: Writes out in the Command Prompt which subfolder is currently being processed.
    echo "Processing folder %%~nG"   
    
    :: Create an imagelist with paths to the JPG images.
    dir /b /s %%G\*.%format% > %%G\%format%.imagelist
    :: If the created image list is empty, the componentOrder value will be detracted by 1.
    >nul findstr "^" "%%G\%format%.imagelist" || set /a componentOrder-=1
    :: If the created image list is empty, it will be deleted.
    >nul findstr "^" "%%G\%format%.imagelist" || del "%%G\%format%.imagelist"
    
    :: Align images in RealityCapture and export them as a component.
    %RealityCaptureExe% -set "appQuitOnError=true" -add "%%G\%format%.imagelist" -align -selectMaximalComponent -renameSelectedComponent "Component_!componentOrder!" -exportSelectedComponent "%RootFolder%\components" -quit
    
    :: Increase the componentOrder value by 1.
    set /a componentOrder+=1      
)

:: Disable the delayed environment variable expansion and set the componentOrder value to the componentNumber variable.
endlocal&set "componentNumber=%componentOrder%"

:: Start RealityCapture and set the name of an instance to RC1.
start "" %RealityCaptureExe% -setInstanceName RC1

:: Wait for the license activation. This action will loop until the activation is finished.
:waitStart
%RealityCaptureExe% -getStatus RC1
IF /I "%ERRORLEVEL%" NEQ "0" (
    echo Checking
    goto :waitStart
)

:: Loop through components and import them based on their order number.
:import

:: Detract the componentNumber value by 1.
set /a componentNumber-=1

:: If the componentNumber value is equal to zero, go to the section mergeComponents.
if %componentNumber%==0 goto process

:: Import the components into RealityCapture.
%RealityCaptureExe% -delegateTo RC1 -importComponent "%RootFolder%\components\Component_%componentNumber%.rcalign"


:: Go back to the start of the section import.
goto import

:: Process the re-imported components.
:process

:: Merge components
%RealityCaptureExe% -delegateTo RC1 ^
        -mergeComponents
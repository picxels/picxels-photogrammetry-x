::CapturingReality

@ echo off

:: Call a batch file where variables for ReconstructionRegion .exe file and root folder are stored
call SetVariables.bat
:: Create a folder named reconRegions in which new reconstruction regions are going to be stored if the folder with that name doesn't already exist.
if not exist "%RootFolder%reconRegions" mkdir "%RootFolder%reconRegions"

:: Questions about the number of rows and columns. Demand user's attention in Command Prompt.
set /p totalColumns=[How many COLUMNS do you want to separate your reconstruction region into?]
set /p totalRows=[How many ROWS do you want to separate your reconstruction region into?]
::Here we will save the number of rows and columns to a file table.txt in the root folder, this information can then be used by other scripts so they can use the saved reconstruction regions
(
echo %totalColumns%
echo %totalRows%
)>table.txt
:: Questions about the overlap between reconstruction regions. Demand user's attention in Command Prompt.
set /p overlapBool=[Would you like to have OVERLAP between reconstruction regions? y/n]
:: If no (n) is chosen, second question will be skipped. 

if %overlapBool% == n goto skipOverlap

:: The size of the reconstruction regions can be increased up to 9%.
set /p scaleBy=[How much overlap would you like between reconstruction regions as a percentage? (1 is min: 9 is max)]

set /a overlapFactor=100+%scaleBy%
:: A variable used to scale the reconstruction region to back to its original size once the overlap was created.
set /a scaleBack=100000000/%overlapFactor%

:skipOverlap

:: Set the scaling factor of the existing reconstruction region based on the number of rows and columns.
set /a firstBoxXScale="100000/%totalColumns%"

set /a firstBoxYScale="100000/%totalRows%"

:: Setting exponents which enable user to divide region up to 10 000 times
set exponentRows=0.

if %totalColumns% gtr 10 set exponentRows=0.0

if %totalColumns% == 1 set exponentRows= & set /A firstBoxXScale=1

set exponentColumns=0.

if %totalRows% gtr 10 set exponentColumns=0.0

if %totalRows% == 1 set exponentColumns= & set /A firstBoxYScale=1

::saves the original reconstruction region
%RealityCaptureExe% -delegateTo * -exportReconstructionRegion "%RootFolder%reconRegions\original.rcbox"

:: Scales the reconstruction region based on the chosen number of rows and columns.
%RealityCaptureExe% -delegateTo * -scaleReconstructionRegion %exponentColumns%%firstBoxYScale% %exponentRows%%firstBoxXScale% 1 origin factor 

:: Start of loop for moving east or +x.
:rowLoop

:: Sets the value of columnNumber to 1 and increases it with each loop.
set /a columnNumber+=1

:: Start of loop for moving north or +y.
:columnUpLoop

:: Sets values of rows and rowNumber to 1 and increases them with each loop.
set /a rows+=1
set /a rowNumber+=1

:: If overlap is not needed, it jumps to the mark noOverlap.
if %overlapBool% == n goto noOverlap

:: Scales the reconstruction region based on the chosen overlap.
%RealityCaptureExe% -delegateTo * -scaleReconstructionRegion 1.0%scaleBy% 1.0%scaleBy% 1 center factor 

:: Exports the reconstruction region.
%RealityCaptureExe% -delegateTo * -exportReconstructionRegion "%RootFolder%reconRegions\row%columnNumber%column%rowNumber%.rcbox"

:: Scaling the reconstruction region back to its original size.
%RealityCaptureExe% -delegateTo * -scaleReconstructionRegion 0.%scaleBack% 0.%scaleBack% 1 center factor

:noOverlap

:: Goes to mark overlapDone if option to have an overlap was chosen.
if %overlapBool% == y goto overlapDone

:: Exports the reconstruction region.
%RealityCaptureExe% -delegateTo * -exportReconstructionRegion "%RootFolder%reconRegions\row%columnNumber%column%rowNumber%.rcbox"

:overlapDone

:: Moves the reconstruction north or +y.
%RealityCaptureExe% -delegateTo * -scaleReconstructionRegion 1 2 1 origin factor -scaleReconstructionRegion 1 0.5 1 center factor -scaleReconstructionRegion 1 2 1 origin factor -scaleReconstructionRegion 1 0.5 1 center factor 

:: If number of rows corresponds to the current row it will go to mark columnLoopUpEnd.
if %rows% == %totalColumns% goto columnLoopUpEnd

:: Goes back to the mark columnUpLoop.
goto columnUpLoop

:columnLoopUpEnd

:: Sets the value of columns to 1 and increases it with each loop.
set /a columns+=1

:: If number of columns corresponds to the number of the current column it will go to mark end.
if %columns% == %totalRows% goto end

::load original Reconstruction Region and scale down
%RealityCaptureExe% -delegateTo * -setReconstructionRegion "%RootFolder%reconRegions\original.rcbox"
%RealityCaptureExe% -delegateTo * -scaleReconstructionRegion %exponentColumns%%firstBoxYScale% %exponentRows%%firstBoxXScale% 1 origin factor 

::move down to the correct row
set /a rowjump = 0
:gotorightspotloop
%RealityCaptureExe% -delegateTo * -scaleReconstructionRegion 2 1 1 origin factor -scaleReconstructionRegion 0.5 1 1 center factor -scaleReconstructionRegion 2 1 1 origin factor -scaleReconstructionRegion 0.5 1 1 center factor 
set /a rowjump += 1
if %rowjump% lss %columnNumber% goto gotorightspotloop

:: Resets the rows value to zero, and the rowNumber. 
set /a "rows=0"

set /a rowNumber=0

goto rowLoop

:end
echo Finished.
timeout 3


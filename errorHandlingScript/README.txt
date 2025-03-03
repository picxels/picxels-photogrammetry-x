These scripts were created by Epic Games Slovakia, who doesn't carry any liability in case issues related to the sample occur. 

A collection of batch files that can be used for error and crash control. If an error occurs, RealityCapture will restart itself 
and try to run the problematic line again. In case RealityCapture crashes, the whole process will be repeated.

All you need to do is:

1. Change the path to the source folders in the SetVariables.bat as follows:

	RCexe - path to the installation folder where RealityCapture.exe is stored,
	RootFolder - path to all source folders (where this README.txt file is located). No need to change the path if you preserve the original structure of the files and folders.

2. Run ProcessFile.bat (doubleclick)


DESCRIPTION OF BATCH FILEs
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
setVariables.bat 

Setting the variables (if the original data structure and naming is preserved, no need to change them):

   RCexe			The RealityCapture execution file.
   instanceName			The name of an RealityCapture instance that is going to be used for processing.
   rootFolder			A folder in which the batch files are located.
   projectFolder		A folder in which the project is going to be saved.
   imageFolder			A folder with images.
   metadata			A folder where the status text file and the crash files are going to be stored.
   commandFile			A file with the RealityCapture commands.
   RClog			The RealityCapture log file.
   projectFile			The path and the name of the project.
   
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
startApp.bat

Start a RealityCapture instance and wait for the activation to finish.

Processing:
- start RealityCapture
- set the instance name
- use the silent command to suppress crash reports
- get the RealityCapture status
- check the %ERRORLEVEL%
- finish activation if %ERRORLEVEL% equals zero
- set the RealityCapture instance to quit on error
- save the RealityCapture project


- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
loadProject.bat

Start a RealityCapture instance, wait for the activation to finish, and load an existing project. This batch file runs after a crash.

Processing:
- start RealityCapture
- set the instance name
- use the silent command to suppress crash reports
- get the RealityCapture status
- check the %ERRORLEVEL%
- finish activation if %ERRORLEVEL% equals zero
- set the RealityCapture instance to quit on error
- load the RealityCapture project

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
processFile.bat

Run RealityCapture commands listed in the commandFile.bat, and check for the error and crashings. 

Setting the variables (if the original data structure and naming is preserved, no need to change them):

   lines			A number of lines in the commandFile.bat.
   crashNumber			A number that indicates how many times RealityCapture crashed.
   errorNumber			A number that indicates how many times 
   lineNumber			A number of the line that will be run if the counter value is the same.
   counter			A value indicating the cycle process. If equals the lineNumber value, the command line correspodning to the lineNumber will run.
   
Processing:
- set variables using the setVariables.bat
- write out the amount of lines in the commandFile.bat as a variable lines
- start new RealityCapture instance using the startApp.bat
- enable delayed expansion 
- cycle through the lines in the commandFile.bat
- if the counter (increases with each cycle and reset at the end) equals lineNumber, run the command line corresponding to the lineNumber value
- if error occurs, reset RealityCapture and repeat from the line where the error happened
- if crash occurs, reset RealityCapture and start from the beginning 

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
commandFile.bat

Write each command into a new line.
Don't use CMD line connectors (e.g. ^; -align ^).
If using variables, don't use %VARIABLE%. but use !VARIABLE! instead.



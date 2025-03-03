These scripts were created by Epic Games Slovakia, who doesn't carry any liability in case issues related to the sample occur.

These scripts can be used to automatically align images in the already open RealityCapture scene after five of more images were added to the folder with images. Script checks the image folder to see if minimal required amount of images were added. Once they are detected, they are added to the open RealityCapture scene (RealityCapture has to be opened beforehand), and alignment will be executed. Minimal amount of images can be adjusted in the script.

You can download any sample dataset that can be used to run this script here, for example "Head Scan"
https://www.capturingreality.com/SampleDatasets


All you need to do is:

1. Change the path to the source folders in the SetVariables.bat as follows:

RealityCaptureExe - path to the installation folder where RealityCapture.exe is stored
RootFolder - path to all source folders (where batch files and folder with images are located)

2. Run alignAfterAddingImages.bat (doubleclick)

DESCRIPTION OF BATCH FILES
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
SetVariables.bat 

Setting the path to the RealityCapture application and the path to the folder with source data.
This batch file is called inside the alignAfterAddingImages.bat.

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
alignAfterAddingImages.bat 

This batch file contains:

Setting the variables (if the original data structure and naming is preserved, no need to change them):

   imageFolder        	A path to the folder to which images will be added.
   mininalImages	The minimal amount images that need to be added to image folder for them to be added to the open RC scene and to be aligned.
   previousImages	The amount of images in the image folder before new images were added.
   delay		Timeout between each process.
   amountImages		The amount of images in the image folder after new images were added (current amount).
   addedImages		The amount of newly added images to the image folder.
   missingImages	The amount of images that has to be added to the image folder to meet up the required amount defined as a minimal amount of images.

Processing:
- asks user to write the name of the image folder in the Command Prompt (image folder should be in the same folder as batch files)
- define the checkpoint of the processing to which it is possible to go to (used to loop the process) > :checkFolder
- a "for" cycle which checks the amount of images in the image folder
- if amount of images in the image folder equals to the amount of previously detected images loop will restart (from :checkFolder)
- if amount of added images is less than defined minimal requirement loop will restart (from :checkFolder)
- in case required amount of images was added to the image folder, processing in RealityCapture will be executed
- loop restarts (from :checkFolder)

Processing in RealityCapute:
- delegate to the open RealityCapture instance
- add images
- align


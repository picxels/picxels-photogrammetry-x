These scripts were created by Epic Games Slovakia, who doesn't carry any liability in case issues related to the sample occur. 
 
This folder contains batch files that can be used to loop through the subfolders in a root folder, create components from images of a certain format, and to finally combine those components into one.
There is going to be one component created for each subfolder in which images with the chosen format can be found.

For these batch files to work, place them into the root folder where all subfolders are located.

All you need to do is:

1. Change the path to the source folders in the Scripts\SetVariables.bat as follows:

	RealityCaptureExe - path to the installation folder where RealityCapture.exe is stored,
	RootFolder - path to all source folders (where this README.txt file is located).
    
2. Run mergeReimportedComponents.bat (doubleclick)

DESCRIPTION OF BATCH FILES
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
SetVariables.bat 

Set the path to the RealityCapture application and the path to the folder with source data.
This batch file is called inside the mergeReimportedComponents.bat.

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
mergeReimportedComponents.bat

In this batch file, the images from each subfolder are aligned separately, and then combined into one component.
This batch file contains:

Setting the variables (if the original data structure and naming is preserved, no need to change them):

   RootFolder		By default this variable is set to the directory in which the SetVariables.bat is stored.
   RealityCaptureExe	Path to the RealityCapture's .exe file.
   format		The format of the images that are going to be used. This values is input by the user in the Command Prompt when the batch file is run.
   componentOrder	A value that is being used to number the components based on the processing order.
   componentNumber	Replaces the componentOrder value.
   
Processing:
- input the image format in the Command Prompt
- start the FOR cycle
- create an image list file containing the names of the images with the chosen format
- if the created image list is empty, reduce the componentOrder value by one and delete the image list file
- processing in RealityCapture*
- increase the componentOrder value by one
- end the FOR cycle
- replace the componentOrder value with componentNumber
- start RealityCapture
- wait for RealityCapture to initialize license
- reduce the componentNumber value by one
- import components into RealityCapture
- once the componentOrder value reaches zero, run the alignmnent to combine all imported components

* Processing in RealityCapture:
- open RealityCapture
- set it to quit RealityCapture when it encounters an error
- import images based on the created image list
- align images
- select a component with the most cameras
- rename the selected component
- export the selected component
- quit RealityCapture

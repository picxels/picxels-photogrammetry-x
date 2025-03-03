These scripts were created by Epic Games Slovakia, who doesn't carry any liability in case issues related to the sample occur.
This example shows how to use delegation of commands in RealityCapture. 
You can download any sample dataset that can be used to run this script here https://www.capturingreality.com/SampleDatasets

Below you can find an explanation of folder structure as well as created .bat files.

Folder structure:
\_scripts - all the scripts and parametric files are stored here
\images1, \images2, \mages3, \images4 - all input images are stored here
\components - exported RealityCapture components (.rcalign) are stored here, see Align_123.bat and Align_4.bat
\cameras123 - exported XMP files are moved to this folder, see Align_123.bat
\cameras1234 - exported XMP files are moved to this folder, see Align_4.bat
\model - exported 3D models and textures are stored here, see model4-1.bat and model4-2_texture.bat
\license - license file than enables free export of the results in an anonymous PPI mode

All you need to do is:

1. change the path to RealityCapture.exe in the .bat file _scripts\startApp.bat

app - path to the installation folder where RealityCapture.exe is stored

2. run _ProcessAll.bat (doubleclick)

(if you change the folder structure, please change the path to the folder with files in each .bat file, variable "workingDir")

DESCRIPTION OF BATCH FILEs
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Created batch files:

"Align_123.bat"
This example shows how to:
1. start RealityCapture and delegate commands into a specific instance
2. incremental loading of specific folders with images into the existing scene and alignment of images
3. export of the largest component, XMP metadata files and their removal to the specific folder

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

"Align_4.bat"
This example shows how to:
1. import the largest component exported in Align_123.bat into an empty scene
2. add images from another folder and align images
3. export of the largest component, XMP metadata files and their removal to the specific folder

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

"model4-1.bat" 
This example shows how to: 
1. import the largest component exported in Align_4.bat into an empty scene
2. calculate model in normal detail
3. simplify the model to the target triangle count
4. rename simplified model and export it into a specified folder using parameters from the exportModel.xml

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

"model4-2_texture.bat"
This example shows how to:
1. import the largest component exported in Align_4.bat into an empty scene
2. calculate model in normal detail
3. simplify the model to the target triangle count
4. rename the simplified model 
5. texture the simplified model and export it into a specified folder using parameters from the exportModel.xml

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

"runAll.bat"
This example shows how to:
1. run all the previously mentioned batch files

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

"startApp.bat"
This example shows how to:
1. check if RealityCapture is already opened
2. if Yes, open the new scene in the specified instance
3. if No, open a new instance of RealityCapture and set its name

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

"waitCompleted.bat"
This example shws how to:
1. wait for RealityCapture to be done with the process so the batch file can continue

"waitCompleted.bat"
This example shows how to:
1. check if the process is finished in the specified instance of RealityCapture
(use this to check whether your batch file can continue)

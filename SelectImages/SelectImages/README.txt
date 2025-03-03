These scripts were created by Epic Games Slovakia, who doesn't carry any liability in case issues related to the sample occur. 
You can use the Small Plastic data from our website https://www.capturingreality.com/SampleDatasets.

In this folder you can find a set of batch files used to select images imported from the Small Plastic data (folder "testset-ga"). 

All you need to do is:

1. Copy the source images into the folder "Images"

2. Change the path to the source folders in the Scripts\SetVariables.bat as follows:

	RealityCaptureExe - path to the installation folder where RealityCapture.exe is stored,
	RootFolder - path to all source folders (where this README.txt file is located). No need to change the path if you preserve the original structure of the files and folders.

3. Run SelectImage.bat (doubleclick)

DESCRIPTION OF BATCH FILES
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
SetVariables.bat 

Setting the path to the RealityCapture application and the path to the folder with source data.
This batch file is called inside the SelectImage.bat.

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
SelectImage.bat

In this batch file images are added to a new scene and various selecting options can be found.

Setting the variables (if the original data structure and naming is preserved, no need to change them):

   Images		    A path to the folder which contains images.
   Select_1			Select only one specific image. Full path of the image is needed.
   Select_2			Select images with IMG in their name or path. The placement of it does not matter.
   Select_3			Select images that contain letters I and G with one character in between them. Dots represent the number of characters. If you want to have two characters in between, write two dots. 
   Select_4			Select images that contain I and 7 and have some other characters in between them. Writing dot and asteriks together means that the number of characters is not defined.
   Select_5			Select images which end on 2,3 and 7. Dot represents the start of the extension.
   Select_6			Select images which end on 2, and 5 and have .jpg extension.
   Select_7			Select images which contain IMG, end on 5 and have undefined amount of characters in between.

Processing in RealityCapture:
- open a new scene,
- add folder with images,
- select images based on the used variable.

NOTE
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Variables Select 1-7 are just examples. You can use which ever you want, just change the variable in the command selectImage. 
E.g., if you want to use Select_4, change the command to:
	-selectImage %Select_4%

Alternatively, you can just put the selectImage command into file with extension .rccmd and drag and drop this file directly into the RealityCapture (see attached SelectImageGUI.rccmd file).

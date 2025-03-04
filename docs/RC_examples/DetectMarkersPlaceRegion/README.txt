These scripts were created by Epic Games Slovakia, who doesn't carry any liability in case issues related to the sample occur. 
You can use the Full Body Scan data from our website https://www.capturingreality.com/SampleDatasets.
Epic Games Slovakia s.r.o. would like to thank the company PI3DSCAN (www.pi3dscan.com) for the opportunity to use their datasets Set2-a, Set2-b, Set2-c and Set-logo in this tutorial and also for the permission to distribute them.

In this folder you can find a set of batch files used to process full-body scan images (e.g. images for geometry and texture layer from "Set2-a" folder), detect markers and create a custom reconstruction region using the detected markers. 

All you need to do is:

1. Change the path to the source folders in the Scripts\SetVariables.bat as follows:

	RealityCaptureExe - path to the installation folder where RealityCapture.exe is stored,
	RootFolder - path to all source folders (where this README.txt file is located). No need to change the path if you preserve the original structure of the files and folders.
    
2. Copy the .geometry and .texture layer image folders to the folder "Images"

3. Run Scripts\_ProcessAll.bat (doubleclick)

DESCRIPTION OF BATCH FILEs
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
SetVariables.bat 

Setting the path to the RealityCapture application and the path to the folder with source data.
This batch file is called inside the _ProcessAll.bat.

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
_ProcessAll.bat

In this batch file the creation and editing of the reconstruction region on the detected markers is defined. 
This batch file contains:

Setting the variables (if the original data structure and naming is preserved, no need to change them):

   ImagesGeometry			A path to the folder which contains images for alignment and meshing.
   ImagesGTexture			A path to the folder which contains images for texturing. Markers are detected on this image layer.
   Metadata			        A path to the Metadata folder where the parametric files and the folder with XMP files are located.
   FirstMarker			    A name of the first marker/control point.
   SecondMarker			    A name of the second marker/control point.
   ThirdMarker			    A name of the third marker/control point.
   FourthMarker			    A name of the fourth marker/control point.
   FirstDistance		    A distance between the first and the second marker.
   FirstDistanceName		The name of the first distance.
   SecondDistance		    A distance between the first and the third marker.
   SecondDistanceName		The name of the second distance.
   DetectMarkersParams		A path to the file with parameters used for the marker detection.

Processing in RealityCapute:
- open a new scene,
- add folder with images,
- detect markers with imported parameters,
- define distances,
- align,
- select a component with the most cameras,
- set reconstruction region on detected markers with a custom height,
- set ground plane to the reconstruction region,
- move reconstruction region up,
- scale reconstruction region to the absolute value from the center of the reconstruction region,
- save the project,
- close RC.

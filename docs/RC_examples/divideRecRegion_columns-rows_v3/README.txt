These scripts were created by Epic Games Slovakia, who doesn't carry any liability in case issues related to the sample occur. 
 
This folder contains batch files which enable users to divide their existing reconstruction region from the open project into up to 10 000 regions based on the number of chosen rows and columns, and export them into the reconRegions folder.
Rows are defined on the X axis, and they advance in the positive direction (+X). Columns are defined on the Y axis, and they advance in the positive direction (+Y). E.g. when using GPS (WGS 84) coordinate system (epsg:4326), rows move from west to east, and columns from south to north.

All you need to do is:

1. Change the path to the source folders in the Scripts\SetVariables.bat as follows:

	RealityCaptureExe - path to the installation folder where RealityCapture.exe is stored,
	RootFolder - path to all source folders (where this README.txt file is located). No need to change the path if you plan to create a reconRegion folder in the same folder where these batch files are stored.
    
2. Run divideReconstructionRegion_RowsColumns.bat (doubleclick)

DESCRIPTION OF BATCH FILES
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
SetVariables.bat 

Setting the path to the RealityCapture application and the path to the folder with source data.
This batch file is called inside the divideReconstructionRegion_RowsColumns.bat.

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
divideReconstructionRegion_RowsColumns.bat

In this batch file the division of the existing reconstruction region occurs.
This batch file contains:

Setting the variables (if the original data structure and naming is preserved, no need to change them):

   RootFolder		By default this variable is set to the directory in which the SetVariables.bat is stored.
   RealityCaptureExe	Path to the RealityCapture's .exe file.
   totalRows		Set the amount of rows which reconstruction region will be divided into.
   totalColumns		Set the amount of columns which reconstruction region will be divided into.
   overlapBool		Enables users to choose if their reconstrucion regions are going to have an overlap.
   scaleBy		Set the value of the overlap in percents. Value can be from 1 to 9.
   overlapFactor	Factor which defines overlap.
   firstBoxXScale	Factor used to scale the existing reconstruction region on the x-axis.
   firstBoxYScale	Factor used to scale the existing reconstruction region on the y-axis.
   exponentRows		Factor which enables separation into up to 100 rows.
   exponentColumns	Factor which enables separation into up to 100 columns.
   scaleBack		A variable used to scale region back to the size without an overlap.
   columnNumber		A number of the column.
   rows			Number of rows in the iteration.
   rowNumber		A number of the row.
   columns		Number of columns in the iteration.
   
Processing outside of RealityCapture:
- input the amount of rows into Command Prompt
- input the amount of columns into Command Prompt
- save table.txt with the variables totalColumns and totalRows
- choose if there is going to be an overlap between regions in Command Prompt
- if overlap was chosen to be created, set the amount of overlap between regions (1-9%)
    
Processing in RealityCapture:
- scale the existing reconstruction region based on the chosen amount of rows and columns,
- scale to the size of a reconstruction region with an overlap,*
- export reconstruction region,
- scale back to the reconstruction region without an overlap,*
- move the reconstruction region to the next column (+Y),
- move to the next row (+X) if all columns were processed, and if this was not the last row,
- scale to the size of a reconstruction region with an overlap,*
- export reconstruction region,
- scale back to the reconstruction region without an overlap,*
- move the recostruction region to the next column (-Y),
- move to the next row (+X) if all columns were processed, and if this was not the last row,
- if that was not the last row, go back to the second step, otherwise finish processing.

* these steps are executed only if overlap was enabled

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
useSavedReconstructionRegions.bat

This batch file uses the reconstruction regions made using divideReconstructionRegion_RowsColumns.bat

Setting the variables (if the original data structure and naming is preserved, no need to change them):

   RootFolder		By default this variable is set to the directory in which the SetVariables.bat is stored.
   RealityCaptureExe	Path to the RealityCapture's .exe file.
   totalRows		The amount of rows which reconstruction region was divided into.
   totalColumns		The amount of columns which reconstruction region was divided into.
   columnNum        The column number of the current reconstruction region
   rownNum          The row number of the current reconstruction region
   
Processing outside of RealityCapture:
- loading the variables totalColumns and totalRows from table.txt file.
- pausing script between loading each reconstruction region
   
Processing in RealityCapture:
- setting the the reconstruction region, using the reconstruction regions saved by divideReconstructionRegion_RowsColumns.bat


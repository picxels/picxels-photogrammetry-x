These scripts were created by Epic Games Slovakia, who doesn't carry any liability in case issues related to the sample occur. 

In this folder you can find a simple script which enables users to install RealityCapture with only basic user interface displayed. It is possible to choose installation folder and wheter to create an installation log file, 
but this two options are optional and they can be removed. 

All you need to do is:

1. Change the path to the installation file of the RealityCapture version you want to install in installRealityCapture.bat.

2. Change the path to the installation folder in which RealityCapture is going to be stored after the installation in installRealityCapture.bat. (optional)

3. Change the path to the log file in installRealityCapture.bat. (optional)

3. Run installRealityCapture.bat (doubleclick)

DESCRIPTION OF BATCH FILE
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
installRealityCapture.bat

In this batch file RealityCapture is installed based on the installation file.
Setting the variables (if the original data structure and naming is preserved, no need to change them):

   installationFile		Path to the installation file (.msi file). 
   installationFolder		Path to the preferred installation folder.
   logFile			Path to the log file (.log file).

Processing:
- executes Microsoft Windows installer command msiexec
- parameter /i contains a package which is necessary to install or configure a product
- parameter RC_BASE_FOLDER corresponds to the variable installation folder
- option /qb sets user interface level to basic
- option /LV enables logging with a verbous output


TIPS
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
To just install RealityCapture without UI interaction, remove the parameters which change the installation folder and parameters used to write out a log file from the one-line script:
   - RC_BASE_FOLDER="%installationFolder%"
   - /LV "%logFile%"
These scripts were created by Epic Games Slovakia, who doesn't carry any liability in case issues related to the sample occur.


Use this script to disable images for texturing. It works with the currently open project, and you choose
the number of disabled images.

The folder containt:

limitImagesForTexturing.bat		- the CLI script used to disable images for texturing
imageListSetting.xml			- the XML file used to export the image list file


DESCRIPTION OF THE SCRIPT
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
limitImagesForTexturing.bat


The script uses delegation and works with the currently open/active instance of RealityCapture where images were already 
aligned (it has at least one component). It is recommended to close all RealityCapture instances and leave only the one with which you want to use the script.
The whole process is based on the image list that is exported at the beginning, and this list is used to know which 
images to disable for texturing. The script counts rows in that list, and disables images based on the chosen number (you will be asked
to write and confirm a number in the Command Prompt). For example, if you choose 1 all images will be used for texturing, if you
choose 2 every second imaged will be used, if you choose 3 every third image will be used for texturing, etc.


Variables:
   
   RCexe		A path to the RealityCapture executable file.
   imageListFile	A path where the image will be saved. Currently set to the folder where the script is located.
   option		A value that determines the number of images that will be enabled for texturing. Expected interaction in the Command Prompt.
   counter		A counting value used to give information on which row in the image list to use in the script, or which image to enable for texturing.

Processing:

- disable writing out the process into Command Prompt
- enable delayed expansion to be able to change values in the FOR cycle
- create a variable with the RealityCapture executable file path
- set a variable with the path to where the image list will be saved
- disable texturing in all images
- export the image list
- set the option value to know which images to enable for texturing (user interaction)
- set the counter value to 0
- start the FOR cycle using the image list file
   - increase the counter value by 1
   - if the counter value equals the option value, enable for texturing the image mentioned in the current row in the image list
   - reset the counter value to 0
- delete the image list file



   
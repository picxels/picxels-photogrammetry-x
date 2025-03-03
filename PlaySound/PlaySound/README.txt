A simple script which will play sound once the process in RealityCapture is complete.

This is meant to be used as a Progress End notification, which can be found in the Application settings:
	Minimal process duration	Set the minimal duration of the process needed to activate the Action
	Action				To be able to play a sound with the help of the BAT file, you have to set this to Execute a program
	Command-line process		Path to the PlaySound.bat (e.g. "D:\Data\Scripts\PlaySound.bat")

DESCRIPTION OF A BATCH FILE
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PlaySound.bat 

This batch file contains:

Setting the variables (if the original data structure and naming is preserved, no need to change them):

	AudioFile	A path to the audio file, which will be used once the process in RealityCapture is complete.
	Player		The name of the execution file of the player, which will be used to open audio file.

Processing:
- run audio file
- timeout to enable audio to be played before closing player
- close player
- close command-line window
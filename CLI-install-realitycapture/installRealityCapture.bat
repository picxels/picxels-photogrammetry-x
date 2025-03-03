::CapturingReality

:: Path to the installation file.
set installationFile=D:\Software\RealityCaptureFiles\RealityCapture-1.2.0.17385-Tarasque.msi

:: Path to the folder where RealityCapture is going to be stored after the installation.
set installationFolder=D:\Software\RealityCaptureFiles\RealityCapture

:: Path and name of the log file with the extension .log.
set logFile=D:\Software\RealityCaptureFiles\installation-log.log

:: Microsoft Windows installer.
msiexec /i "%installationFile%" RC_BASE_FOLDER="%installationFolder%" /qb /LV "%logFile%"

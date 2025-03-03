::This script was created by Capturing Reality ©

:: Switch off console output.
@echo off

call SetVariables.bat

:: A path to the folder with images used for alignment
set ImagesGeometry=%RootFolder%\Images\.geometry

:: A path to the folder with images, on which markers will be detected
set ImagesTexture=%RootFolder%\Images\.texture.TextureLayer

:: A path to the metadata folder.
set Metadata=%RootFolder%\Metadata

:: a name of the first marker.
set FirstMarker="1x12:011"

:: a name of the second marker.
set SecondMarker="1x12:012"

:: a name of the third marker.
set ThirdMarker="1x12:013"

:: a name of the fourth marker.
set FourthMarker="1x12:014"

:: A name of the first distance constraint.
set FirstDistance="1.4"

:: A lenght of the first defined distance constraint.
set FirstDistanceName="distance1"

:: A name of the second distance constraint.
set SecondDistance="0.8"

:: A lenght of the second defined distance constraint.
set SecondDistanceName="distance2"

:: A path to the settings used for detect markers tool.
set DetectMarkersParams=%Metadata%\DetectMarkersParams.xml

:: Run RealityCapture.
%RealityCaptureExe% -newScene ^
        -addFolder %ImagesGeometry% ^
        -addFolder %ImagesTexture% ^
        -detectMarkers %DetectMarkersParams% ^
        -defineDistance %FirstMarker% %SecondMarker% %FirstDistance% %FirstDistanceName% ^
        -defineDistance %FirstMarker% %ThirdMarker% %SecondDistance% %SecondDistanceName% ^
        -align ^
        -selectMaximalComponent ^
		-setReconstructionRegionOnCPs %FirstMarker% %SecondMarker% %FourthMarker% "1.5" ^
        -setGroundPlaneFromReconstructionRegion ^
        -moveReconstructionRegion 0 0 1.0 ^
        -scaleReconstructionRegion 1.4 1.2 3.5 absolute center ^
		-save %RootFolder%\Project\Project_Reconstruction_region.rcproj ^
		-quit





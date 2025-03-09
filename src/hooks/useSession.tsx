
import { Session, CapturedImage, Pass } from "@/types";
import { renameSession } from "@/utils/sessionUtils";
import { useSessionCore } from "./useSessionCore";
import { usePassManagement } from "./usePassManagement";
import { useImageCapture } from "./useImageCapture";

export const useSession = () => {
  const {
    session,
    currentPassId,
    allSessions,
    analyzedImage,
    processingImages,
    isLoading,
    setSession,
    setCurrentPassId,
    setAnalyzedImage,
    handleSessionNameChange,
    handleNewSession,
    handleSessionUpdated,
    handleImageProcessing
  } = useSessionCore();

  const {
    handleNewPass,
    handleSwitchPass,
    handleCompletePass
  } = usePassManagement(session, setSession, setCurrentPassId);

  const {
    handleImageCaptured,
    handleDeleteImage
  } = useImageCapture(
    session, 
    currentPassId, 
    setSession, 
    setCurrentPassId, 
    analyzedImage, 
    setAnalyzedImage,
    handleImageProcessing
  );

  // Get the current pass from the session
  const currentPass = session?.passes.find(p => p.id === currentPassId) || null;

  return {
    session,
    currentPassId,
    currentPass,
    analyzedImage,
    processingImages,
    allSessions,
    isLoading,
    handleImageCaptured,
    handleNewPass,
    handleSwitchPass,
    handleSessionNameChange,
    handleNewSession,
    handleDeleteImage,
    handleSessionUpdated,
    handleCompletePass,
    setAnalyzedImage
  };
};

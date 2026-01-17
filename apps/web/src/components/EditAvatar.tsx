import React, { useState, useEffect, useRef } from "react";
import Cropper from "react-easy-crop";
import getCroppedImg from "../helpers";
import { createAvatar } from "@dicebear/core";
import { avataaars, bottts, pixelArt } from "@dicebear/collection";
import { toast, ToastContainer } from "react-toastify";
import styled, { keyframes, css } from "styled-components";

interface EditAvatarProps {
  open: boolean;
  onClose: () => void;
  initialImage: string | null;
  onFinish: (didChange?: boolean) => void;
  letterUser: string;
}

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div<{ width?: string; maxWidth?: string }>`
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  overflow-y: auto;
  width: ${props => props.width || '400px'};
  max-width: ${props => props.maxWidth || '90vw'};
  border: 1px solid #e5e7eb;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f3f4f6;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 4px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: #6b7280;
  transition: all 0.2s;

  &:hover {
    background: #f9fafb;
    color: #374151;
  }
`;

const ModalBody = styled.div`
  padding: 24px;
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid #f3f4f6;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  margin: 0 auto;
`;

const AvatarPreviewContainer = styled.div`
  margin-bottom: 24px;
  display: inline-block;
  padding: 4px;
  background: white;
  border-radius: 50%;
  width: 160px;
  height: 160px;
  overflow: hidden;
  border: 2px solid #e5e7eb;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
`;

const AvatarPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #f3f4f6, #e5e7eb, #d1d5db);
  font-size: 48px;
  font-weight: bold;
  color: #6b7280;
  border-radius: 50%;
`;

const UnsavedChanges = styled.div`
  margin-bottom: 16px;
  color: #f59e0b;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
`;

const ActionButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Button = styled.button<{ 
  variant?: 'primary' | 'secondary' | 'danger' | 'link';
  fullWidth?: boolean;
  disabled?: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border: 1px solid;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  width: ${props => props.fullWidth ? '100%' : 'auto'};

  ${props => {
    switch (props.variant) {
      case 'primary':
        return css`
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;

          &:hover:not(:disabled) {
            background: #2563eb;
            border-color: #2563eb;
          }
        `;
      case 'danger':
        return css`
          background: #ef4444;
          color: white;
          border-color: #ef4444;

          &:hover:not(:disabled) {
            background: #dc2626;
            border-color: #dc2626;
          }
        `;
      case 'secondary':
        return css`
          background: #f9fafb;
          color: #374151;
          border-color: #d1d5db;

          &:hover:not(:disabled) {
            background: #f3f4f6;
            border-color: #9ca3af;
          }
        `;
      case 'link':
        return css`
          background: none;
          color: #3b82f6;
          border: none;

          &:hover:not(:disabled) {
            background: #eff6ff;
          }
        `;
      default:
        return css`
          background: white;
          color: #374151;
          border-color: #d1d5db;

          &:hover:not(:disabled) {
            background: #f9fafb;
          }
        `;
    }
  }}

  ${props => props.disabled && css`
    opacity: 0.5;
    cursor: not-allowed;
  `}
`;

const SelectionOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 0;
`;

const OptionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 16px;
  text-align: left;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
  }
`;

const OptionContent = styled.div`
  flex: 1;
`;

const OptionTitle = styled.div`
  font-weight: 500;
  color: #111827;
  margin-bottom: 2px;
`;

const OptionDescription = styled.div`
  font-size: 12px;
  color: #6b7280;
`;

const CameraContainer = styled.div`
  width: 100%;
  max-width: 320px;
  aspect-ratio: 1 / 1;
  border: 2px solid #3b82f6;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 auto 20px;
  background-color: #000;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const CameraVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
`;

const CropContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 350px;
  aspect-ratio: 1 / 1;
  margin: 0 auto;
  border-radius: 16px;
  overflow: hidden;
  background: #f9fafb;
`;

const ZoomSliderContainer = styled.div`
  margin: 32px 0;
`;

const Slider = styled.input`
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e5e7eb;
  outline: none;
  -webkit-appearance: none;

  &::-webkit-slider-thumb {
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }

  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }
`;

const CropActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
`;

const AvatarTypeSelector = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const AvatarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  padding: 8px;
`;

const AvatarOption = styled.img`
  width: 100%;
  aspect-ratio: 1 / 1;
  cursor: pointer;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
  transition: all 0.2s;

  &:hover {
    border-color: #3b82f6;
    transform: scale(1.05);
  }
`;

const EditAvatar: React.FC<EditAvatarProps> = ({
  open,
  onClose,
  initialImage,
  onFinish,
  letterUser
}) => {
  const [originalImage, setOriginalImage] = useState<string | null>(initialImage);
  const [temporaryImage, setTemporaryImage] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [modalState, setModalState] = useState<{
    mainModal: boolean;
    selectionModal: boolean;
    cameraModal: boolean;
    avatarModal: boolean;
    cropModal: boolean;
  }>({
    mainModal: false,
    selectionModal: false,
    cameraModal: false,
    avatarModal: false,
    cropModal: false,
  });

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [avatarType, setAvatarType] = useState<"avataaars" | "pixel-art" | "bottts">("avataaars");
  const [avatarOptions, setAvatarOptions] = useState<string[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const displayImage = pendingDelete ? null : (temporaryImage || originalImage);

  useEffect(() => {
    const hasChanges = temporaryImage !== null || pendingDelete;
    setHasUnsavedChanges(hasChanges);
  }, [temporaryImage, pendingDelete]);

  useEffect(() => {
    setOriginalImage(initialImage);
    setTemporaryImage(null);
    setPendingDelete(false);
    setHasUnsavedChanges(false);
  }, [initialImage]);

  useEffect(() => {
    if (open) {
      handleModal('mainModal', true);
    } else {
      closeAllModals();
    }
  }, [open]);

  const handleModal = (modalName: keyof typeof modalState, isOpen: boolean) => {
    setModalState(prev => ({
      ...prev,
      [modalName]: isOpen
    }));
  };

  const closeAllModals = () => {
    setModalState({
      mainModal: false,
      selectionModal: false,
      cameraModal: false,
      avatarModal: false,
      cropModal: false,
    });
    setCapturedImage(null);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleCloseComplete = () => {
    setTemporaryImage(null);
    setPendingDelete(false);
    setHasUnsavedChanges(false);
    closeAllModals();
    onClose();
  };

  const handleFinish = async () => {
    if (!hasUnsavedChanges) {
      closeAllModals();
      onClose();
      return;
    }

    try {
      setLoading(true);

      if (pendingDelete) {
        const res = await fetch("/api/profile/avatar", { method: "DELETE" });
        if (!res.ok) throw new Error("Delete failed");
        toast.success("Avatar removed successfully.");
      } else if (temporaryImage) {
        if (!temporaryImage.startsWith('data:image/')) {
          throw new Error("Invalid image data");
        }
        
        const blob = dataUrlToBlob(temporaryImage);
        await uploadBlobToApi(blob);
        toast.success("Avatar updated successfully.");
      }

      closeAllModals();
      onFinish(true);

    } catch (error) {
      console.error(error);
      toast.error("Failed to save changes.");
    } finally {
      setLoading(false);
    }
  };

  const handleTemporaryDelete = () => {
    setPendingDelete(true);
    setTemporaryImage(null);
  };

  const generateRandomAvatar = (
    type: "avataaars" | "pixel-art" | "bottts",
    seed?: string
  ) => {
    const options = {
      seed: seed || Math.random().toString(36).substring(2),
      size: 256,
    };
    switch (type) {
      case "avataaars":
        return createAvatar(avataaars, options).toDataUri();
      case "pixel-art":
        return createAvatar(pixelArt, options).toDataUri();
      case "bottts":
        return createAvatar(bottts, options).toDataUri();
      default:
        return createAvatar(avataaars, options).toDataUri();
    }
  };

  useEffect(() => {
    let isMounted = true;

    const startCamera = async () => {
      try {
        if (!isMounted) return;

        setCameraReady(false);

        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 1280 }
          }
        });

        if (!isMounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraReady(true);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Camera error:", error);
          toast.error("Unable to access camera. Please check permissions.");
          handleModal('cameraModal', false);
        }
      }
    };

    if (modalState.cameraModal) {
      startCamera();
    }

    return () => {
      isMounted = false;
      if (!modalState.cameraModal && streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        if (videoRef.current) videoRef.current.srcObject = null;
      }
    };
  }, [modalState.cameraModal]);

  const openFilePicker = () => {
    fileInputRef.current?.click();
    handleModal('selectionModal', false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !streamRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      toast.error("Failed to capture photo.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setCapturedImage(dataUrl);

      handleModal('cameraModal', false);
      handleModal('cropModal', true);

    } catch (error) {
      console.error("Error capturing photo:", error);
      toast.error("Failed to capture photo.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCapturedImage(result);
      handleModal('cropModal', true);
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = (_: any, pixels: any) => setCroppedAreaPixels(pixels);

  function dataUrlToBlob(dataUrl: string) {
    const [meta, content] = dataUrl.split(",");
    const isBase64 = /;base64$/.test(meta);
    const mime = meta.match(/data:(.*?);/)?.[1] || "image/jpeg";
    const raw = isBase64 ? atob(content) : decodeURIComponent(content);
    const arr = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  async function uploadBlobToApi(blob: Blob) {
    const res = await fetch("/api/profile/avatar", {
      method: "PUT",
      headers: { "Content-Type": blob.type },
      body: blob,
    });
    if (!res.ok) throw new Error("Upload failed");
  }

  const saveTemporaryImage = async () => {
    if (!capturedImage || !croppedAreaPixels) return;
    try {
      setLoading(true);
      const croppedDataUrl = await getCroppedImg(capturedImage, croppedAreaPixels);

      if (!croppedDataUrl || !croppedDataUrl.startsWith('data:image/')) {
        throw new Error("Failed to create valid cropped image");
      }

      setTemporaryImage(croppedDataUrl);
      setPendingDelete(false);
      setTimeout(() => {
        setCapturedImage(null);
        setCroppedAreaPixels(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        handleModal('cropModal', false);
        setLoading(false);
      }, 100);

    } catch (error) {
      console.error('Error in saveTemporaryImage:', error);
      toast.error("Failed to process image. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (modalState.avatarModal) {
      const newAvatars = Array.from({ length: 12 }, () =>
        generateRandomAvatar(avatarType)
      );
      setAvatarOptions(newAvatars);
    }
  }, [modalState.avatarModal, avatarType]);

  const Icons = {
    Upload: () => (
      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
    Delete: () => (
      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
    Camera: () => (
      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    Check: () => (
      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    Close: () => (
      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    Smile: () => (
      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    Sync: () => (
      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  };

  return (
    <>
      {modalState.mainModal && (
        <ModalOverlay>
          <ModalContent width="400px">
            <ModalHeader>
              <ModalTitle>Update Profile Photo</ModalTitle>
              <CloseButton onClick={handleCloseComplete}>×</CloseButton>
            </ModalHeader>
            
            <ModalBody>
              {loading ? (
                <div style={{ height: 320, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Spinner />
                </div>
              ) : (
                <div style={{ textAlign: "center" }}>
                  <AvatarPreviewContainer>
                    {displayImage ? (
                      <AvatarImage src={displayImage} alt="Avatar preview" />
                    ) : (
                      <AvatarPlaceholder>
                        {letterUser}
                      </AvatarPlaceholder>
                    )}
                  </AvatarPreviewContainer>

                  {hasUnsavedChanges && (
                    <UnsavedChanges>
                      {pendingDelete
                        ? "Avatar marked for deletion"
                        : "You have unsaved changes"}
                    </UnsavedChanges>
                  )}

                  <ActionButtons>
                    <Button
                      variant="secondary"
                      fullWidth
                      onClick={() => handleModal('selectionModal', true)}
                    >
                      <Icons.Sync /> Change Photo
                    </Button>
                    <Button
                      variant="danger"
                      fullWidth
                      onClick={handleTemporaryDelete}
                      disabled={pendingDelete || !originalImage}
                    >
                      <Icons.Delete /> Delete Avatar
                    </Button>
                    <Button
                      variant={hasUnsavedChanges ? 'primary' : 'link'}
                      fullWidth
                      onClick={handleFinish}
                      disabled={loading}
                    >
                      {hasUnsavedChanges ? "Save Changes" : "Cancel"}
                    </Button>
                  </ActionButtons>
                </div>
              )}
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}

      <input
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      {modalState.selectionModal && (
        <ModalOverlay>
          <ModalContent width="400px">
            <ModalHeader>
              <ModalTitle>Select an option</ModalTitle>
              <CloseButton onClick={() => handleModal('selectionModal', false)}>×</CloseButton>
            </ModalHeader>
            <ModalBody className="py-20">
              <SelectionOptions>
                <OptionButton onClick={openFilePicker}>
                  <Icons.Upload />
                  <OptionContent>
                    <OptionTitle>Choose a file</OptionTitle>
                    <OptionDescription>Upload from your device</OptionDescription>
                  </OptionContent>
                </OptionButton>
                <OptionButton
                  onClick={() => {
                    handleModal('selectionModal', false);
                    handleModal('cameraModal', true);
                  }}
                >
                  <Icons.Camera />
                  <OptionContent>
                    <OptionTitle>Take a photo</OptionTitle>
                    <OptionDescription>Use your camera</OptionDescription>
                  </OptionContent>
                </OptionButton>
                <OptionButton
                  onClick={() => {
                    handleModal('selectionModal', false);
                    handleModal('avatarModal', true);
                  }}
                >
                  <Icons.Smile />
                  <OptionContent>
                    <OptionTitle>Choose an avatar</OptionTitle>
                    <OptionDescription>Select from templates</OptionDescription>
                  </OptionContent>
                </OptionButton>
              </SelectionOptions>
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}

      {modalState.cameraModal && (
        <ModalOverlay>
          <ModalContent width="400px">
            <ModalHeader>
              <ModalTitle>Take a photo</ModalTitle>
              <CloseButton onClick={() => handleModal('cameraModal', false)}>×</CloseButton>
            </ModalHeader>
            <ModalBody>
              <CameraContainer>
                <CameraVideo
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  onCanPlay={() => setCameraReady(true)}
                  onError={() => {
                    toast.error("Failed to load camera.");
                    setCameraReady(false);
                  }}
                />
              </CameraContainer>

              <Button
                variant="primary"
                fullWidth
                onClick={capturePhoto}
                disabled={!cameraReady}
              >
                <Icons.Camera />
                {cameraReady ? "Capture Photo" : "Loading Camera..."}
              </Button>
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}

      {modalState.cropModal && (
        <ModalOverlay>
          <ModalContent width="400px">
            <ModalHeader>
              <ModalTitle>Edit photo</ModalTitle>
              <CloseButton onClick={() => {
                handleModal('cropModal', false);
                setCapturedImage(null);
              }}>×</CloseButton>
            </ModalHeader>
            <ModalBody>
              {loading ? (
                <div style={{ height: 350, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Spinner />
                </div>
              ) : (
                <>
                  <CropContainer>
                    <Cropper
                      image={capturedImage!}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      cropShape="round"
                      showGrid={false}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                    />
                  </CropContainer>
                  <ZoomSliderContainer>
                    <Slider
                      type="range"
                      min={1}
                      max={3}
                      step={0.1}
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                    />
                  </ZoomSliderContainer>
                  <CropActions>
                    <Button variant="primary" onClick={saveTemporaryImage}>
                      <Icons.Check /> Use Photo
                    </Button>
                    <Button variant="secondary" onClick={() => {
                      handleModal('cropModal', false);
                      setCapturedImage(null);
                    }}>
                      <Icons.Close /> Cancel
                    </Button>
                  </CropActions>
                </>
              )}
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}

      {modalState.avatarModal && (
        <ModalOverlay>
          <ModalContent width="80%" maxWidth="800px">
            <ModalHeader>
              <ModalTitle>Choose avatar</ModalTitle>
              <CloseButton onClick={() => handleModal('avatarModal', false)}>×</CloseButton>
            </ModalHeader>
            <ModalBody>
              <AvatarTypeSelector>
                <Button 
                  variant={avatarType === "avataaars" ? "primary" : "secondary"}
                  onClick={() => setAvatarType("avataaars")}
                >
                  Cartoon
                </Button>
                <Button 
                  variant={avatarType === "pixel-art" ? "primary" : "secondary"}
                  onClick={() => setAvatarType("pixel-art")}
                >
                  Pixel
                </Button>
                <Button 
                  variant={avatarType === "bottts" ? "primary" : "secondary"}
                  onClick={() => setAvatarType("bottts")}
                >
                  Robot
                </Button>
              </AvatarTypeSelector>

              <AvatarGrid>
                {avatarOptions.map((avatar, index) => (
                  <AvatarOption
                    key={index}
                    src={avatar}
                    alt={`Avatar ${index}`}
                    onClick={() => {
                      setCapturedImage(avatar);
                      handleModal('avatarModal', false);
                      handleModal('cropModal', true);
                    }}
                  />
                ))}
              </AvatarGrid>
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}

      <ToastContainer position="bottom-right" autoClose={1700} style={{ zIndex: 9999 }} />
    </>
  );
};

export default EditAvatar;
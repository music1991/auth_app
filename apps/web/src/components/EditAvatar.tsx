import React from "react";
import Cropper from "react-easy-crop";
import { ToastContainer } from "react-toastify";
import styled, { keyframes, css } from "styled-components";

// --- IMPORTS DE TUS NUEVOS ARCHIVOS ---
import { useEditAvatar } from "../hooks/useEditAvatar";
import { Icons } from "@/lib/EditAvatarIcons";


interface EditAvatarProps {
  open: boolean;
  onClose: () => void;
  initialImage: string | null;
  onFinish: (didChange?: boolean) => void;
  letterUser: string;
}

// --- ESTILOS (Se mantienen idénticos a tu original) ---
const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5); display: flex;
  justify-content: center; align-items: center; z-index: 1000;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div<{ $width?: string; $maxWidth?: string }>`
  background: white; border-radius: 16px; width: ${props => props.$width || '400px'};
  max-width: ${props => props.$maxWidth || '90vw'}; max-height: 90vh; overflow-y: auto;
`;

const ModalHeader = styled.div` display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #f3f4f6; `;
const ModalTitle = styled.h3` margin: 0; font-size: 18px; font-weight: 600; color: #111827; `;
const CloseButton = styled.button` background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280; `;
const ModalBody = styled.div` padding: 24px; `;

const spin = keyframes` 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } `;
const Spinner = styled.div` width: 40px; height: 40px; border: 3px solid #f3f4f6; border-top: 3px solid #3b82f6; border-radius: 50%; animation: ${spin} 1s linear infinite; margin: 0 auto; `;

const AvatarPreviewContainer = styled.div` margin-bottom: 24px; width: 160px; height: 160px; border-radius: 50%; overflow: hidden; border: 2px solid #e5e7eb; margin-left: auto; margin-right: auto; `;
const AvatarImage = styled.img` width: 100%; height: 100%; object-fit: cover; `;
const AvatarPlaceholder = styled.div` width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; background: #f3f4f6; font-size: 48px; color: #6b7280; `;
const UnsavedChanges = styled.div` margin-bottom: 16px; color: #f59e0b; font-size: 14px; font-weight: 500; text-align: center; `;

const ActionButtons = styled.div` display: flex; flex-direction: column; gap: 12px; `;
const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' | 'link'; $fullWidth?: boolean; }>`
  display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 16px; border-radius: 8px; cursor: pointer; width: ${props => props.$fullWidth ? '100%' : 'auto'};
  ${props => props.variant === 'primary' && css` background: #3b82f6; color: white; border: none; `}
  ${props => props.variant === 'danger' && css` background: #ef4444; color: white; border: none; `}
  ${props => props.variant === 'secondary' && css` background: white; color: #374151; border: 1px solid #d1d5db; `}
  ${props => props.variant === 'link' && css` background: none; color: #3b82f6; border: none; `}
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const SelectionOptions = styled.div` display: flex; flex-direction: column; gap: 12px; `;
const OptionButton = styled.button` display: flex; align-items: center; gap: 12px; width: 100%; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; cursor: pointer; `;
const OptionContent = styled.div` flex: 1; `;
const OptionTitle = styled.div` font-weight: 500; color: #111827; `;
const OptionDescription = styled.div` font-size: 12px; color: #6b7280; `;

const CameraContainer = styled.div` width: 100%; max-width: 320px; aspect-ratio: 1; border-radius: 50%; overflow: hidden; margin: 0 auto 20px; background: #000; `;
const CameraVideo = styled.video` width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); `;

const CropContainer = styled.div` position: relative; width: 100%; aspect-ratio: 1; border-radius: 16px; overflow: hidden; `;
const ZoomSliderContainer = styled.div` margin: 24px 0; `;
const Slider = styled.input` width: 100%; `;
const CropActions = styled.div` display: flex; gap: 12px; justify-content: center; `;

const AvatarTypeSelector = styled.div` display: flex; gap: 8px; margin-bottom: 20px; `;
const AvatarGrid = styled.div` display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 12px; max-height: 400px; overflow-y: auto; `;
const AvatarOption = styled.img` width: 100%; aspect-ratio: 1; cursor: pointer; border-radius: 8px; border: 2px solid #e5e7eb; `;

const EditAvatar: React.FC<EditAvatarProps> = ({ open, onClose, initialImage, onFinish, letterUser }) => {
  
  // --- CONSUMO DEL HOOK ---
  const { state, actions, handlers, refs } = useEditAvatar(initialImage, onFinish, onClose, open);

  // Extraemos variables del estado para usarlas en el JSX
  const { 
    modalState, loading, temporaryImage, originalImage, 
    pendingDelete, capturedImage, zoom, crop, 
    avatarType, avatarOptions, cameraReady 
  } = state;

  // Lógica de visualización derivada
  const displayImage = pendingDelete ? null : (temporaryImage || originalImage);
  const hasUnsavedChanges = temporaryImage !== null || pendingDelete;

  if (!open) return null;

  return (
    <>
      {/* 1. MODAL PRINCIPAL */}
      {modalState.mainModal && (
        <ModalOverlay>
          <ModalContent $width="400px">
            <ModalHeader>
              <ModalTitle>Update Profile Photo</ModalTitle>
              <CloseButton onClick={actions.handleCloseComplete}>×</CloseButton>
            </ModalHeader>
            <ModalBody>
              {loading ? (
                <div style={{ height: 320, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Spinner /></div>
              ) : (
                <div style={{ textAlign: "center" }}>
                  <AvatarPreviewContainer>
                    {displayImage ? <AvatarImage src={displayImage} /> : <AvatarPlaceholder>{letterUser}</AvatarPlaceholder>}
                  </AvatarPreviewContainer>

                  {hasUnsavedChanges && (
                    <UnsavedChanges>
                      {pendingDelete ? "Avatar marked for deletion" : "You have unsaved changes"}
                    </UnsavedChanges>
                  )}

                  <ActionButtons>
                    <Button variant="secondary" $fullWidth onClick={() => actions.handleModal('selectionModal', true)}>
                      <Icons.Sync /> Change Photo
                    </Button>
                    <Button variant="danger" $fullWidth onClick={actions.handleTemporaryDelete} disabled={pendingDelete || !originalImage}>
                      <Icons.Delete /> Delete Avatar
                    </Button>
                    <Button variant={hasUnsavedChanges ? 'primary' : 'link'} $fullWidth onClick={actions.handleFinish} disabled={loading}>
                      {hasUnsavedChanges ? "Save Changes" : "Cancel"}
                    </Button>
                  </ActionButtons>
                </div>
              )}
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* INPUT OCULTO */}
      <input type="file" accept="image/*" style={{ display: "none" }} ref={refs.fileInputRef} onChange={handlers.handleFileChange} />

      {/* 2. MODAL SELECCIÓN */}
      {modalState.selectionModal && (
        <ModalOverlay>
          <ModalContent $width="400px">
            <ModalHeader>
              <ModalTitle>Select an option</ModalTitle>
              <CloseButton onClick={() => actions.handleModal('selectionModal', false)}>×</CloseButton>
            </ModalHeader>
            <ModalBody>
              <SelectionOptions>
                <OptionButton onClick={handlers.openFilePicker}>
                    <Icons.Upload />
                    <OptionContent><OptionTitle>Choose a file</OptionTitle><OptionDescription>Upload from your device</OptionDescription></OptionContent>
                </OptionButton>
                <OptionButton onClick={() => { actions.handleModal('selectionModal', false); actions.handleModal('cameraModal', true); }}>
                    <Icons.Camera />
                    <OptionContent><OptionTitle>Take a photo</OptionTitle><OptionDescription>Use your camera</OptionDescription></OptionContent>
                </OptionButton>
                <OptionButton onClick={() => { actions.handleModal('selectionModal', false); actions.handleModal('avatarModal', true); }}>
                    <Icons.Smile />
                    <OptionContent><OptionTitle>Choose an avatar</OptionTitle><OptionDescription>Select from templates</OptionDescription></OptionContent>
                </OptionButton>
              </SelectionOptions>
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* 3. MODAL CÁMARA */}
      {modalState.cameraModal && (
        <ModalOverlay>
          <ModalContent $width="400px">
            <ModalHeader><ModalTitle>Take a photo</ModalTitle><CloseButton onClick={() => actions.handleModal('cameraModal', false)}>×</CloseButton></ModalHeader>
            <ModalBody>
              <CameraContainer><CameraVideo ref={refs.videoRef} autoPlay muted playsInline onCanPlay={() => actions.setCameraReady(true)} /></CameraContainer>
              <Button variant="primary" $fullWidth onClick={handlers.capturePhoto} disabled={!cameraReady}>
                <Icons.Camera /> {cameraReady ? "Capture Photo" : "Loading Camera..."}
              </Button>
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* 4. MODAL RECORTE (CROP) */}
      {modalState.cropModal && (
        <ModalOverlay>
          <ModalContent $width="400px">
            <ModalHeader><ModalTitle>Edit photo</ModalTitle><CloseButton onClick={() => actions.handleModal('cropModal', false)}>×</CloseButton></ModalHeader>
            <ModalBody>
              <CropContainer>
                <Cropper image={capturedImage!} crop={crop} zoom={zoom} aspect={1} cropShape="round" showGrid={false} onCropChange={actions.setCrop} onZoomChange={actions.setZoom} onCropComplete={handlers.onCropComplete} />
              </CropContainer>
              <ZoomSliderContainer>
                <Slider type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => actions.setZoom(parseFloat(e.target.value))} />
              </ZoomSliderContainer>
              <CropActions>
                <Button variant="primary" onClick={handlers.saveTemporaryImage}><Icons.Check /> Use Photo</Button>
                <Button variant="secondary" onClick={() => { actions.handleModal('cropModal', false); actions.setCapturedImage(null); }}><Icons.Close /> Cancel</Button>
              </CropActions>
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* 5. MODAL AVATARES */}
      {modalState.avatarModal && (
        <ModalOverlay>
          <ModalContent $width="80%" $maxWidth="800px">
            <ModalHeader><ModalTitle>Choose avatar</ModalTitle><CloseButton onClick={() => actions.handleModal('avatarModal', false)}>×</CloseButton></ModalHeader>
            <ModalBody>
              <AvatarTypeSelector>
                <Button variant={avatarType === "avataaars" ? "primary" : "secondary"} onClick={() => actions.setAvatarType("avataaars")}>Cartoon</Button>
                <Button variant={avatarType === "pixel-art" ? "primary" : "secondary"} onClick={() => actions.setAvatarType("pixel-art")}>Pixel</Button>
                <Button variant={avatarType === "bottts" ? "primary" : "secondary"} onClick={() => actions.setAvatarType("bottts")}>Robot</Button>
              </AvatarTypeSelector>
              <AvatarGrid>
                {avatarOptions.map((avatar, index) => (
                  <AvatarOption key={index} src={avatar} onClick={() => { actions.setCapturedImage(avatar); actions.handleModal('avatarModal', false); actions.handleModal('cropModal', true); }} />
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

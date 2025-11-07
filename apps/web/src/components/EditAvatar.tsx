import React, { useState, useEffect, useRef } from "react";
import { Button, Spin, Avatar, Modal, Space, Slider, Grid } from "antd";
import {
  UploadOutlined,
  DeleteOutlined,
  UserOutlined,
  CameraOutlined,
  CheckOutlined,
  CloseOutlined,
  SmileOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import Cropper from "react-easy-crop";
import getCroppedImg from "../helpers";
import { createAvatar } from "@dicebear/core";
import { avataaars, bottts, pixelArt } from "@dicebear/collection";
import { toast, ToastContainer } from "react-toastify";

interface EditAvatarProps {
  open: boolean;
  onClose: () => void;
  initialImage: string | null;
  onFinish: (didChange?: boolean) => void;
  letterUser: string;
}

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
  const [imageKey, setImageKey] = useState(0); // ← AGREGAR ESTE ESTADO

  // Estado centralizado para modales internos
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { useBreakpoint } = Grid;
  const screens = useBreakpoint();

  // Imagen que se muestra en el preview
  const displayImage = pendingDelete ? null : (temporaryImage || originalImage);

  // Hay cambios no guardados si hay imagen temporal o borrado pendiente
  useEffect(() => {
    const hasChanges = temporaryImage !== null || pendingDelete;
    setHasUnsavedChanges(hasChanges);
  }, [temporaryImage, pendingDelete]);

  // Sincronizar cuando cambia initialImage
  useEffect(() => {
    setOriginalImage(initialImage);
    setTemporaryImage(null);
    setPendingDelete(false);
    setHasUnsavedChanges(false);
    setImageKey(prev => prev + 1); // ← FORZAR ACTUALIZACIÓN AL CAMBIAR INITIAL IMAGE
  }, [initialImage]);

  useEffect(() => {
    if (open) {
      handleModal('mainModal', true);
    } else {
      closeAllModals();
    }
  }, [open]);

  // Manejo centralizado de modales
  const handleModal = (modalName: keyof typeof modalState, isOpen: boolean) => {
    setModalState(prev => ({
      ...prev,
      [modalName]: isOpen
    }));
  };

  // Función para cerrar todos los modales
  const closeAllModals = () => {
    setModalState({
      mainModal: false,
      selectionModal: false,
      cameraModal: false,
      avatarModal: false,
      cropModal: false,
    });
    setCapturedImage(null);

    // Detener cámara si está activa
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Función para cerrar con la X - DESCARTAR CAMBIOS
  const handleCloseComplete = () => {
    setTemporaryImage(null);
    setPendingDelete(false);
    setHasUnsavedChanges(false);
    closeAllModals();
    onClose();
  };

  // Función para FINISH - GUARDAR CAMBIOS PERMANENTEMENTE
  const handleFinish = async () => {
    if (!hasUnsavedChanges) {
      closeAllModals();
      onClose();
      return;
    }

    try {
      setLoading(true);
      
      if (pendingDelete) {
        // Borrar permanentemente del servidor
        const res = await fetch("/api/profile/avatar", { method: "DELETE" });
        if (!res.ok) throw new Error("Delete failed");
        toast.success("Avatar removed successfully.");
      } else if (temporaryImage) {
        // Subir la nueva imagen al servidor
        const blob = dataUrlToBlob(temporaryImage);
        await uploadBlobToApi(blob);
        toast.success("Avatar updated successfully.");
      }
      
      closeAllModals();
      onFinish(true); // Notificar al padre que hubo cambios
      
    } catch (error) {
      console.error(error);
      toast.error("Failed to save changes.");
    } finally {
      setLoading(false);
    }
  };

  // DELETE TEMPORAL - Solo marca para borrar, no ejecuta permanentemente
  const handleTemporaryDelete = () => {
    setPendingDelete(true);
    setTemporaryImage(null);
    setImageKey(prev => prev + 1); // ← FORZAR ACTUALIZACIÓN AL BORRAR
  };

  // Helpers
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

  // Cámara - Versión mejorada
  useEffect(() => {
    let isMounted = true;

    const startCamera = async () => {
      try {
        if (!isMounted) return;

        setCameraReady(false);
        
        // Detener stream anterior si existe
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

  // CAPTURE PHOTO - Versión corregida
  const capturePhoto = () => {
    if (!videoRef.current || !streamRef.current) return;
    
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    
    if (!ctx) {
      toast.error("Failed to capture photo.");
      return;
    }

    // Usar dimensiones reales del video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Dibujar el frame actual
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // Convertir a data URL
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setCapturedImage(dataUrl);
      
      // Cerrar cámara y abrir editor
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
    const mime = meta.match(/data:(.*?);/)?.[1] || "image/png";
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

  // GUARDAR TEMPORALMENTE (sin enviar al servidor)
  const saveTemporaryImage = async () => {
    if (!capturedImage || !croppedAreaPixels) return;
    try {
      setLoading(true);
      const croppedDataUrl = await getCroppedImg(capturedImage, croppedAreaPixels);
      
      // Guardar temporalmente y resetear borrado pendiente
      setTemporaryImage(croppedDataUrl);
      setPendingDelete(false);
      setImageKey(prev => prev + 1); // ← FORZAR ACTUALIZACIÓN AL GUARDAR
      
      setCapturedImage(null);
      handleModal('cropModal', false);
    } catch (e) {
      console.error(e);
      toast.error("Failed to process photo.");
    } finally {
      setLoading(false);
    }
  };

  // Generar avatares cuando se abre el modal
  useEffect(() => {
    if (modalState.avatarModal) {
      const newAvatars = Array.from({ length: 12 }, () =>
        generateRandomAvatar(avatarType)
      );
      setAvatarOptions(newAvatars);
    }
  }, [modalState.avatarModal, avatarType]);

  return (
    <>
      {/* Modal Principal */}
      <Modal
  open={modalState.mainModal}
  onCancel={handleCloseComplete}
  footer={null}
  title="Update Profile Photo"
  className="modal-selection"
  centered
  mask={true}
  width={400}
>
  {loading ? (
    <div style={{ height: 320, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Spin size="large" />
    </div>
  ) : (
    <div style={{ textAlign: "center" }}>
      {/* REEMPLAZO COMPLETO DEL AVATAR */}
      <div
        style={{
          marginBottom: 20,
          display: "inline-block",
          padding: 3,
          backgroundColor: "#fff",
          borderRadius: "50%",
          border: "4px solid #ADD8E6",
          width: 160,
          height: 160,
          overflow: "hidden",
        }}
      >
        {displayImage ? (
          <img
            key={`avatar-img-${imageKey}`}
            src={displayImage}
            alt="Profile preview"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block"
            }}
          />
        ) : (
          <div 
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              background: "linear-gradient(45deg,#d3d3d3,#eaeaea,#cfcfcf)",
              fontSize: 50,
              fontWeight: "bold",
              color: "#666",
            }}
          >
            {letterUser}
          </div>
        )}
      </div>

      {hasUnsavedChanges && (
        <div style={{ marginBottom: 10, color: '#ff9800', fontSize: '14px' }}>
          {pendingDelete 
            ? "Avatar marked for deletion" 
            : "You have unsaved changes"}
        </div>
      )}

      <div>
        <div style={{ marginBottom: 10 }} className="flex flex-col gap-5">
          <Button
            icon={<SyncOutlined />}
            style={{ marginRight: 8 }}
            onClick={() => handleModal('selectionModal', true)}
          >
            Change
          </Button>
          <Button 
            danger 
            icon={<DeleteOutlined />} 
            onClick={handleTemporaryDelete}
            disabled={pendingDelete || !originalImage}
          >
            {"Delete"}
          </Button>
          <Button 
            type={hasUnsavedChanges ? "primary" : "link"}
            onClick={handleFinish}
            disabled={loading}
          >
            {hasUnsavedChanges ? "Save" : "Cancel"}
          </Button>
        </div>
      </div>
    </div>
  )}
</Modal>

      <input
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      {/* Modal de selección */}
      <Modal
        open={modalState.selectionModal}
        onCancel={() => handleModal('selectionModal', false)}
        footer={null}
        title="Select an option"
        className="modal-selection"
        centered
      >
        <div className="flex flex-col gap-3 items-center justify-center p-5">
          <Button
            block
            icon={<UploadOutlined />}
            onClick={openFilePicker}
          >
            Choose a file
          </Button>
          <Button
            block
            icon={<CameraOutlined />}
            onClick={() => {
              handleModal('selectionModal', false);
              handleModal('cameraModal', true);
            }}
          >
            Take a photo
          </Button>
          <Button
            block
            icon={<SmileOutlined />}
            onClick={() => {
              handleModal('selectionModal', false);
              handleModal('avatarModal', true);
            }}
          >
            Choose an avatar
          </Button>
        </div>
      </Modal>

      {/* Modal de cámara - Mejorado */}
      <Modal
        open={modalState.cameraModal}
        onCancel={() => handleModal('cameraModal', false)}
        footer={null}
        title="Take a photo"
        className="modal-photo"
        centered
      >
        <div
          style={{
            width: "100%",
            maxWidth: 320,
            aspectRatio: "1 / 1",
            border: "2px solid #1890ff",
            borderRadius: "50%",
            overflow: "hidden",
            margin: "0 auto",
            backgroundColor: "#000",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{ 
              width: "100%", 
              height: "100%", 
              objectFit: "cover",
              transform: "scaleX(-1)" // Espejo para selfie
            }}
            onCanPlay={() => setCameraReady(true)}
            onError={() => {
              toast.error("Failed to load camera.");
              setCameraReady(false);
            }}
          />
        </div>
        
        <Button
          icon={<CameraOutlined />}
          onClick={capturePhoto}
          style={{ marginTop: 12, width: "100%" }}
          disabled={!cameraReady}
          type="primary"
        >
          {cameraReady ? "Capture Photo" : "Loading Camera..."}
        </Button>
      </Modal>

      {/* Modal de recorte */}
      <Modal
        open={modalState.cropModal}
        onCancel={() => {
          handleModal('cropModal', false);
          setCapturedImage(null);
        }}
        footer={null}
        title="Edit photo"
        className="edit-photo"
        centered
        width={400}
        style={{
          minHeight: 500,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}
      >
        {loading ? (
          <div style={{ height: 350, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            <div
              style={{
                position: "relative",
                width: "100%",
                maxWidth: 350,
                aspectRatio: "1 / 1",
                margin: "0 auto",
                borderRadius: "16px",
                overflow: "hidden",
              }}
            >
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
            </div>
            <Slider
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={setZoom}
              style={{ marginTop: 40, marginBottom: 40 }}
            />
            <Space style={{ width: "100%", justifyContent: "center" }}>
              <Button type="primary" icon={<CheckOutlined />} onClick={saveTemporaryImage}>
                Use photo
              </Button>
              <Button icon={<CloseOutlined />} onClick={() => {
                handleModal('cropModal', false);
                setCapturedImage(null);
              }}>
                Cancel
              </Button>
            </Space>
          </>
        )}
      </Modal>

      {/* Modal de avatares */}
      <Modal
        open={modalState.avatarModal}
        onCancel={() => handleModal('avatarModal', false)}
        footer={null}
        title="Choose avatar"
        width="80%"
        centered
      >
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            gap: 8,
            flexDirection: screens.xs ? "column" : "row",
          }}
        >
          <Button onClick={() => setAvatarType("avataaars")}>Cartoon</Button>
          <Button onClick={() => setAvatarType("pixel-art")}>Pixel</Button>
          <Button onClick={() => setAvatarType("bottts")}>Robot</Button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: 16,
            maxHeight: "60vh",
            overflowY: "auto",
          }}
        >
          {avatarOptions.map((avatar, index) => (
            <img
              key={index}
              src={avatar}
              alt={`Avatar ${index}`}
              onClick={() => {
                setCapturedImage(avatar);
                handleModal('avatarModal', false);
                handleModal('cropModal', true);
              }}
              style={{
                width: "100%",
                cursor: "pointer",
                borderRadius: 8,
                border: "2px solid #e0e0e0",
              }}
            />
          ))}
        </div>
      </Modal>

      <ToastContainer position="bottom-right" autoClose={1700} style={{ zIndex: 9999 }} />
    </>
  );
};

export default EditAvatar;
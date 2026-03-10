import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { createAvatar } from "@dicebear/core";
import { avataaars, bottts, pixelArt } from "@dicebear/collection";
import getCroppedImg from "../helpers"; // Tu helper de recorte
import { dataUrlToBlob } from "../helpers/imageHelpers";

export function useEditAvatar(
  initialImage: string | null, 
  onFinish: (change: boolean) => void, 
  onClose: () => void, 
  open: boolean
) {
  // --- 1. ESTADOS ---
  const [originalImage, setOriginalImage] = useState(initialImage);
  const [temporaryImage, setTemporaryImage] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [avatarType, setAvatarType] = useState<"avataaars" | "pixel-art" | "bottts">("avataaars");
  const [avatarOptions, setAvatarOptions] = useState<string[]>([]);
  const [modalState, setModalState] = useState({
    mainModal: false, selectionModal: false, cameraModal: false, avatarModal: false, cropModal: false
  });

  // --- 2. REFS ---
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // --- 3. EFECTOS ---
  
  // Control de apertura del modal principal
  useEffect(() => {
    if (open) handleModal('mainModal', true);
  }, [open]);

  // Sincronización de imagen inicial
  useEffect(() => {
    setOriginalImage(initialImage);
    setTemporaryImage(null);
    setPendingDelete(false);
  }, [initialImage]);

  // LOGICA DE GENERACIÓN DE AVATARES (DiceBear)
  useEffect(() => {
    if (modalState.avatarModal) {
      const collections: any = {
        "avataaars": avataaars,
        "pixel-art": pixelArt,
        "bottts": bottts
      };

      const newAvatars = Array.from({ length: 12 }, () => {
        const seed = Math.random().toString(36).substring(7);
        return createAvatar(collections[avatarType] || avataaars, {
          seed,
          size: 128,
        }).toDataUri();
      });

      setAvatarOptions(newAvatars);
    }
  }, [modalState.avatarModal, avatarType]);

  // LOGICA DE LA CÁMARA
  useEffect(() => {
    let isMounted = true;
    const startCamera = async () => {
      try {
        setCameraReady(false);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1024 }, height: { ideal: 1024 } }
        });
        if (!isMounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        streamRef.current = stream;
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play();
              setCameraReady(true);
            };
          }
        }, 150);
      } catch (err) {
        console.error("Camera error:", err);
        toast.error("Unable to access camera.");
        handleModal('cameraModal', false);
      }
    };

    if (modalState.cameraModal) startCamera();
    else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setCameraReady(false);
    }
    return () => { isMounted = false; };
  }, [modalState.cameraModal]);

  // --- 4. ACCIONES ---
  const handleModal = (name: keyof typeof modalState, isOpen: boolean) => {
    setModalState(prev => ({ ...prev, [name]: isOpen }));
  };

  const handleCloseComplete = () => {
    setTemporaryImage(null);
    setPendingDelete(false);
    handleModal('mainModal', false);
    onClose();
  };

  const handleTemporaryDelete = () => {
    setPendingDelete(true);
    setTemporaryImage(null);
  };

  // --- 5. HANDLERS ---
  const handleFinish = async () => {
    const hasChanges = temporaryImage !== null || pendingDelete;
    if (!hasChanges) {
      handleCloseComplete();
      return;
    }
    try {
      setLoading(true);
      if (pendingDelete) {
        const res = await fetch("/api/profile/avatar", { method: "DELETE" });
        if (!res.ok) throw new Error("Error al eliminar");
        toast.success("Avatar eliminado");
      } 
      else if (temporaryImage) {
        const imageBlob = dataUrlToBlob(temporaryImage);
        const res = await fetch("/api/profile/avatar", {
          method: "PUT",
          headers: { "Content-Type": imageBlob.type },
          body: imageBlob,
        });
        if (!res.ok) throw new Error("Error al subir");
        toast.success("Avatar actualizado");
      }
      onFinish(true); 
      handleCloseComplete();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    setCapturedImage(canvas.toDataURL("image/jpeg"));
    handleModal('cameraModal', false);
    handleModal('cropModal', true);
  };

  const saveTemporaryImage = async () => {
    if (!capturedImage) return;
    try {
      setLoading(true);
      const croppedUrl = await getCroppedImg(capturedImage, croppedAreaPixels);
      setTemporaryImage(croppedUrl);
      setPendingDelete(false);
      handleModal('cropModal', false);
    } catch (e) {
      toast.error("Error cropping image");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCapturedImage(reader.result as string);
      handleModal('cropModal', true);
    };
    reader.readAsDataURL(file);
  };

  return {
    state: { 
      modalState, loading, temporaryImage, originalImage, 
      pendingDelete, capturedImage, zoom, crop, 
      avatarType, avatarOptions, cameraReady 
    },
    actions: { 
      handleModal, handleCloseComplete, handleTemporaryDelete, handleFinish,
      setZoom, setCrop, setAvatarType, setCapturedImage, setCameraReady, setAvatarOptions
    },
    handlers: { 
      capturePhoto, saveTemporaryImage, handleFileChange, 
      onCropComplete: (_: any, pixels: any) => setCroppedAreaPixels(pixels),
      openFilePicker: () => fileInputRef.current?.click(),
    },
    refs: { streamRef, videoRef, fileInputRef }
  };
}

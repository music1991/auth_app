import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { createAvatar, type Style } from "@dicebear/core";
import { avataaars, bottts, pixelArt } from "@dicebear/collection";
import getCroppedImg from "../helpers";
import { dataUrlToBlob } from "../helpers/imageHelpers";

type AvatarType = "avataaars" | "pixel-art" | "bottts";

type ModalState = {
  mainModal: boolean;
  selectionModal: boolean;
  cameraModal: boolean;
  avatarModal: boolean;
  cropModal: boolean;
};

type CroppedAreaPixels = {
  x: number;
  y: number;
  width: number;
  height: number;
};

// Each DiceBear collection has unique option types that are not mutually assignable,
// so we cast to Style<object> to use them interchangeably at runtime.
const AVATAR_COLLECTIONS: Record<AvatarType, Style<object>> = {
  avataaars: avataaars as Style<object>,
  "pixel-art": pixelArt as Style<object>,
  bottts: bottts as Style<object>,
};

export function useEditAvatar(
  initialImage: string | null,
  onFinish: (changed: boolean) => void,
  onClose: () => void,
  open: boolean
) {
  const [originalImage, setOriginalImage] = useState(initialImage);
  const [temporaryImage, setTemporaryImage] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [avatarType, setAvatarType] = useState<AvatarType>("avataaars");
  const [avatarOptions, setAvatarOptions] = useState<string[]>([]);
  const [modalState, setModalState] = useState<ModalState>({
    mainModal: false,
    selectionModal: false,
    cameraModal: false,
    avatarModal: false,
    cropModal: false,
  });

  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) handleModal("mainModal", true);
  }, [open]);

  useEffect(() => {
    setOriginalImage(initialImage);
    setTemporaryImage(null);
    setPendingDelete(false);
  }, [initialImage]);

  useEffect(() => {
    if (!modalState.avatarModal) return;

    const newAvatars = Array.from({ length: 12 }, () => {
      const seed = Math.random().toString(36).substring(7);
      return createAvatar(AVATAR_COLLECTIONS[avatarType], {
        seed,
        size: 128,
      }).toDataUri();
    });

    setAvatarOptions(newAvatars);
  }, [modalState.avatarModal, avatarType]);

  useEffect(() => {
    let isMounted = true;

    const startCamera = async () => {
      try {
        setCameraReady(false);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1024 }, height: { ideal: 1024 } },
        });
        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
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
      } catch {
        toast.error("Unable to access camera.");
        handleModal("cameraModal", false);
      }
    };

    if (modalState.cameraModal) {
      startCamera();
    } else {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setCameraReady(false);
    }

    return () => {
      isMounted = false;
    };
  }, [modalState.cameraModal]);

  const handleModal = (name: keyof ModalState, isOpen: boolean) => {
    setModalState((prev) => ({ ...prev, [name]: isOpen }));
  };

  const handleCloseComplete = () => {
    setTemporaryImage(null);
    setPendingDelete(false);
    handleModal("mainModal", false);
    onClose();
  };

  const handleTemporaryDelete = () => {
    setPendingDelete(true);
    setTemporaryImage(null);
  };

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
      } else if (temporaryImage) {
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
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
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
    handleModal("cameraModal", false);
    handleModal("cropModal", true);
  };

  const saveTemporaryImage = async () => {
    if (!capturedImage) return;
    try {
      setLoading(true);
      const croppedUrl = await getCroppedImg(capturedImage, croppedAreaPixels);
      setTemporaryImage(croppedUrl);
      setPendingDelete(false);
      handleModal("cropModal", false);
    } catch {
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
      handleModal("cropModal", true);
    };
    reader.readAsDataURL(file);
  };

  return {
    state: {
      modalState,
      loading,
      temporaryImage,
      originalImage,
      pendingDelete,
      capturedImage,
      zoom,
      crop,
      avatarType,
      avatarOptions,
      cameraReady,
    },
    actions: {
      handleModal,
      handleCloseComplete,
      handleTemporaryDelete,
      handleFinish,
      setZoom,
      setCrop,
      setAvatarType,
      setCapturedImage,
      setCameraReady,
      setAvatarOptions,
    },
    handlers: {
      capturePhoto,
      saveTemporaryImage,
      handleFileChange,
      onCropComplete: (_: unknown, pixels: CroppedAreaPixels) =>
        setCroppedAreaPixels(pixels),
      openFilePicker: () => fileInputRef.current?.click(),
    },
    refs: { streamRef, videoRef, fileInputRef },
  };
}

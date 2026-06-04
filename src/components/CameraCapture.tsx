import React, { useRef, useState, useEffect } from "react";
import { Camera, RefreshCw, X, AlertTriangle } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (base64String: string) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string>("");

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [activeDeviceId]);

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: activeDeviceId 
          ? { deviceId: { exact: activeDeviceId }, width: { ideal: 480 }, height: { ideal: 480 }, aspectRatio: 1 }
          : { facingMode: "user", width: { ideal: 480 }, height: { ideal: 480 }, aspectRatio: 1 }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasCamera(true);

      // List other cameras to allow switching if multiple present
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = mediaDevices.filter(device => device.kind === "videoinput");
      setDevices(videoDevices);
      if (!activeDeviceId && videoDevices.length > 0) {
        setActiveDeviceId(videoDevices[0].deviceId);
      }
    } catch (err: any) {
      console.error("Camera acquisition failed:", err);
      setHasCamera(false);
      setCameraError(
        err.name === "NotAllowedError"
          ? "Permission denied. Please grant webcam permissions in your browser address bar settings to use the camera."
          : "No camera found or hardware is currently occupied by another program."
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      // Set to square aspect ratio for passport photos
      const size = Math.min(video.videoWidth, video.videoHeight) || 300;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      
      if (ctx) {
        // Draw centered square out of input video stream
        const startX = (video.videoWidth - size) / 2;
        const startY = (video.videoHeight - size) / 2;
        ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);
        
        const base64 = canvas.toDataURL("image/jpeg", 0.85);
        setCapturedImage(base64);
        stopCamera();
      }
    }
  };

  const selectPhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const switchCamera = () => {
    if (devices.length > 1) {
      const currentIndex = devices.findIndex(d => d.deviceId === activeDeviceId);
      const nextIndex = (currentIndex + 1) % devices.length;
      setActiveDeviceId(devices[nextIndex].deviceId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 animate-fade-in backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-[#0a3d0a] px-4 py-3 text-[#FFD700]">
          <h3 className="font-bebas text-lg tracking-wider">PASSPORT SNAP CAM</h3>
          <button 
            type="button" 
            onClick={onClose}
            className="rounded-full p-1 text-[#FFD700]/70 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* VIEWPORT AREA */}
        <div className="relative flex aspect-square w-full items-center justify-center bg-slate-900 overflow-hidden">
          {capturedImage ? (
            <img 
              src={capturedImage} 
              alt="Snapped Passport" 
              className="h-full w-full object-cover" 
            />
          ) : (
            <>
              {hasCamera === null && (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <RefreshCw className="h-8 w-8 animate-spin text-[#FFD700]" />
                  <p className="text-xs">Initializing lens hardware...</p>
                </div>
              )}

              {hasCamera === false && (
                <div className="flex flex-col items-center p-6 text-center text-slate-300">
                  <AlertTriangle className="mb-3 h-10 w-10 text-amber-500" />
                  <p className="text-sm font-semibold text-white mb-2">Camera Unavailable</p>
                  <p className="text-xs text-slate-400 max-w-xs">{cameraError}</p>
                  <button 
                    type="button"
                    onClick={onClose}
                    className="mt-5 rounded-lg bg-white/10 px-4 py-2 text-xs font-semibold hover:bg-white/20 transition-colors"
                  >
                    Use Document Upload Mode
                  </button>
                </div>
              )}

              {hasCamera === true && (
                <div className="relative h-full w-full">
                  <video 
                    ref={videoRef}
                    autoPlay 
                    playsInline 
                    muted 
                    className="h-full w-full object-cover"
                  />
                  {/* Portrait Capture Frame Guide */}
                  <div className="absolute inset-4 border-2 border-dashed border-[#FFD700]/50 rounded-lg pointer-events-none flex flex-col justify-between p-4 bg-black/5">
                    <div className="text-[10px] bg-slate-950/80 text-white px-2 py-0.5 rounded self-center text-center font-semibold font-mono tracking-wider border border-white/10">
                      ALIGN HEAD IN BOX
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="bg-slate-50 p-4 flex gap-3 border-t border-slate-100">
          {capturedImage ? (
            <>
              <button
                type="button"
                onClick={retakePhoto}
                className="flex-1 py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-sm transition"
              >
                Retake Photo
              </button>
              <button
                type="button"
                onClick={selectPhoto}
                className="flex-1 py-2.5 px-4 bg-[#0a3d0a] hover:bg-[#072a07] text-white font-bold rounded-xl text-sm transition text-center shadow"
              >
                Use Snapped Photo
              </button>
            </>
          ) : (
            <>
              {devices.length > 1 && (
                <button
                  type="button"
                  onClick={switchCamera}
                  className="px-3 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
                  title="Switch Camera"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                disabled={!hasCamera}
                onClick={capturePhoto}
                className="flex-1 py-2.5 bg-gradient-to-r from-green-700 to-green-900 text-[#FFD700] hover:brightness-110 disabled:opacity-50 text-base font-bold rounded-xl flex items-center justify-center gap-2 shadow"
              >
                <Camera className="h-5 w-5" />
                Capture Frame
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

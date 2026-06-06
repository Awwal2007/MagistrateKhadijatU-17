import React, { useState } from "react";
import { Camera, Upload, AlertCircle, X, RefreshCw } from "lucide-react";
import { CameraCapture } from "./CameraCapture.js";

interface OfficialFormProps {
  onAdd: (official: {
    name: string;
    position: "Head Coach" | "Assistant Coach" | "Team Doctor" | "Kit Manager" | "Manager";
    photo: string;
  }) => void | Promise<void>;
  onClose: () => void;
  currentOfficialCount: number;
}

export const OfficialForm: React.FC<OfficialFormProps> = ({
  onAdd,
  onClose,
  currentOfficialCount,
}) => {
  const [name, setName] = useState("");
  const [position, setPosition] = useState<"Head Coach" | "Assistant Coach" | "Team Doctor" | "Kit Manager" | "Manager">("Head Coach");
  const [photo, setPhoto] = useState<string>("");
  const [showCamera, setShowCamera] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Invalid file type. Please upload a valid image file (e.g., JPG, PNG).");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(`File size is too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Please upload an image smaller than 5MB.`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
        setError(null);
      };
      reader.onerror = () => {
        setError("An error occurred while reading the file. Please try again.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = (base64: string) => {
    setPhoto(base64);
    setShowCamera(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);

    if (!name.trim()) {
      setError("Please key in the official's full name.");
      return;
    }
    if (!photo) {
      setError("A passport photo is required to build official's identification credentials.");
      return;
    }
    if (currentOfficialCount >= 4) {
      setError("Cannot add official. The tournament maximum limit of 4 officials has been reached.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd({
        name: name.trim(),
        position,
        photo,
      });
    } catch (err: any) {
      setError(err.message || "Failed to add official.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 p-4 overflow-y-auto backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100 my-8">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-[#0a3d0a] px-5 py-4 text-[#FFD700]">
          <div className="flex items-center gap-2">
            <h3 className="font-bebas text-xl tracking-wider select-none">ADD OFFICIAL STAFF MEMBER</h3>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="rounded-full p-1 text-[#FFD700]/70 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* FORM CONTENT */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl bg-red-50 p-3.5 text-xs text-red-700 border border-red-200/50">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <div>
                <span className="font-semibold block">Roster Registration Blocked</span>
                {error}
              </div>
            </div>
          )}

          {/* Official Name */}
          <div>
            <label className="text-xs font-bold text-[#0a3d0a]/80 uppercase tracking-wider block mb-1.5">Official Full Name</label>
            <input 
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Coach Stephen Keshi"
              className="w-full text-sm py-2.5 px-3.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0a3d0a] focus:ring-1 focus:ring-[#0a3d0a] transition bg-slate-50/50"
            />
          </div>

          {/* Position Selector */}
          <div>
            <label className="text-xs font-bold text-[#0a3d0a]/80 uppercase tracking-wider block mb-1.5">Official Position / Assignment</label>
            <select 
              value={position}
              onChange={(e) => setPosition(e.target.value as any)}
              className="w-full text-sm py-2.5 px-3.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0a3d0a] focus:ring-1 focus:ring-[#0a3d0a] transition bg-white"
            >
              <option value="Head Coach">Head Coach</option>
              <option value="Assistant Coach">Assistant Coach</option>
              <option value="Team Doctor">Team Doctor</option>
              <option value="Kit Manager">Kit Manager</option>
              <option value="Manager">Manager</option>
            </select>
          </div>

          {/* Current Quota Info */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 flex justify-between items-center text-xs">
            <span className="text-slate-600 font-medium">Officials Quota Slot Allocation:</span>
            <span className="font-bold text-amber-700 bg-amber-50 px-2.5 py-1.5 border border-amber-200/60 rounded-md">
              {currentOfficialCount} / 4 Slots Utilized
            </span>
          </div>

          {/* Photo Options */}
          <div>
            <label className="text-xs font-bold text-[#0a3d0a]/80 uppercase tracking-wider block mb-2">Passport Photo Identification</label>
            <div className="grid grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={() => setShowCamera(true)}
                className="py-6 border border-dashed border-[#0a3d0a]/30 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-green-50/45 hover:border-[#0a3d0a]/70 transition-all text-slate-700 bg-slate-50/30 font-semibold text-xs"
              >
                <Camera className="h-6 w-6 text-[#0a3d0a]" />
                Shoot with Web-Cam
              </button>

              <label className="py-6 border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-slate-50 hover:border-slate-400 transition-all cursor-pointer text-slate-700 bg-slate-50/30 font-semibold text-xs">
                <Upload className="h-6 w-6 text-slate-400" />
                Upload Device Image
                <input 
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Picture Uploaded / Captured Preview */}
            {photo && (
              <div className="mt-4 p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 animate-fade-in">
                <img 
                  src={photo} 
                  alt="Official Draft Preview" 
                  className="w-14 h-14 object-cover rounded-lg border border-[#FFD700] bg-white text-xs text-center" 
                />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-slate-700 block truncate">passport-identification.jpg</span>
                  <span className="text-[10px] text-[#0a3d0a] font-semibold flex items-center gap-0.5">
                    ● Image loaded successfully
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPhoto("")}
                  className="p-1 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-200 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* ACTION BUTTON */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#0a3d0a] hover:bg-[#072a07] text-[#FFD700] hover:brightness-110 text-sm font-bold tracking-wider rounded-xl transition shadow uppercase flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <><RefreshCw className="h-4 w-4 animate-spin" />Registering Official...</>
              ) : (
                "Add Official to Roster Code"
              )}
            </button>
          </div>
        </form>

        {/* Snap Web Camera Portal */}
        {showCamera && (
          <CameraCapture 
            onCapture={handleCameraCapture} 
            onClose={() => setShowCamera(false)} 
          />
        )}

      </div>
    </div>
  );
};

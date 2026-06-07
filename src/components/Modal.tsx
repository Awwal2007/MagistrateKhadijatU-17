import React from "react";
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error" | "confirm";
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "info",
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDangerous = false,
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "success": return <CheckCircle className="h-6 w-6 text-emerald-500" />;
      case "warning":
      case "confirm": return <AlertTriangle className={`h-6 w-6 ${isDangerous ? 'text-red-500' : 'text-amber-500'}`} />;
      case "error": return <AlertCircle className="h-6 w-6 text-red-500" />;
      default: return <Info className="h-6 w-6 text-blue-500" />;
    }
  };

  const getHeaderBg = () => {
    if (type === 'error' || (type === 'confirm' && isDangerous)) return 'bg-red-50';
    if (type === 'warning' || type === 'confirm') return 'bg-amber-50';
    if (type === 'success') return 'bg-emerald-50';
    return 'bg-blue-50';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className={`p-6 ${getHeaderBg()} border-b border-slate-100 flex items-center gap-4`}>
          <div className="p-2 bg-white rounded-2xl shadow-sm">
            {getIcon()}
          </div>
          <h3 className="font-bebas text-2xl tracking-wider text-slate-800 uppercase flex-1">{title}</h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:bg-white hover:text-slate-600 rounded-full transition">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-sm text-slate-600 leading-relaxed font-medium">{message}</p>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
          {type === 'confirm' ? (
            <>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-200 rounded-xl transition"
              >
                {cancelText}
              </button>
              <button
                onClick={() => { onConfirm?.(); onClose(); }}
                className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider text-white rounded-xl transition shadow-sm ${
                  isDangerous ? 'bg-red-600 hover:bg-red-700' : 'bg-[#0a3d0a] hover:bg-[#072a07]'
                }`}
              >
                {confirmText}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-[#0a3d0a] hover:bg-[#072a07] text-[#FFD700] text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-sm"
            >
              Okay
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
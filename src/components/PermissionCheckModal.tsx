import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Mic, CheckCircle, XCircle, Loader, Shield, AlertTriangle, ArrowRight, X } from 'lucide-react';

interface PermissionCheckModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPermissionsGranted: () => void;
    assessmentType?: string;
}

type PermissionStatus = 'pending' | 'checking' | 'granted' | 'denied';

export const PermissionCheckModal: React.FC<PermissionCheckModalProps> = ({
    isOpen,
    onClose,
    onPermissionsGranted,
    assessmentType = 'Assessment'
}) => {
    const [cameraStatus, setCameraStatus] = useState<PermissionStatus>('pending');
    const [micStatus, setMicStatus] = useState<PermissionStatus>('pending');
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Automatically request permissions as soon as the modal opens
    useEffect(() => {
        if (isOpen) {
            setCameraStatus('pending');
            setMicStatus('pending');
            setError(null);
            checkPermissions();
        }
    }, [isOpen]);  

    // Clean up stream on unmount or close
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    const checkPermissions = async () => {
        setCameraStatus('checking');
        setMicStatus('checking');
        setError(null);

        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            setStream(mediaStream);
            setCameraStatus('granted');
            setMicStatus('granted');
        } catch (err: any) {
            console.error('Permission error:', err);

            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setCameraStatus('denied');
                setMicStatus('denied');
                setError('Camera and microphone access was denied. Please enable permissions in your browser settings.');
            } else if (err.name === 'NotFoundError') {
                setError('No camera or microphone found. Please connect these devices to continue.');
                setCameraStatus('denied');
                setMicStatus('denied');
            } else {
                setError('Failed to access camera/microphone. Please check your device settings.');
                setCameraStatus('denied');
                setMicStatus('denied');
            }
        }
    };

    const handleContinue = () => {
        if (cameraStatus === 'granted' && micStatus === 'granted') {
            onPermissionsGranted();
        }
    };

    const allGranted = cameraStatus === 'granted' && micStatus === 'granted';
    const anyDenied = cameraStatus === 'denied' || micStatus === 'denied';
    const isChecking = cameraStatus === 'checking' || micStatus === 'checking';

    const getStatusIcon = (status: PermissionStatus) => {
        switch (status) {
            case 'granted':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'denied':
                return <XCircle className="w-5 h-5 text-red-500" />;
            case 'checking':
                return <Loader className="w-5 h-5 text-orange animate-spin" />;
            default:
                return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
        }
    };

    const getStatusText = (status: PermissionStatus) => {
        switch (status) {
            case 'granted':
                return 'Enabled';
            case 'denied':
                return 'Denied';
            case 'checking':
                return 'Checking...';
            default:
                return 'Waiting';
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header — fixed, never scrolls */}
                    <div className="bg-gradient-to-r from-teal to-blue-600 p-5 text-white relative flex-shrink-0">
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 p-1.5 hover:bg-white/20 rounded-full transition"
                        >
                            <X size={18} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                <Shield className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold leading-tight">Proctored Assessment</h2>
                                <p className="text-teal-100 text-xs">Camera & microphone required for verification</p>
                            </div>
                        </div>
                    </div>

                    {/* Scrollable body */}
                    <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
                        {/* Mobile device warning */}
                        {/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) && (
                            <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-700">
                                    <strong>Mobile device detected.</strong> Assessments are best taken on a desktop or laptop. Camera and microphone proctoring may not function correctly on mobile.
                                </p>
                            </div>
                        )}

                        {/* AI proctoring disclaimer */}
                        <div className="flex items-start gap-2.5 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                            <Shield className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-700 leading-relaxed">
                                <strong>AI Proctoring Active:</strong> This session monitors your eye gaze pattern and screen focus to detect distractions. Looking away repeatedly or switching tabs will be flagged. Stay focused and keep your face visible to the camera throughout.
                            </p>
                        </div>

                        <p className="text-gray-500 text-sm">
                            This {assessmentType} requires camera and microphone access to ensure integrity.
                            Your session will be monitored for proctoring purposes.
                        </p>

                        {/* Permission Cards */}
                        <div className="space-y-2">
                            {/* Camera */}
                            <div className={`flex items-center justify-between p-3 rounded-xl border-2 transition ${
                                cameraStatus === 'granted' ? 'border-green-200 bg-green-50' :
                                cameraStatus === 'denied'  ? 'border-red-200 bg-red-50'   :
                                                             'border-gray-200 bg-gray-50'
                            }`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                        cameraStatus === 'granted' ? 'bg-green-100 text-green-600' :
                                        cameraStatus === 'denied'  ? 'bg-red-100 text-red-600'     :
                                                                     'bg-gray-200 text-gray-500'
                                    }`}>
                                        <Camera size={18} />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-900 text-sm">Camera</div>
                                        <div className="text-xs text-gray-400">For face verification</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className={`text-xs font-medium ${
                                        cameraStatus === 'granted' ? 'text-green-600' :
                                        cameraStatus === 'denied'  ? 'text-red-600'   : 'text-gray-500'
                                    }`}>{getStatusText(cameraStatus)}</span>
                                    {getStatusIcon(cameraStatus)}
                                </div>
                            </div>

                            {/* Microphone */}
                            <div className={`flex items-center justify-between p-3 rounded-xl border-2 transition ${
                                micStatus === 'granted' ? 'border-green-200 bg-green-50' :
                                micStatus === 'denied'  ? 'border-red-200 bg-red-50'     :
                                                         'border-gray-200 bg-gray-50'
                            }`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                        micStatus === 'granted' ? 'bg-green-100 text-green-600' :
                                        micStatus === 'denied'  ? 'bg-red-100 text-red-600'     :
                                                                  'bg-gray-200 text-gray-500'
                                    }`}>
                                        <Mic size={18} />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-900 text-sm">Microphone</div>
                                        <div className="text-xs text-gray-400">For verbal responses</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className={`text-xs font-medium ${
                                        micStatus === 'granted' ? 'text-green-600' :
                                        micStatus === 'denied'  ? 'text-red-600'   : 'text-gray-500'
                                    }`}>{getStatusText(micStatus)}</span>
                                    {getStatusIcon(micStatus)}
                                </div>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl"
                            >
                                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-red-700 leading-relaxed">{error}</p>
                            </motion.div>
                        )}

                        {/* Success */}
                        {allGranted && (
                            <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-start gap-2.5 p-3 bg-green-50 border border-green-200 rounded-xl"
                            >
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-green-700">All permissions granted! You're ready to begin.</p>
                            </motion.div>
                        )}
                    </div>

                    {/* Footer — fixed, never scrolls */}
                    <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100 space-y-3">
                        <div className="flex gap-2">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>

                            {!allGranted ? (
                                <button
                                    onClick={checkPermissions}
                                    disabled={isChecking}
                                    className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-xl font-semibold text-sm hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isChecking ? (
                                        <><Loader className="w-4 h-4 animate-spin" /> Requesting…</>
                                    ) : (
                                        <><Camera className="w-4 h-4" /> Try Again</>
                                    )}
                                </button>
                            ) : (
                                <motion.button
                                    initial={{ scale: 0.95 }}
                                    animate={{ scale: 1 }}
                                    onClick={handleContinue}
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-teal to-blue-600 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition flex items-center justify-center gap-2 shadow-md"
                                >
                                    Start Assessment <ArrowRight className="w-4 h-4" />
                                </motion.button>
                            )}
                        </div>
                        <p className="text-xs text-gray-400 text-center">
                            Camera &amp; mic are only active during the assessment.
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PermissionCheckModal;

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
                    className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-teal to-blue-600 p-6 text-white relative">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition"
                        >
                            <X size={20} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                <Shield className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Proctored Assessment</h2>
                                <p className="text-teal-100 text-sm">Camera & Mic required for verification</p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <p className="text-gray-600 text-sm mb-6">
                            This {assessmentType} requires camera and microphone access to ensure assessment integrity.
                            Your session will be monitored for proctoring purposes.
                        </p>

                        {/* Permission Cards */}
                        <div className="space-y-3 mb-6">
                            <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition ${cameraStatus === 'granted' ? 'border-green-200 bg-green-50' :
                                    cameraStatus === 'denied' ? 'border-red-200 bg-red-50' :
                                        'border-gray-200 bg-gray-50'
                                }`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cameraStatus === 'granted' ? 'bg-green-100 text-green-600' :
                                            cameraStatus === 'denied' ? 'bg-red-100 text-red-600' :
                                                'bg-gray-200 text-gray-500'
                                        }`}>
                                        <Camera size={20} />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-900">Camera</div>
                                        <div className="text-xs text-gray-500">For face verification</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-medium ${cameraStatus === 'granted' ? 'text-green-600' :
                                            cameraStatus === 'denied' ? 'text-red-600' :
                                                'text-gray-500'
                                        }`}>{getStatusText(cameraStatus)}</span>
                                    {getStatusIcon(cameraStatus)}
                                </div>
                            </div>

                            <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition ${micStatus === 'granted' ? 'border-green-200 bg-green-50' :
                                    micStatus === 'denied' ? 'border-red-200 bg-red-50' :
                                        'border-gray-200 bg-gray-50'
                                }`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${micStatus === 'granted' ? 'bg-green-100 text-green-600' :
                                            micStatus === 'denied' ? 'bg-red-100 text-red-600' :
                                                'bg-gray-200 text-gray-500'
                                        }`}>
                                        <Mic size={20} />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-900">Microphone</div>
                                        <div className="text-xs text-gray-500">For verbal responses</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-medium ${micStatus === 'granted' ? 'text-green-600' :
                                            micStatus === 'denied' ? 'text-red-600' :
                                                'text-gray-500'
                                        }`}>{getStatusText(micStatus)}</span>
                                    {getStatusIcon(micStatus)}
                                </div>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6"
                            >
                                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700">{error}</p>
                            </motion.div>
                        )}

                        {/* Success Message */}
                        {allGranted && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl mb-6"
                            >
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-green-700">All permissions granted! You're ready to start the assessment.</p>
                            </motion.div>
                        )}

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>

                            {!allGranted ? (
                                <button
                                    onClick={checkPermissions}
                                    disabled={isChecking}
                                    className="flex-1 px-4 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isChecking ? (
                                        <>
                                            <Loader className="w-4 h-4 animate-spin" />
                                            Checking...
                                        </>
                                    ) : anyDenied ? (
                                        'Try Again'
                                    ) : (
                                        <>
                                            <Camera className="w-4 h-4" />
                                            Enable Access
                                        </>
                                    )}
                                </button>
                            ) : (
                                <motion.button
                                    initial={{ scale: 0.95 }}
                                    animate={{ scale: 1 }}
                                    onClick={handleContinue}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-teal to-blue-600 text-white rounded-xl font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 shadow-lg"
                                >
                                    Start Assessment
                                    <ArrowRight className="w-4 h-4" />
                                </motion.button>
                            )}
                        </div>

                        {/* Privacy Note */}
                        <p className="text-xs text-gray-400 text-center mt-4">
                            Your camera and microphone are only used during the assessment for proctoring purposes.
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PermissionCheckModal;

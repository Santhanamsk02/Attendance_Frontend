import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { UserCheck, ShieldAlert, Camera, Fingerprint } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiClient } from '../../services/api';

export default function TeacherVerifyPage() {
    const { user } = useAuth();
    const { success: showSuccessToast, error: showError } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const [scannedId, setScannedId] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const scannerRef = useRef(null);

    // Get the intended destination, or default to dashboard
    const fromLocation = location.state?.from;
    const fromPath = fromLocation?.pathname || "/teacher/dashboard";
    const fromSearch = fromLocation?.search || "";
    const fromState = fromLocation?.state || {};

    useEffect(() => {
        let html5QrCode;

        const startScanner = async () => {
            try {
                html5QrCode = new Html5Qrcode("faculty-scanner-region", {
                    formatsToSupport: [
                        Html5QrcodeSupportedFormats.QR_CODE,
                        Html5QrcodeSupportedFormats.CODE_128,
                        Html5QrcodeSupportedFormats.CODE_39,
                        Html5QrcodeSupportedFormats.CODE_93,
                        Html5QrcodeSupportedFormats.EAN_13,
                        Html5QrcodeSupportedFormats.EAN_8,
                        Html5QrcodeSupportedFormats.UPC_A,
                        Html5QrcodeSupportedFormats.UPC_E,
                    ]
                });

                await html5QrCode.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 150 },
                        aspectRatio: 1.0,
                    },
                    (decodedText) => {
                        // Successfully scanned
                        if (html5QrCode.isScanning) {
                            html5QrCode.stop().then(() => {
                                handleVerification(decodedText);
                            }).catch(err => console.error("Failed to stop scanner", err));
                        }
                    },
                    (errorMessage) => {
                        // ignore continuous errors while looking for code
                    }
                );
                scannerRef.current = html5QrCode;
            } catch (err) {
                setError("Camera access is required to scan the faculty ID.");
            }
        };

        if (!success) {
            startScanner();
        }

        return () => {
            if (html5QrCode && html5QrCode.isScanning) {
                html5QrCode.stop().catch(console.error);
            }
        };
    }, [success]);

    const handleVerification = async (scannedEmployeeId) => {
        try {
            setScannedId(scannedEmployeeId);
            const response = await apiClient.post('/teacher-access/verify-id', {
                scanned_employee_id: scannedEmployeeId,
                authenticated_employee_id: user?.employee_id || ''
            });

            // Success
            setSuccess(true);
            const token = response.data.verification_token;
            // Store token securely (e.g. session storage or auth context)
            sessionStorage.setItem('teacher_verification_token', token);

            showSuccessToast("Faculty ID verified successfully");

        } catch (err) {
            const msg = err.response?.data?.detail || "Faculty ID Verification Failed. The scanned ID does not belong to your account.";
            setError(msg);
        }
    };

    const handleRetry = () => {
        setError(null);
        setScannedId(null);
        setSuccess(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white neu-card p-6 md:p-8 animate-fade-in relative z-10 text-center">

                <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-6">
                    <UserCheck className="w-8 h-8 text-indigo-600" />
                </div>

                <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-tight">
                    Verify Faculty Identity
                </h1>
                <p className="text-sm md:text-base font-semibold text-slate-500 mt-2">
                    Scan your faculty ID card to continue.
                </p>

                {error ? (
                    <div className="mt-8">
                        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
                            <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto mb-3" />
                            <h3 className="text-base font-bold text-rose-700 mb-1">Verification Failed</h3>
                            <p className="text-sm font-medium text-rose-600">{error}</p>

                            <button
                                onClick={handleRetry}
                                className="mt-5 px-6 py-2.5 bg-rose-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-200/50 hover:bg-rose-700 transition"
                            >
                                Scan Again
                            </button>
                        </div>
                    </div>
                ) : success ? (
                    <div className="mt-8">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center animate-fade-in">
                            <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-black text-emerald-800 tracking-tight">Faculty ID Verified</h3>

                            <div className="mt-4 flex flex-col gap-1.5 p-4 bg-white/60 rounded-xl border border-emerald-100">
                                <div className="flex justify-between text-sm font-bold">
                                    <span className="text-slate-500">Employee ID:</span>
                                    <span className="text-slate-800">{scannedId}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold">
                                    <span className="text-slate-500">Attendance Access:</span>
                                    <span className="text-emerald-600">Enabled</span>
                                </div>
                            </div>

                            <button
                                onClick={() => navigate(fromPath + fromSearch, { replace: true, state: fromState })}
                                className="w-full mt-6 px-4 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold text-base shadow-lg shadow-emerald-200/50 hover:shadow-emerald-300 transition-all flex items-center justify-center gap-2"
                            >
                                Continue to Dashboard
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="mt-8">
                        <div className="relative overflow-hidden rounded-2xl bg-black aspect-square border-4 border-slate-200 shadow-inner">
                            <div id="faculty-scanner-region" className="w-full h-full" />

                            {/* Scanning overlay guidelines */}
                            <div className="absolute inset-0 border-[40px] border-white/20 pointer-events-none"></div>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-12">
                                <span className="px-3 py-1 bg-black/50 text-white text-xs font-bold rounded-lg backdrop-blur-sm">
                                    Align Barcode
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col gap-2">
                            <div className="flex items-center justify-center gap-2 text-sm font-bold text-slate-400">
                                <Camera className="w-4 h-4" />
                                <span>Scanning active...</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

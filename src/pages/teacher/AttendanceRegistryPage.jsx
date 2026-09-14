import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { QrCode, Keyboard, Users, CheckCircle2, ChevronLeft, ShieldAlert, BadgeCheck, Clock, ListChecks } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { apiClient } from "../../services/api";

export default function AttendanceRegistryPage() {
    const { user } = useAuth();
    const { success: showSuccessToast, error: showErrorToast } = useToast();
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // The class data might come from location.state if navigated from Today's Classes
    const [classData, setClassData] = useState(location.state?.classData || null);
    const [sessionId, setSessionId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [activeTab, setActiveTab] = useState("scan"); // "scan" or "manual"
    const [manualRollNo, setManualRollNo] = useState("");

    const [scanOverlay, setScanOverlay] = useState(null); // { name, status }

    const [recentScans, setRecentScans] = useState([]); // { roll_number, student_name, time, success }
    const [markedRolls, setMarkedRolls] = useState(new Set());  // Track an infinite list for Roster checks
    const [preloadedRolls, setPreloadedRolls] = useState([]);

    const [rosterStudents, setRosterStudents] = useState([]);
    const [loadingRoster, setLoadingRoster] = useState(false);

    const scannerRef = useRef(null);
    const processingRef = useRef(false);

    const checkHasStarted = (timeString) => {
        if (!timeString || timeString === "Unknown Time") return true;
        const [start] = timeString.split(' - ');
        if (!start) return true;

        const [hours, minutes] = start.split(':').map(Number);
        const now = new Date();
        const classTime = new Date(now);
        classTime.setHours(hours, minutes, 0, 0);
        return now >= classTime;
    };

    const checkHasEnded = (timeString) => {
        if (!timeString || timeString === "Unknown Time") return false;
        const parts = timeString.split(' - ');
        if (parts.length < 2) return false;

        const [hours, minutes] = parts[1].split(':').map(Number);
        const now = new Date();
        const endTime = new Date(now);
        endTime.setHours(hours, minutes, 0, 0);
        return now > endTime;
    };

    const formatTime12Hour = (time24Str) => {
        if (!time24Str || time24Str === "Unknown Time") return time24Str;
        const formatSingle = (ts) => {
            if (!ts) return "";
            const [h, m] = ts.split(':');
            let hours = parseInt(h, 10);
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;
            return `${hours}:${m} ${ampm}`;
        };

        if (time24Str.includes(' - ')) {
            const [start, end] = time24Str.split(' - ');
            return `${formatSingle(start)} - ${formatSingle(end)}`;
        }
        return formatSingle(time24Str);
    };

    // 1. Start Session on mount
    useEffect(() => {
        const startSession = async () => {
            let activeClassData = classData;

            if (!activeClassData) {
                try {
                    const todayRes = await apiClient.get("/teacher/today");
                    const classes = todayRes.data.classes || [];

                    const runningClass = classes.find(c => {
                        return c.status === 'CURRENT' || (checkHasStarted(c.time) && !checkHasEnded(c.time));
                    });

                    if (runningClass) {
                        activeClassData = runningClass;
                        setClassData(runningClass);
                    } else {
                        // Display error in page instead of silently kicking them out
                        setError("You have no classes currently running right now.");
                        setLoading(false);
                        return;
                    }
                } catch (err) {
                    setError("Unable to resolve active schedule.");
                    setLoading(false);
                    return;
                }
            }

            if (activeClassData?.time && !checkHasStarted(activeClassData.time)) {
                setError(`Class has not started yet. Please wait until ${formatTime12Hour(activeClassData.time.split(' - ')[0])} to take attendance.`);
                setLoading(false);
                return;
            }

            try {
                // Verify we have a verification token
                const token = sessionStorage.getItem('teacher_verification_token');
                if (!token) {
                    showErrorToast("Verification required to take attendance");

                    // Bundle up our newly resolved active context into the redirect state stack
                    const returnState = {
                        from: {
                            pathname: location.pathname,
                            search: location.search,
                            state: { classData: activeClassData }
                        }
                    };
                    navigate("/teacher/verify", { state: returnState });
                    return;
                }

                // Call backend to initialize session
                const res = await apiClient.post("/attendance/sessions", {
                    subject_code: activeClassData?.code || "IT501",
                    section_name: activeClassData?.section || "IT - 7 E",
                    period_id: activeClassData?.period || "p1",
                    date: new Date().toISOString().split('T')[0]
                }, {
                    headers: { "teacher-verification-token": token }
                });

                setSessionId(res.data.id);

                // Rehydrate previous attendance if they are editing a completed session!
                if (res.data.marked_rolls && res.data.marked_rolls.length > 0) {
                    setMarkedRolls(new Set(res.data.marked_rolls));
                    setPreloadedRolls(res.data.marked_rolls);
                }
            } catch (err) {
                console.error(err);
                if (err.response?.status === 401) {
                    showErrorToast("Verification Session Expired");
                    navigate("/teacher/verify", { state: { from: location } });
                } else {
                    setError(err.response?.data?.detail || "Failed to initialize attendance session.");
                }
            } finally {
                setLoading(false);
            }
        };

        startSession();
    }, []);

    // 2. Setup Scanner when in "scan" tab
    useEffect(() => {
        let html5QrCode;

        if (activeTab === "scan" && sessionId && !error) {
            const startScanner = async () => {
                try {
                    html5QrCode = new Html5Qrcode("attendance-scanner-region", {
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
                            fps: 30, // Triple the frequency of frames analyzed
                            // Removing qrbox allows the engine to scan the entire frame!
                            disableFlip: false, // Assists scanning from upside down
                            aspectRatio: 1.0,
                            videoConstraints: {
                                width: { min: 640, ideal: 1920 },
                                height: { min: 480, ideal: 1080 },
                                advanced: [{ focusMode: "continuous" }] // Suggest constant auto-focus to browser
                            }
                        },
                        (decodedText) => {
                            if (!processingRef.current) {
                                handleMarkAttendance(decodedText, "BARCODE_SCAN");
                            }
                        },
                        () => { } // Ignore continuous errors
                    );
                    scannerRef.current = html5QrCode;
                } catch (err) {
                    console.error("Scanner Error", err);
                }
            };
            startScanner();
        }

        return () => {
            if (html5QrCode && html5QrCode.isScanning) {
                html5QrCode.stop().catch(console.error);
            }
        };
    }, [activeTab, sessionId, error]);

    // 3. Fetch Roster on load to power all tabs
    useEffect(() => {
        if (classData?.code && classData?.section && rosterStudents.length === 0) {
            const fetchRoster = async () => {
                setLoadingRoster(true);
                try {
                    const res = await apiClient.get(`/teacher/roster?subject_code=${classData.code}&section_name=${classData.section}`);
                    setRosterStudents(res.data);
                } catch (err) {
                    console.error("Failed to fetch roster", err);
                } finally {
                    setLoadingRoster(false);
                }
            };
            fetchRoster();
        }
    }, [classData]);

    // 4. Transform preloaded rolls into visible recent scans using Roster names
    useEffect(() => {
        if (rosterStudents.length > 0 && preloadedRolls.length > 0 && recentScans.length === 0) {
            const reconstructed = [];
            for (const roll of preloadedRolls) {
                const s = rosterStudents.find(st => st.roll_no === roll);
                reconstructed.push({
                    roll_number: roll,
                    student_name: s ? s.name : `Unknown (${roll})`,
                    time: "Restored",
                    success: true
                });
            }
            // Reverse so they appear in top-down UI logically (optional)
            setRecentScans(reconstructed.reverse());
            setPreloadedRolls([]);
        }
    }, [rosterStudents, preloadedRolls, recentScans.length]);


    const handleMarkAttendance = (rollNo, method) => {
        if (!rollNo.trim()) return;

        processingRef.current = true;
        const cleanRoll = rollNo.trim().toUpperCase();

        const student = rosterStudents.find(s => s.roll_no.toUpperCase() === cleanRoll);
        const nameDisplay = student ? student.name : `Unknown Student (${cleanRoll})`;

        if (markedRolls.has(cleanRoll)) {
            // Toggle to UNMARK
            setMarkedRolls(prev => {
                const next = new Set(prev);
                next.delete(cleanRoll);
                return next;
            });
            setRecentScans(currentScans => currentScans.filter(scan => scan.roll_number !== cleanRoll));

            if (method === "MANUAL_ENTRY") {
                showSuccessToast(`${cleanRoll} unmarked (absent).`);
                setManualRollNo("");
            } else if (method === "BARCODE_SCAN") {
                setScanOverlay({ name: nameDisplay, status: "REMOVED" });
                setTimeout(() => setScanOverlay(null), 1200);
            }
            // Free the scanner slightly later to show overlay
            setTimeout(() => {
                processingRef.current = false;
            }, 1200);
            return;
        }

        // Persist absolutely
        setMarkedRolls(prev => {
            const next = new Set(prev);
            next.add(cleanRoll);
            return next;
        });

        // Add to top of recent scans
        setRecentScans(prev => [
            {
                roll_number: cleanRoll,
                student_name: nameDisplay,
                time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
                success: true
            },
            ...prev
        ]); // Removed slice(0, 10) so it's infinite

        if (method === "MANUAL_ENTRY") {
            setManualRollNo("");
            showSuccessToast(`${nameDisplay} marked present`);
        } else if (method === "BARCODE_SCAN") {
            setScanOverlay({ name: nameDisplay, status: "PRESENT" });
            setTimeout(() => setScanOverlay(null), 1200);
        }

        // Keep scanner paused until overlay drops
        setTimeout(() => {
            processingRef.current = false;
        }, 1200);
    };

    const handleManualSubmit = (e) => {
        e.preventDefault();
        handleMarkAttendance(manualRollNo, "MANUAL_ENTRY");
    };

    const handleMarkAllRoster = () => {
        if (rosterStudents.length === 0) return;

        let newScans = [];

        setMarkedRolls(prev => {
            const next = new Set(prev);
            for (const student of rosterStudents) {
                const roll = student.roll_no.toUpperCase();
                if (!next.has(roll)) {
                    next.add(roll);
                    newScans.push({
                        roll_number: roll,
                        student_name: student.name,
                        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
                        success: true
                    });
                }
            }
            return next;
        });

        setTimeout(() => {
            if (newScans.length > 0) {
                setRecentScans(current => [...newScans, ...current]);
                showSuccessToast(`Marked ${newScans.length} additional students present!`);
            } else {
                showSuccessToast("All students are already marked present.");
            }
        }, 0);
    };

    const handleFinalize = async () => {
        try {
            const token = sessionStorage.getItem('teacher_verification_token');
            const rollNumbersArray = Array.from(markedRolls);

            await apiClient.post(`/attendance/sessions/${sessionId}/submit`, {
                roll_numbers: rollNumbersArray
            }, {
                headers: { "teacher-verification-token": token }
            });
            showSuccessToast("Attendance Session Finalized Successfully");
            navigate("/teacher/today");
        } catch (err) {
            showErrorToast("Failed to finalize session");
        }
    }

    if (loading) return <div className="p-8 text-center animate-pulse text-slate-500 font-bold">Initializing Attendance Session...</div>;

    if (error) {
        const isTimeBlock = error.includes("Please wait until");
        return (
            <div className="max-w-md mx-auto mt-12 bg-white neu-card p-8 rounded-3xl text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all">
                    {isTimeBlock ? (
                        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-full">
                            <Clock className="w-8 h-8 text-indigo-500" />
                        </div>
                    ) : (
                        <div className="bg-rose-50 border border-rose-100 p-4 rounded-full">
                            <ShieldAlert className="w-8 h-8 text-rose-500" />
                        </div>
                    )}
                </div>

                <h2 className="text-xl font-black text-slate-800 mb-2">
                    {isTimeBlock ? "Class Not Started" : "Class Not Started"}
                </h2>
                <p className="text-slate-500 mb-6 font-semibold">{error}</p>
                <button onClick={() => navigate("/teacher/today")} className="neu-btn px-6 py-2.5 rounded-xl text-sky-600 font-bold border border-sky-100 hover:bg-sky-50 transition-all">
                    Return to Today's Classes
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-6">

            {/* Left Column: Scanner / Input */}
            <div className="flex-1 space-y-6">
                {/* Header Card */}
                <div className="neu-card p-6 rounded-3xl bg-white border-l-4 border-emerald-500 flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Users className="w-24 h-24 text-emerald-600" />
                    </div>
                    <button onClick={() => navigate("/teacher/today")} className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-emerald-600 w-fit mb-3 transition-colors">
                        <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                    <h1 className="text-xl font-black text-slate-800 leading-tight mb-1 relative z-10">{classData?.subject || "Subject"}</h1>
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-500 relative z-10">
                        <span>{classData?.section || "Section"}</span>
                        <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                        <span className="text-emerald-600">Active Session</span>
                    </div>
                </div>

                {/* Main Action Card */}
                <div className="neu-card rounded-3xl bg-white overflow-hidden p-2">
                    {/* Tabs */}
                    <div className="flex p-1.5 bg-slate-50 rounded-2xl mb-4 text-xs font-black uppercase tracking-wider">
                        <button
                            onClick={() => setActiveTab('scan')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${activeTab === 'scan' ? 'bg-white text-emerald-600 shadow-[0_2px_10px_rgba(16,185,129,0.15)]' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <QrCode className="w-4 h-4" /> Barcode Scan
                        </button>
                        <button
                            onClick={() => setActiveTab('manual')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${activeTab === 'manual' ? 'bg-white text-sky-600 shadow-[0_2px_10px_rgba(14,165,233,0.15)]' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Keyboard className="w-4 h-4" /> Manual Entry
                        </button>
                        <button
                            onClick={() => setActiveTab('roster')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${activeTab === 'roster' ? 'bg-white text-indigo-600 shadow-[0_2px_10px_rgba(79,70,229,0.15)]' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <ListChecks className="w-4 h-4" /> Roster View
                        </button>
                    </div>

                    <div className="p-4 md:p-6 pb-2 min-h-[450px]">
                        {activeTab === 'scan' && (
                            <div className="flex flex-col items-center">
                                <div className="w-full max-w-sm rounded-[2rem] overflow-hidden bg-black border-[6px] border-slate-100 shadow-inner relative aspect-square">
                                    <div id="attendance-scanner-region" className="w-full h-full object-cover relative z-10" />
                                    <div className="absolute inset-x-8 inset-y-1/3 border-2 border-emerald-500 rounded-lg pointer-events-none opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.4)] z-20"></div>

                                    {scanOverlay && (
                                        <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in backdrop-blur-md transition-all ${scanOverlay.status === "PRESENT" ? "bg-emerald-600/90" : "bg-rose-600/90"
                                            }`}>
                                            {scanOverlay.status === "PRESENT" ? (
                                                <BadgeCheck className="w-20 h-20 text-white mb-4 animate-bounce" />
                                            ) : (
                                                <svg className="w-20 h-20 text-white mb-4 animate-bounce" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                            )}
                                            <h2 className="text-2xl font-black text-white leading-tight drop-shadow-md">{scanOverlay.name}</h2>
                                            <p className={`font-black uppercase tracking-widest mt-2 text-xs opacity-90 drop-shadow-sm ${scanOverlay.status === "PRESENT" ? "text-emerald-100" : "text-rose-100"}`}>
                                                {scanOverlay.status === "PRESENT" ? "Marked Present" : "Unmarked"}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <p className="mt-6 text-sm font-bold text-slate-400 text-center flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Scanner Active. Align Student ID Barcode.
                                </p>
                            </div>
                        )}

                        {activeTab === 'manual' && (
                            <div className="flex flex-col items-center justify-center pt-8">
                                <form onSubmit={handleManualSubmit} className="w-full max-w-sm flex flex-col gap-6">
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Student Roll Number</label>
                                        <input
                                            type="text"
                                            value={manualRollNo}
                                            onChange={(e) => setManualRollNo(e.target.value)}
                                            placeholder="e.g. 21IT001"
                                            autoFocus
                                            className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 focus:border-sky-500 rounded-2xl text-base md:text-lg font-bold text-slate-800 tracking-wider placeholder:text-slate-300 outline-none transition-all uppercase"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!manualRollNo.trim()}
                                        className="w-full py-4 bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-sky-200/50 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transition-all"
                                    >
                                        Mark Present [ENTER]
                                    </button>
                                </form>
                            </div>
                        )}

                        {activeTab === 'roster' && (
                            <div className="flex flex-col h-[400px]">
                                {loadingRoster ? (
                                    <div className="flex-1 flex items-center justify-center text-slate-400 font-bold animate-pulse text-xs">
                                        Loading class roster...
                                    </div>
                                ) : rosterStudents.length === 0 ? (
                                    <div className="flex-1 flex items-center justify-center text-slate-400 font-bold text-xs">
                                        No students found in this cohort.
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col min-h-0">
                                        <div className="flex justify-between items-center mb-3 px-1">
                                            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                                                {markedRolls.size} of {rosterStudents.length} Present
                                            </span>
                                            <button
                                                onClick={handleMarkAllRoster}
                                                disabled={markedRolls.size === rosterStudents.length || processingRef.current}
                                                className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors disabled:opacity-50"
                                            >
                                                Mark All Present
                                            </button>
                                        </div>
                                        <div className="flex-1 overflow-y-auto pr-2 space-y-2 pb-4">
                                            {rosterStudents.map(student => {
                                                const isPresent = markedRolls.has(student.roll_no);

                                                return (
                                                    <div key={student.id} className={`flex justify-between items-center p-3 rounded-2xl border transition-colors ${isPresent ? 'bg-emerald-50/30 border-emerald-100 hover:bg-emerald-50/50' : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50'}`}>
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs uppercase border ${isPresent ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                                                {student.name.charAt(0)}
                                                            </div>
                                                            <div className="leading-tight">
                                                                <p className={`text-sm font-bold ${isPresent ? 'text-emerald-900' : 'text-slate-800'}`}>{student.name}</p>
                                                                <p className={`text-[10px] font-bold font-mono ${isPresent ? 'text-emerald-600/70' : 'text-slate-400'}`}>{student.roll_no}</p>
                                                            </div>
                                                        </div>

                                                        {isPresent ? (
                                                            <button
                                                                onClick={() => handleMarkAttendance(student.roll_no, "MANUAL_ENTRY")}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-rose-50 text-emerald-600 hover:text-rose-600 rounded-xl text-xs font-bold border border-emerald-100 hover:border-rose-200 shadow-sm w-[114px] justify-center transition-colors hover-group"
                                                            >
                                                                <BadgeCheck className="w-4 h-4" /> Present
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleMarkAttendance(student.roll_no, "MANUAL_ENTRY")}
                                                                className="w-[114px] py-1.5 bg-white border border-indigo-100 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2"
                                                            >
                                                                Mark
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Column: Active Feed & Controls */}
            <div className="w-full lg:w-80 flex flex-col gap-6">
                {/* Live Feed */}
                <div className="neu-card p-5 rounded-3xl bg-white flex-1 flex flex-col">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center justify-between">
                        Recent Scans
                        <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[10px]">{recentScans.length}</span>
                    </h3>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                        {recentScans.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-center text-xs font-bold text-slate-300 p-6">
                                No students marked yet.<br />Scanned IDs will appear here.
                            </div>
                        ) : (
                            recentScans.map((scan, idx) => (
                                <div
                                    key={idx}
                                    className={`p-3 rounded-2xl border flex items-start gap-3 animate-slide-up bg-white ${scan.success ? 'border-emerald-100 shadow-[0_2px_8px_rgba(16,185,129,0.06)]' : 'border-rose-100 shadow-[0_2px_8px_rgba(244,63,94,0.06)]'}`}
                                >
                                    <div className={`mt-0.5 p-1.5 rounded-full ${scan.success ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                                        {scan.success ? <BadgeCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs md:text-sm font-black text-slate-800 leading-tight truncate pr-4">
                                            {scan.student_name}
                                        </p>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className={`text-[10px] font-bold ${scan.success ? 'text-slate-500' : 'text-rose-500'} font-mono uppercase tracking-wider`}>{scan.roll_number}</span>
                                            <span className="text-[10px] font-semibold text-slate-400">{scan.time}</span>
                                        </div>
                                    </div>
                                    {scan.success && (
                                        <button
                                            onClick={() => handleMarkAttendance(scan.roll_number, "MANUAL_ENTRY")}
                                            className="p-1.5 -mr-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                            title="Remove from session"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Finalize Button */}
                <button
                    onClick={handleFinalize}
                    className="neu-card w-full py-4 bg-slate-800 hover:bg-slate-900 border-none text-white font-black text-sm md:text-base rounded-3xl shadow-xl shadow-slate-300/50 transition-all flex items-center justify-center gap-2"
                >
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    Finalize Attendance
                </button>
            </div>
        </div>
    );
}

import React, { useState, useRef } from "react";
import {
    Upload,
    Download,
    FileSpreadsheet,
    AlertCircle,
    CheckCircle2,
    Loader2,
    X,
    FileText,
} from "lucide-react";
import Modal from "../common/Modal";
import { teacherService } from "../../services/teacherService";
import { useToast } from "../../hooks/useToast";

export default function TeacherImportModal({
    isOpen,
    onClose,
    onImportComplete,
}) {
    const toast = useToast();
    const fileInputRef = useRef(null);

    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
    const [importResult, setImportResult] = useState(null);

    const handleReset = () => {
        setFile(null);
        setImportResult(null);
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleClose = () => {
        if (importResult && importResult.successful > 0) {
            onImportComplete();
        }
        handleReset();
        onClose();
    };

    const handleDownloadTemplate = async () => {
        try {
            setIsDownloadingTemplate(true);
            await teacherService.downloadTemplate();
            toast.success("CSV template downloaded successfully.");
        } catch (err) {
            toast.error(err.message || "Failed to download template.");
        } finally {
            setIsDownloadingTemplate(false);
        }
    };

    const handleFileSelect = (selectedFile) => {
        if (!selectedFile) return;
        const ext = selectedFile.name.split(".").pop().toLowerCase();
        if (!["csv", "xlsx"].includes(ext)) {
            toast.error("Please upload a .csv or .xlsx file.");
            return;
        }
        if (selectedFile.size > 10 * 1024 * 1024) {
            toast.error("File size cannot exceed 10 MB.");
            return;
        }
        setFile(selectedFile);
        setImportResult(null);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error("Please select a file to upload.");
            return;
        }

        try {
            setIsUploading(true);
            const result = await teacherService.importTeachers(file);
            setImportResult(result);

            if (result.successful > 0 && result.failed === 0) {
                toast.success(`Successfully imported ${result.successful} teachers!`);
            } else if (result.successful > 0 && result.failed > 0) {
                toast.warning(
                    `Imported ${result.successful} teachers with ${result.failed} errors.`
                );
            } else {
                toast.error(`Import failed: ${result.failed} records have errors.`);
            }
        } catch (err) {
            toast.error(err.message || "Bulk import failed. Please verify the file format.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Bulk Import Teachers"
            subtitle="Upload a CSV or Excel (.xlsx) file to register teachers in batch"
            maxWidth="max-w-3xl"
        >
            {!importResult ? (
                <div className="space-y-5">
                    {/* Action Bar / Template Download */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl neu-surface border border-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl neu-icon-well text-violet-600">
                                <FileSpreadsheet className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-slate-800">
                                    Standard Import Template
                                </h4>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleDownloadTemplate}
                            disabled={isDownloadingTemplate}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-violet-700 neu-btn rounded-xl disabled:opacity-60"
                        >
                            {isDownloadingTemplate ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Download className="w-3.5 h-3.5" />
                            )}
                            Download Template
                        </button>
                    </div>

                    {/* Upload Drop Area */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${isDragging
                                ? "border-violet-500 bg-violet-50/50"
                                : file
                                    ? "border-emerald-300 bg-emerald-50/40"
                                    : "border-slate-300 hover:border-violet-400 bg-[#f8fbfe]/70"
                            }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,.xlsx"
                            className="hidden"
                            onChange={(e) => handleFileSelect(e.target.files?.[0])}
                        />

                        {file ? (
                            <div className="flex flex-col items-center">
                                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl mb-2 shadow-xs">
                                    <FileText className="w-8 h-8" />
                                </div>
                                <p className="text-sm font-bold text-slate-800">{file.name}</p>
                                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                                    {(file.size / 1024).toFixed(1)} KB • Ready to upload
                                </p>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleReset();
                                    }}
                                    className="mt-3 text-xs text-rose-500 hover:text-rose-700 font-bold inline-flex items-center gap-1"
                                >
                                    <X className="w-3.5 h-3.5" /> Remove file
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <div className="p-3.5 rounded-2xl neu-icon-well text-violet-600 mb-2">
                                    <Upload className="w-8 h-8" />
                                </div>
                                <p className="text-sm font-bold text-slate-800">
                                    Click to browse or drag and drop file here
                                </p>
                                <p className="text-xs text-slate-400 mt-1 font-medium">
                                    Supported formats: CSV, XLSX (Up to 10 MB)
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Import Guidelines */}
                    <div className="rounded-2xl bg-[#f8fbfe] border border-slate-200/60 p-4 text-xs text-slate-600 space-y-1.5 font-medium">
                        <h5 className="font-bold text-slate-800 mb-1">Important Instructions:</h5>
                        <ul className="list-disc list-inside space-y-1 text-slate-500">
                            <li><strong className="text-slate-700">employee_id</strong> supports unique alphanumeric string formats like <code className="font-bold text-violet-700">EMP001</code>.</li>
                            <li>Columns must include <strong className="text-slate-700">employee_id, name, department</strong>. Optional: email, phone, designation, status.</li>
                            <li>Existing Employee IDs will be flagged as duplicates.</li>
                            <li>Valid records will be imported safely while invalid rows will be reported.</li>
                        </ul>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            disabled={isUploading}
                            onClick={handleClose}
                            className="rounded-2xl neu-btn px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 disabled:opacity-60"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={!file || isUploading}
                            onClick={handleUpload}
                            className="inline-flex items-center gap-2 rounded-2xl neu-btn-primary px-6 py-2.5 text-xs font-extrabold disabled:opacity-50"
                        >
                            {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isUploading ? "Validating & Importing..." : "Start Import"}
                        </button>
                    </div>
                </div>
            ) : (
                /* Summary & Error Report View */
                <div className="space-y-5 animate-fade-in">
                    {/* Summary Pills */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-4 rounded-2xl neu-card text-center">
                            <span className="text-xs text-slate-400 font-bold uppercase">Total Rows</span>
                            <p className="text-2xl font-black text-slate-800 mt-0.5">
                                {importResult.total_rows}
                            </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-center">
                            <span className="text-xs text-emerald-600 font-bold flex items-center justify-center gap-1 uppercase">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Successful
                            </span>
                            <p className="text-2xl font-black text-emerald-700 mt-0.5">
                                {importResult.successful}
                            </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100 text-center">
                            <span className="text-xs text-rose-600 font-bold flex items-center justify-center gap-1 uppercase">
                                <AlertCircle className="w-3.5 h-3.5" /> Failed
                            </span>
                            <p className="text-2xl font-black text-rose-700 mt-0.5">
                                {importResult.failed}
                            </p>
                        </div>
                    </div>

                    {/* Failed Rows Detail Table */}
                    {importResult.errors && importResult.errors.length > 0 ? (
                        <div>
                            <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <AlertCircle className="w-4 h-4" /> Row Validation Errors ({importResult.errors.length})
                            </h4>
                            <div className="max-h-60 overflow-y-auto rounded-2xl border border-rose-100 bg-rose-50/20">
                                <table className="modern-table">
                                    <thead>
                                        <tr>
                                            <th>Row</th>
                                            <th>Employee ID</th>
                                            <th>Error Description</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-rose-100/60">
                                        {importResult.errors.map((err, i) => (
                                            <tr key={i} className="hover:bg-rose-50/40">
                                                <td className="font-mono font-bold">
                                                    {err.row}
                                                </td>
                                                <td className="font-mono font-bold">
                                                    {err.employee_id || "—"}
                                                </td>
                                                <td className="text-rose-700 font-medium">
                                                    {err.error}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50 text-center text-sm font-bold text-emerald-800">
                            All {importResult.successful} records were imported without any errors!
                        </div>
                    )}

                    {/* Modal Actions */}
                    <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={handleReset}
                            className="rounded-2xl neu-btn px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800"
                        >
                            Upload Another File
                        </button>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="rounded-2xl neu-btn-primary px-6 py-2.5 text-xs font-bold"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
}

import React, { useState, useEffect } from "react";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Database,
  Trash2,
  ArrowRight,
  Eye,
  Copy,
  Check,
  Search,
  X,
  FileCheck,
  RefreshCw,
  Sparkles,
  Info
} from "lucide-react";
import { NavigationTab, ResumeRecord, ExtractedTextDetails } from "../types";
import { useAuth } from "../context/AuthContext";
import {
  uploadResumeFileApi,
  deleteUserResumeApi,
  getResumeExtractedTextApi,
} from "../services/api";

interface UploadPageProps {
  setActiveTab: (tab: NavigationTab) => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({ setActiveTab }) => {
  const { user, token, userResumes, refreshUserData, resume, setResumeData, loadSampleDevResume, clearResume } = useAuth();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressStep, setUploadProgressStep] = useState<string>("");
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Text preview modal state
  const [selectedResumeForText, setSelectedResumeForText] = useState<ExtractedTextDetails | null>(null);
  const [isLoadingText, setIsLoadingText] = useState<boolean>(false);
  const [textSearchQuery, setTextSearchQuery] = useState<string>("");
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Delete modal state
  const [resumeToDelete, setResumeToDelete] = useState<ResumeRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    if (token) {
      refreshUserData();
    }
  }, [token]);

  const validateAndSetFile = (file: File) => {
    setError(null);
    setUploadSuccess(null);

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const allowedExts = ["pdf", "docx", "txt"];
    const allowedMimes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
    ];

    if (!allowedExts.includes(ext) && !allowedMimes.includes(file.type)) {
      setError(`Invalid file type (.${ext}). Only PDF and DOCX files are allowed.`);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds maximum limit of 10MB. Please select a smaller file.");
      return;
    }

    setSelectedFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;

    if (!token) {
      setError("Authentication required to upload resume. Please log in first.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadSuccess(null);
    setUploadProgressStep("Uploading document to secure storage...");

    try {
      setTimeout(() => {
        setUploadProgressStep("Extracting text stream and cleaning formatting...");
      }, 600);

      const result = await uploadResumeFileApi(selectedFile, token);

      setUploadSuccess(result.message || "Resume uploaded and text extracted successfully!");
      
      if (result.resume) {
        setResumeData({
          fileName: result.resume.original_filename,
          fileSize: `${(result.resume.file_size_bytes / 1024).toFixed(2)} KB`,
          uploadedAt: result.resume.uploaded_at,
          extractedText: result.extraction?.previewSnippet || "Text extracted successfully."
        });
      }

      setSelectedFile(null);
      await refreshUserData();
    } catch (err: any) {
      setError(err.message || "File upload or text extraction failed.");
    } finally {
      setIsUploading(false);
      setUploadProgressStep("");
    }
  };

  const handleViewText = async (resumeRecord: ResumeRecord) => {
    if (!token) return;
    setIsLoadingText(true);
    setTextSearchQuery("");
    setIsCopied(false);

    try {
      const details = await getResumeExtractedTextApi(token, resumeRecord.id);
      setSelectedResumeForText(details);
    } catch (err: any) {
      setError(err.message || "Failed to load extracted text");
    } finally {
      setIsLoadingText(false);
    }
  };

  const handleCopyText = () => {
    if (!selectedResumeForText?.extracted_text) return;
    navigator.clipboard.writeText(selectedResumeForText.extracted_text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDeleteConfirm = async () => {
    if (!resumeToDelete || !token) return;
    setIsDeleting(true);
    try {
      await deleteUserResumeApi(token, resumeToDelete.id);
      if (resume?.fileName === resumeToDelete.original_filename) {
        clearResume();
      }
      setResumeToDelete(null);
      await refreshUserData();
    } catch (err: any) {
      setError(err.message || "Failed to delete resume");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredText = selectedResumeForText?.extracted_text
    ? textSearchQuery.trim()
      ? selectedResumeForText.extracted_text
          .split("\n")
          .filter((line) => line.toLowerCase().includes(textSearchQuery.toLowerCase()))
          .join("\n")
      : selectedResumeForText.extracted_text
    : "";

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Resume Upload & Processing Pipeline
          </h1>
          {token && (
            <button
              onClick={() => refreshUserData()}
              className="p-2 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              title="Refresh Resumes List"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
          Upload candidate CV or resume in PDF or DOCX format for text extraction, cleaning, and secure database storage.
        </p>
      </div>

      {/* Main Upload Area */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 space-y-4 shadow-sm">
        {error && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-lg flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 dark:hover:text-red-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {uploadSuccess && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs rounded-lg flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{uploadSuccess}</span>
            </div>
            <button onClick={() => setUploadSuccess(null)} className="text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Drag & Drop Input Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl p-8 text-center transition-colors bg-stone-50/50 dark:bg-stone-800/30 cursor-pointer"
        >
          <input
            type="file"
            id="resume-file-input"
            accept=".pdf,.docx,.txt"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="resume-file-input" className="cursor-pointer space-y-3 block">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950/80 flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                Click to browse or drag & drop candidate resume
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Supported Formats: PDF (.pdf), Word (.docx) • Max File Size: 10MB
              </p>
            </div>
          </label>
        </div>

        {/* Selected File Stage & Progress Indicator */}
        {selectedFile && (
          <div className="p-4 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {(selectedFile.size / 1024).toFixed(2)} KB • {selectedFile.type || "Document"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedFile(null)}
                  disabled={isUploading}
                  className="px-3 py-1.5 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadSubmit}
                  disabled={isUploading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      Upload & Extract Text
                    </>
                  )}
                </button>
              </div>
            </div>

            {isUploading && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] text-blue-700 dark:text-blue-300 font-medium">
                  <span>{uploadProgressStep}</span>
                  <span>50%</span>
                </div>
                <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-blue-600 h-1.5 rounded-full animate-pulse w-3/4"></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Development Data Shortcut */}
        <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div>
            <span className="block text-xs font-semibold text-stone-800 dark:text-stone-200">
              Testing Environment Shortcut
            </span>
            <span className="text-[11px] text-stone-500 dark:text-stone-400">
              Load standardized development benchmark resume for system testing.
            </span>
          </div>

          <button
            onClick={loadSampleDevResume}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-amber-500" />
            Load Sample Dev Resume
          </button>
        </div>
      </div>

      {/* Uploaded Resumes Collection */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          Processed Candidate Resumes ({userResumes.length})
        </h3>

        {userResumes.length === 0 ? (
          <div className="p-8 text-center bg-stone-50 dark:bg-stone-900 rounded-xl border border-dashed border-stone-300 dark:border-stone-800 space-y-3">
            <FileText className="w-10 h-10 text-stone-400 dark:text-stone-600 mx-auto" />
            <div>
              <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                No resumes uploaded yet
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-md mx-auto">
                Upload a PDF or DOCX resume using the upload box above to extract text, or load sample development data to test system capabilities.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3">
            {userResumes.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center justify-between hover:border-stone-300 dark:hover:border-stone-700 transition-colors shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
                        {item.original_filename}
                      </h4>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                          item.processing_status === "completed"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : item.processing_status === "failed"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {item.processing_status === "completed" ? "Extracted & Processed" : item.processing_status}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      {(item.file_size_bytes / 1024).toFixed(1)} KB • Uploaded {new Date(item.uploaded_at).toLocaleDateString()} {new Date(item.uploaded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setActiveTab("analysis")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Analyze NLP
                  </button>
                  <button
                    onClick={() => handleViewText(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                    View Text
                  </button>
                  <button
                    onClick={() => setResumeToDelete(item)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                    title="Delete Resume"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TEXT PREVIEW MODAL */}
      {selectedResumeForText && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-800/40">
              <div>
                <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Extracted Document Text
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  {selectedResumeForText.original_filename}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyText}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Text
                    </>
                  )}
                </button>
                <button
                  onClick={() => setSelectedResumeForText(null)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Stats bar & Search */}
            <div className="px-4 py-2 bg-stone-100/60 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4 text-stone-600 dark:text-stone-400">
                <span><strong>Characters:</strong> {selectedResumeForText.char_count}</span>
                <span><strong>Words:</strong> {selectedResumeForText.word_count}</span>
                <span><strong>Status:</strong> <span className="capitalize">{selectedResumeForText.processing_status}</span></span>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search inside extracted text..."
                  value={textSearchQuery}
                  onChange={(e) => setTextSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-md text-xs text-stone-800 dark:text-stone-200 focus:outline-hidden focus:border-blue-500"
                />
              </div>
            </div>

            {/* Warning info if empty or error */}
            {selectedResumeForText.processing_error && (
              <div className="m-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-lg text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>{selectedResumeForText.processing_error}</span>
              </div>
            )}

            {/* Modal Body: Text Display */}
            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs text-stone-800 dark:text-stone-200 bg-stone-50 dark:bg-stone-950/80 leading-relaxed whitespace-pre-wrap select-text">
              {filteredText || (
                <div className="text-center py-10 text-stone-400 dark:text-stone-600 font-sans">
                  No matching text found.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 bg-white dark:bg-stone-900">
              <span>Text extracted via PyMuPDF / pdf-parse & mammoth natural text processing.</span>
              <button
                onClick={() => setSelectedResumeForText(null)}
                className="px-4 py-1.5 bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-medium rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {resumeToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                Confirm Resume Deletion
              </h3>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Are you sure you want to permanently delete <strong>{resumeToDelete.original_filename}</strong>? This action will remove both the database record and the stored file.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setResumeToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete Resume"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

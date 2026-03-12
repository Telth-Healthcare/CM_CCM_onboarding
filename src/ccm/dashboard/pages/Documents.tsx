import { useState, useEffect, useRef } from "react";
import { getApplicationApi } from "../../../api/ccmonboard.api";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "notes" | "submissions" | "certificates";

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  color: string;
}

interface Submission {
  id: string;
  name: string;
  file: File | null;
  fileName: string;
  fileSize: string;
  fileType: string;
  status: "pending" | "submitted" | "approved" | "rejected";
  uploadedAt: string;
  category: string;
  fileUrl?: string;
}

interface Certificate {
  id: string;
  moduleTitle: string;
  issuedDate: string;
  status: "earned" | "locked";
  progress: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDraftKey() {
  try {
    const ccmUser   = JSON.parse(localStorage.getItem("ccm_user") || "null");
    const innerUser = ccmUser?.user ?? ccmUser;
    return innerUser?.id ? `ccm_draft_pk_${innerUser.id}` : "ccm_draft_pk";
  } catch { return "ccm_draft_pk"; }
}

const DOC_LABEL: Record<string, { name: string; category: string }> = {
  aadhar_front:           { name: "Aadhar Front",           category: "Identity Proof"          },
  aadhar_back:            { name: "Aadhar Back",            category: "Identity Proof"          },
  pan:                    { name: "PAN Card",               category: "Identity Proof"          },
  bachelor_certificate:   { name: "Bachelor Certificate",   category: "Educational Certificate" },
  master_certificate:     { name: "Master Certificate",     category: "Educational Certificate" },
  experience_certificate: { name: "Experience Certificate", category: "Other"                   },
};

// ─── Mock certificates ────────────────────────────────────────────────────────

const CERTIFICATES: Certificate[] = [
  { id: "c1", moduleTitle: "Community Care Foundations", issuedDate: "2024-11-15", status: "earned", progress: 100 },
  { id: "c2", moduleTitle: "Field Operations",           issuedDate: "",           status: "locked", progress: 33  },
  { id: "c3", moduleTitle: "Digital Tools & Platforms",  issuedDate: "",           status: "locked", progress: 0   },
];

const NOTE_COLORS = [
  "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-800",
  "bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800",
  "bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800",
  "bg-purple-50 border-purple-200 dark:bg-purple-900/10 dark:border-purple-800",
  "bg-pink-50 border-pink-200 dark:bg-pink-900/10 dark:border-pink-800",
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── NOTES TAB ───────────────────────────────────────────────────────────────

function NotesTab() {
  const [notes, setNotes] = useState<Note[]>([
    {
      id: "n1",
      title: "CCM Framework Key Points",
      content: "Remember: community-first approach. Stakeholder mapping is critical before any deployment. Always document interactions.",
      createdAt: "2024-11-10T09:00:00Z",
      updatedAt: "2024-11-10T09:00:00Z",
      color: NOTE_COLORS[0],
    },
    {
      id: "n2",
      title: "Field Checklist",
      content: "Safety kit, ID card, reporting forms, emergency contacts list, GPS device charged.",
      createdAt: "2024-11-12T14:30:00Z",
      updatedAt: "2024-11-12T14:30:00Z",
      color: NOTE_COLORS[1],
    },
  ]);

  const [showForm,      setShowForm]      = useState(false);
  const [editingId,     setEditingId]     = useState<string | null>(null);
  const [formTitle,     setFormTitle]     = useState("");
  const [formContent,   setFormContent]   = useState("");
  const [formColor,     setFormColor]     = useState(NOTE_COLORS[0]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openNew = () => {
    setEditingId(null); setFormTitle(""); setFormContent(""); setFormColor(NOTE_COLORS[0]); setShowForm(true);
  };

  const openEdit = (note: Note) => {
    setEditingId(note.id); setFormTitle(note.title); setFormContent(note.content); setFormColor(note.color); setShowForm(true);
  };

  const saveNote = () => {
    if (!formTitle.trim() && !formContent.trim()) return;
    const now = new Date().toISOString();
    if (editingId) {
      setNotes(prev => prev.map(n => n.id === editingId
        ? { ...n, title: formTitle, content: formContent, color: formColor, updatedAt: now }
        : n
      ));
    } else {
      setNotes(prev => [{
        id: `n${Date.now()}`, title: formTitle || "Untitled",
        content: formContent, color: formColor, createdAt: now, updatedAt: now,
      }, ...prev]);
    }
    setShowForm(false);
  };

  const deleteNote = (id: string) => { setNotes(prev => prev.filter(n => n.id !== id)); setDeleteConfirm(null); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">{notes.length} note{notes.length !== 1 ? "s" : ""}</p>
        <button onClick={openNew} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-xl hover:bg-brand-600 transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Note
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5 space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{editingId ? "Edit Note" : "New Note"}</h4>
          <input type="text" placeholder="Title" value={formTitle} onChange={e => setFormTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400" />
          <textarea placeholder="Write your note here..." value={formContent} onChange={e => setFormContent(e.target.value)} rows={4}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 resize-none" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Color:</span>
            {NOTE_COLORS.map(c => (
              <button key={c} onClick={() => setFormColor(c)}
                className={`w-6 h-6 rounded-full border-2 transition ${c.split(" ")[0]} ${formColor === c ? "border-gray-500 scale-110" : "border-transparent"}`} />
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition">Cancel</button>
            <button onClick={saveNote} className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition">{editingId ? "Update" : "Save"}</button>
          </div>
        </div>
      )}

      {notes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          <p className="text-sm">No notes yet. Click "New Note" to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map(note => (
            <div key={note.id} className={`rounded-2xl border p-4 flex flex-col gap-2 ${note.color}`}>
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90 line-clamp-1">{note.title}</h4>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(note)} className="p-1 rounded hover:bg-black/10 text-gray-500 dark:text-gray-400 transition">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button onClick={() => setDeleteConfirm(note.id)} className="p-1 rounded hover:bg-red-100 text-gray-500 hover:text-red-500 transition">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-4 flex-1 whitespace-pre-wrap">{note.content}</p>
              <p className="text-[10px] text-gray-400 mt-1">Updated {formatDate(note.updatedAt)}</p>
              {deleteConfirm === note.id && (
                <div className="mt-1 flex items-center gap-2 bg-white/80 dark:bg-gray-900/80 rounded-lg px-2 py-1.5">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Delete this note?</span>
                  <button onClick={() => deleteNote(note.id)} className="text-xs font-medium text-red-500 hover:underline">Yes</button>
                  <button onClick={() => setDeleteConfirm(null)} className="text-xs text-gray-400 hover:underline">No</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SUBMISSIONS TAB ──────────────────────────────────────────────────────────

const SUBMISSION_CATEGORIES = ["Identity Proof", "Address Proof", "Educational Certificate", "Medical Certificate", "Other"];

const STATUS_STYLES: Record<Submission["status"], string> = {
  pending:   "bg-yellow-50 text-yellow-600 border-yellow-200",
  submitted: "bg-blue-50 text-blue-600 border-blue-200",
  approved:  "bg-green-50 text-green-600 border-green-200",
  rejected:  "bg-red-50 text-red-600 border-red-200",
};

const STATUS_ICONS: Record<Submission["status"], React.ReactNode> = {
  pending:   <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  submitted: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>,
  approved:  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  rejected:  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
};

function FileIcon({ type }: { type: string }) {
  if (type === "PDF")   return <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-500 text-[10px] font-bold">PDF</div>;
  if (type === "Image") return <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-500 text-[10px] font-bold">IMG</div>;
  return <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 text-[10px] font-bold">{type}</div>;
}

// ── Receives data from parent Documents — no fetch here, no remount issue ──
function SubmissionsTab({ submissions, setSubmissions, loadingDocs }: {
  submissions: Submission[];
  setSubmissions: React.Dispatch<React.SetStateAction<Submission[]>>;
  loadingDocs: boolean;
}) {
  const [showUpload,     setShowUpload]     = useState(false);
  const [uploadName,     setUploadName]     = useState("");
  const [uploadCategory, setUploadCategory] = useState(SUBMISSION_CATEGORIES[0]);
  const [selectedFile,   setSelectedFile]   = useState<File | null>(null);
  const [dragOver,       setDragOver]       = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    if (!uploadName) setUploadName(file.name.replace(/\.[^.]+$/, ""));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const submitDocument = () => {
    if (!selectedFile || !uploadName.trim()) return;
    const ext = selectedFile.name.split(".").pop()?.toUpperCase() || "FILE";
    const newSub: Submission = {
      id:         `s${Date.now()}`,
      name:       uploadName,
      file:       selectedFile,
      fileName:   selectedFile.name,
      fileSize:   formatBytes(selectedFile.size),
      fileType:   ext === "PDF" ? "PDF" : ["JPG","JPEG","PNG"].includes(ext) ? "Image" : ext,
      status:     "submitted",
      uploadedAt: new Date().toISOString(),
      category:   uploadCategory,
    };
    setSubmissions(prev => [newSub, ...prev]);
    setShowUpload(false); setSelectedFile(null); setUploadName(""); setUploadCategory(SUBMISSION_CATEGORIES[0]);
  };

  if (loadingDocs) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="w-7 h-7 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {submissions.length} document{submissions.length !== 1 ? "s" : ""} submitted
        </p>
        <button onClick={() => setShowUpload(v => !v)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-xl hover:bg-brand-600 transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
          Upload Document
        </button>
      </div>

      {showUpload && (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5 space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Upload New Document</h4>
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-2 py-10 transition ${
              dragOver ? "border-brand-400 bg-brand-50 dark:bg-brand-900/10" : "border-gray-200 dark:border-gray-700 hover:border-brand-300 hover:bg-gray-50 dark:hover:bg-white/[0.02]"
            }`}
          >
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            {selectedFile
              ? <p className="text-sm font-medium text-brand-500">{selectedFile.name}</p>
              : <><p className="text-sm text-gray-500">Drag & drop or click to browse</p><p className="text-xs text-gray-400">PDF, JPG, PNG up to 10MB</p></>
            }
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="hidden"
              onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Document Name</label>
              <input type="text" placeholder="e.g. Aadhar Card" value={uploadName} onChange={e => setUploadName(e.target.value)}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Category</label>
              <select value={uploadCategory} onChange={e => setUploadCategory(e.target.value)}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30">
                {SUBMISSION_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button onClick={() => { setShowUpload(false); setSelectedFile(null); setUploadName(""); }}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition">Cancel</button>
            <button onClick={submitDocument} disabled={!selectedFile || !uploadName.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition">Submit</button>
          </div>
        </div>
      )}

      {submissions.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          <p className="text-sm">No documents submitted yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map(sub => (
            <div key={sub.id} className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] px-5 py-4 flex items-center gap-4">
              <FileIcon type={sub.fileType} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white/90 truncate">{sub.name}</p>
                  <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{sub.category}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {sub.fileName} {sub.fileSize !== "—" && `· ${sub.fileSize}`} · {formatDate(sub.uploadedAt)}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {sub.fileUrl && (
                  <a href={sub.fileUrl} target="_blank" rel="noreferrer"
                    className="text-xs font-medium text-brand-500 hover:text-brand-600 hover:underline transition">
                    View
                  </a>
                )}
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_STYLES[sub.status]}`}>
                  {STATUS_ICONS[sub.status]}
                  {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CERTIFICATES TAB ─────────────────────────────────────────────────────────

function CertificatesTab() {
  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500 dark:text-gray-400">Certificates are unlocked when you complete 100% of a module's videos.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CERTIFICATES.map(cert => (
          <div key={cert.id} className={`rounded-2xl border p-5 flex flex-col gap-4 transition ${
            cert.status === "earned" ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/10" : "border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
          }`}>
            <div className="flex items-start justify-between">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cert.status === "earned" ? "bg-green-100 dark:bg-green-900/30" : "bg-gray-100 dark:bg-gray-800"}`}>
                {cert.status === "earned"
                  ? <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                  : <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                }
              </div>
              {cert.status === "earned" && (
                <span className="text-[10px] font-semibold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">EARNED</span>
              )}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">{cert.moduleTitle}</h4>
              {cert.status === "earned"
                ? <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Issued on {formatDate(cert.issuedDate)}</p>
                : <p className="text-xs text-gray-400 mt-0.5">Complete all videos to unlock</p>
              }
            </div>
            {cert.status === "locked" && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400"><span>Progress</span><span>{cert.progress}%</span></div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${cert.progress}%` }} />
                </div>
              </div>
            )}
            {cert.status === "earned" && (
              <button className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-green-700 bg-white dark:bg-transparent border border-green-200 dark:border-green-800 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 transition">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Download Certificate
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TAB CONFIG ───────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string; icon: React.ReactNode; desc: string }[] = [
  {
    key: "notes", label: "My Notes", desc: "Personal notes & reminders",
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  },
  {
    key: "submissions", label: "Submissions", desc: "Upload & track documents",
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  },
  {
    key: "certificates", label: "Certificates", desc: "Module completion certificates",
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>,
  },
];

// ─── PAGE — fetch once here, pass down to SubmissionsTab as props ─────────────

function Documents() {
  const [activeTab,   setActiveTab]   = useState<Tab>("notes");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);   // single fetch, lives here

  // ── Runs once on mount — tab switches don't re-trigger this ──
  useEffect(() => {
    const pk = localStorage.getItem(getDraftKey());
    if (!pk) { setLoadingDocs(false); return; }

    getApplicationApi(parseInt(pk))
      .then(data => {
        const mapped: Submission[] = (data.documents ?? []).map((doc: any) => {
          const label    = DOC_LABEL[doc.document_type] ?? { name: doc.document_type, category: "Other" };
          const fileUrl  = doc.file as string;
          const ext      = fileUrl.split(".").pop()?.toUpperCase() ?? "FILE";
          const fileType = ext === "PDF" ? "PDF" : ["JPG","JPEG","PNG"].includes(ext) ? "Image" : ext;
          return {
            id:         doc.document_type,
            name:       label.name,
            file:       null,
            fileName:   fileUrl.split("/").pop() ?? fileUrl,   // filename from S3 URL
            fileSize:   "—",                                   // not in API response
            fileType,
            status:     "submitted" as const,
            uploadedAt: data.created_at,
            category:   label.category,
            fileUrl,                                           // S3 URL for View button
          };
        });
        setSubmissions(mapped);
      })
      .catch(() => {})
      .finally(() => setLoadingDocs(false));
  }, []);   // [] = once only, never re-runs on tab switch

  const active = TABS.find(t => t.key === activeTab)!;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Documents</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your notes, submitted documents, and earned certificates.</p>
      </div>

      {/* Tab toggle */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-1.5 flex gap-1">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === tab.key ? "bg-brand-500 text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.03]"
            }`}>
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Active tab label */}
      <div className="flex items-center gap-2">
        <span className={`p-1.5 rounded-lg ${activeTab === "notes" ? "bg-yellow-100 text-yellow-600" : activeTab === "submissions" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"}`}>
          {active.icon}
        </span>
        <div>
          <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">{active.label}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">{active.desc}</p>
        </div>
      </div>

      <div>
        {activeTab === "notes" && <NotesTab />}
        {activeTab === "submissions" && (
          // data + setter passed as props — SubmissionsTab never fetches itself
          <SubmissionsTab
            submissions={submissions}
            setSubmissions={setSubmissions}
            loadingDocs={loadingDocs}
          />
        )}
        {activeTab === "certificates" && <CertificatesTab />}
      </div>
    </div>
  );
}

export default Documents;
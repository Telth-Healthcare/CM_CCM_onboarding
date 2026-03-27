import { useState, useEffect, useRef } from "react";
import { getApplicationApi, reuploadDocumentApi } from "../../../../api/ccm/ccmonboard.api";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "notes" | "submissions" | "certificates";
type DocStatus = "pending" | "approved" | "rejected" | "reuploaded";

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  color: string;
}

interface Submission {
  id: number;               // real doc id from API
  docType: string;          // raw key e.g. "pan", "aadhar_front"
  name: string;             // human label
  category: string;
  fileUrl: string;          // S3 URL
  fileName: string;         // last segment of URL
  fileType: string;         // "PDF" | "Image" | ext
  status: DocStatus;        // from API: pending | approved | rejected | reuploaded
  uploadedAt: string;
  appId: number;            // shg id — needed for reupload
  uploading?: boolean;      // local flag — spinner while PATCH in-progress
  uploadError?: string;     // local flag — inline error under row
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

/** Maps one raw API doc object → Submission shape */
function mapDoc(doc: any, appId: number): Submission {
  const label    = DOC_LABEL[doc.document_type] ?? { name: doc.document_type, category: "Other" };
  const fileUrl  = doc.file as string;
  const ext      = fileUrl.split(".").pop()?.toUpperCase() ?? "FILE";
  const fileType = ext === "PDF" ? "PDF" : ["JPG","JPEG","PNG","WEBP"].includes(ext) ? "Image" : ext;
  return {
    id:         doc.id,
    docType:    doc.document_type,
    name:       label.name,
    category:   label.category,
    fileUrl,
    fileName:   fileUrl.split("/").pop() ?? fileUrl,   // last path segment of S3 URL
    fileType,
    status:     doc.status as DocStatus,               // string from API
    uploadedAt: doc.uploaded_at,
    appId,
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

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

// ─── NOTES TAB ────────────────────────────────────────────────────────────────

function NotesTab() {
  const [notes, setNotes] = useState<Note[]>([
    {
      id: "n1",
      title: "CM Framework Key Points",
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

// ─── File type icon ───────────────────────────────────────────────────────────

function FileIcon({ type }: { type: string }) {
  if (type === "PDF")   return <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-500 text-[10px] font-bold">PDF</div>;
  if (type === "Image") return <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-500 text-[10px] font-bold">IMG</div>;
  return <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 text-[10px] font-bold">{type}</div>;
}

// ─── Status badge — maps all 4 API statuses to colour + icon ─────────────────

function ApprovalBadge({ status }: { status: string }) {
  const config: Record<string, { cls: string; label: string; icon: string }> = {
    approved:   { cls: "bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:border-green-800",   label: "approved",   icon: "M5 13l4 4L19 7" },
    rejected:   { cls: "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:border-red-800",             label: "rejected",   icon: "M6 18L18 6M6 6l12 12" },
    pending:    { cls: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800",   label: "pending",    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
    reuploaded: { cls: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",        label: "reuploaded", icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" },
  }
  const c = config[status] ?? config.pending   // fallback to pending if unknown value
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${c.cls}`}>
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={c.icon} />
      </svg>
      {c.label}
    </span>
  )
}

// ─── Single document row with reupload ────────────────────────────────────────

function SubmissionRow({
  sub,
  onReupload,
}: {
  sub: Submission;
  onReupload: (docType: string, appId: number, docId: number, file: File) => void;  // docId for PATCH
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onReupload(sub.docType, sub.appId, sub.id, file);  // sub.id → PATCH correct doc
    e.target.value = "";                                          // reset so same file re-triggers
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] px-5 py-4 flex items-center gap-4">
      <FileIcon type={sub.fileType} />

      {/* Doc name + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-800 dark:text-white/90 truncate">{sub.name}</p>
          <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
            {sub.category}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
          {sub.fileName} · {formatDate(sub.uploadedAt)}
        </p>
        {/* Inline error shown if PATCH fails */}
        {sub.uploadError && (
          <p className="text-xs text-red-500 mt-1">{sub.uploadError}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
        {/* Opens S3 file in new tab */}
        <a href={sub.fileUrl} target="_blank" rel="noreferrer"
          className="text-xs font-medium text-brand-500 hover:text-brand-600 hover:underline transition">
          View
        </a>

        {/* Triggers hidden file input */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={sub.uploading}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.03] disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {sub.uploading ? (
            // Spinner while PATCH in-progress
            <>
              <span className="w-3 h-3 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Re-upload
            </>
          )}
        </button>

        {/* Hidden file input */}
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Status badge driven by doc.status from API */}
        <ApprovalBadge status={sub.status} />
      </div>
    </div>
  );
}

// ─── SUBMISSIONS TAB ──────────────────────────────────────────────────────────

function SubmissionsTab({
  submissions,
  setSubmissions,
  loadingDocs,
}: {
  submissions: Submission[];
  setSubmissions: React.Dispatch<React.SetStateAction<Submission[]>>;
  loadingDocs: boolean;
}) {

  // PATCH the specific doc — called from SubmissionRow
  const handleReupload = async (docType: string, appId: number, docId: number, file: File) => {
    // Match by id (not docType) — same docType can have multiple docs e.g. pan has ids 31,39,40
    setSubmissions(prev =>
      prev.map(s => s.id === docId ? { ...s, uploading: true, uploadError: undefined } : s)
    );

    try {
      const updated = await reuploadDocumentApi(file, docType, appId, docId);  // PATCH call

      // Patch only this row with fresh data from API response
      setSubmissions(prev =>
        prev.map(s =>
          s.id === docId
            ? {
                ...s,
                uploading:  false,
                status:     updated.status as DocStatus,               // "reuploaded" from API
                fileUrl:    updated.file,
                fileName:   updated.file.split("/").pop() ?? updated.file,
                uploadedAt: updated.uploaded_at,
              }
            : s
        )
      );
    } catch {
      // Inline error under the row
      setSubmissions(prev =>
        prev.map(s =>
          s.id === docId ? { ...s, uploading: false, uploadError: "Upload failed. Please try again." } : s
        )
      );
    }
  };

  if (loadingDocs) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="w-7 h-7 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Per-status counts for summary pills + banners
  const totalDocs      = submissions.length;
  const approvedDocs   = submissions.filter(s => s.status === "approved").length;
  const pendingDocs    = submissions.filter(s => s.status === "pending").length;
  const rejectedDocs   = submissions.filter(s => s.status === "rejected").length;
  const reuploadedDocs = submissions.filter(s => s.status === "reuploaded").length;

  return (
    <div className="space-y-5">

      {/* Header + summary pills */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {totalDocs} document{totalDocs !== 1 ? "s" : ""} submitted
        </p>
        {totalDocs > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {approvedDocs > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-600 border border-green-200">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                {approvedDocs} approved
              </span>
            )}
            {pendingDocs > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                {pendingDocs} pending
              </span>
            )}
            {rejectedDocs > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                {rejectedDocs} rejected
              </span>
            )}
            {reuploadedDocs > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                {reuploadedDocs} reuploaded
              </span>
            )}
          </div>
        )}
      </div>

      {/* rejected alert — prompts re-upload */}
      {rejectedDocs > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 px-4 py-3 flex items-start gap-3">
          <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <div>
            <p className="text-xs font-semibold text-red-700 dark:text-red-400">{rejectedDocs} Document{rejectedDocs > 1 ? "s" : ""} rejected</p>
            <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">Please re-upload the rejected documents with correct files.</p>
          </div>
        </div>
      )}

      {/* pending alert */}
      {pendingDocs > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800 px-4 py-3 flex items-start gap-3">
          <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Documents pending Review</p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
              {pendingDocs} document{pendingDocs > 1 ? "s are" : " is"} awaiting admin approval.
            </p>
          </div>
        </div>
      )}

      {/* All approved banner */}
      {totalDocs > 0 && approvedDocs === totalDocs && (
        <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800 px-4 py-3 flex items-center gap-3">
          <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs font-medium text-green-700 dark:text-green-400">All documents approved!</p>
        </div>
      )}

      {submissions.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm">No documents submitted yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map(sub => (
            <SubmissionRow key={sub.id} sub={sub} onReupload={handleReupload} />
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
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Certificates are unlocked when you complete 100% of a module's videos.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CERTIFICATES.map(cert => (
          <div key={cert.id} className={`rounded-2xl border p-5 flex flex-col gap-4 transition ${
            cert.status === "earned"
              ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/10"
              : "border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
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

// ─── PAGE ─────────────────────────────────────────────────────────────────────

function Documents() {
  const [activeTab,   setActiveTab]   = useState<Tab>("notes");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  // Fetch once on mount — tab switches never re-trigger
  useEffect(() => {
    const pk = localStorage.getItem(getDraftKey());
    if (!pk) { setLoadingDocs(false); return; }

    getApplicationApi(parseInt(pk))
      .then(data => {
        const appId = data.id as number;               // shg id passed down for reupload
        const mapped: Submission[] = (data.documents ?? []).map((doc: any) =>
          mapDoc(doc, appId)
        );
        setSubmissions(mapped);
      })
      .catch(() => {})
      .finally(() => setLoadingDocs(false));
  }, []);

  const active = TABS.find(t => t.key === activeTab)!;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Documents</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your notes, submitted documents, and earned certificates.
        </p>
      </div>

      {/* Tab toggle */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-1.5 flex gap-1">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === tab.key
                ? "bg-brand-500 text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.03]"
            }`}>
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Active tab label */}
      <div className="flex items-center gap-2">
        <span className={`p-1.5 rounded-lg ${
          activeTab === "notes"       ? "bg-yellow-100 text-yellow-600" :
          activeTab === "submissions" ? "bg-blue-100 text-blue-600"    :
                                        "bg-green-100 text-green-600"
        }`}>
          {active.icon}
        </span>
        <div>
          <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">{active.label}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">{active.desc}</p>
        </div>
      </div>

      <div>
        {activeTab === "notes"       && <NotesTab />}
        {activeTab === "submissions" && (
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
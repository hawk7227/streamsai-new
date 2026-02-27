"use client";

import { useState, useRef } from "react";

interface FileUploadProps {
  accept?: string;
  label?: string;
  onUpload: (url: string) => void;
  maxSizeMB?: number;
}

export default function FileUpload({ accept, label = "Upload File", onUpload, maxSizeMB = 100 }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > maxSizeMB * 1024 * 1024) { setError(`File too large. Max ${maxSizeMB}MB.`); return; }

    setUploading(true);
    setError(null);
    setFileName(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || `Upload failed: ${res.status}`); }
      const data = await res.json();
      setFileName(file.name);
      onUpload(data.url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
      console.error("[FileUpload] Error:", e);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input ref={fileRef} type="file" accept={accept} onChange={handleUpload} style={{ display: "none" }} />
      <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{
        padding: "8px 16px", borderRadius: 8, fontSize: "0.8rem", cursor: uploading ? "default" : "pointer",
        background: "var(--bg-tertiary)", border: "1px dashed var(--border)", color: "var(--text-secondary)",
        width: "100%", textAlign: "center", opacity: uploading ? 0.7 : 1,
      }}>
        {uploading ? "⏳ Uploading..." : fileName ? `✓ ${fileName}` : `📎 ${label}`}
      </button>
      {error && <div style={{ fontSize: "0.7rem", color: "#ef4444", marginTop: 4 }}>{error}</div>}
    </div>
  );
}

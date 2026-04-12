"use client";

import { useRef, useState } from "react";

type EvidenceFile = {
  id: string;
  originalName: string;
  mimeType?: string | null;
  extension?: string | null;
  sizeBytes?: number | null;
  uploadedAt: string;
  scanStatus: string;
};

type EvidenceData = {
  id: string;
  title: string;
  files?: EvidenceFile[];
};

type Props = {
  evidence: EvidenceData;
  uploadLabel: string;
  uploadingLabel: string;
  noFilesLabel: string;
  filesTitle: string;
  errorTitle: string;
  closeLabel: string;
  deleteLabel: string;
  deletingLabel: string;
  confirmDeleteTitle: string;
  confirmDeleteMessage: string;
  cancelLabel: string;
  refreshEvidence: () => Promise<void>;
};

export default function EvidenceFilesPanel({
  evidence,
  uploadLabel,
  uploadingLabel,
  noFilesLabel,
  filesTitle,
  errorTitle,
  closeLabel,
  deleteLabel,
  deletingLabel,
  refreshEvidence,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/evidence/${evidence.id}/files`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to upload file.");
      }

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      await refreshEvidence();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to upload file.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function deleteFile(fileId: string) {
    setDeletingFileId(fileId);
    setError(null);

    try {
        const res = await fetch(`/api/evidence/files/${fileId}`, {
        method: "DELETE",
        });

        if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to delete file.");
        }

        await refreshEvidence();
    } catch (err) {
        setError(
        err instanceof Error ? err.message : "Failed to delete file.",
        );
    } finally {
        setDeletingFileId(null);
    }
    }

  function formatBytes(value?: number | null) {
    if (!value || value <= 0) return "—";
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <>
      <div className="border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h4 className="font-medium">{filesTitle}</h4>

          <label className="border rounded px-3 py-2 cursor-pointer">
            {uploading ? uploadingLabel : uploadLabel}
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => void onFileChange(e)}
              disabled={uploading}
            />
          </label>
        </div>

        {!evidence.files || evidence.files.length === 0 ? (
          <p className="text-sm opacity-70">{noFilesLabel}</p>
        ) : (
          <ul className="space-y-2">
            {evidence.files.map((file) => (
              <li
                key={file.id}
                className="border rounded-lg p-3 flex items-center justify-between gap-4"
                >
                <div>
                    <a
                    href={`/api/evidence/files/${file.id}`}
                    className="font-medium underline"
                    >
                    {file.originalName}
                    </a>

                    <div className="text-xs opacity-70 mt-1">
                    {formatBytes(file.sizeBytes)} • {file.scanStatus} •{" "}
                    {new Date(file.uploadedAt).toLocaleString()}
                    </div>
                </div>

                <button
                    className="text-red-600 text-sm"
                    onClick={() => void deleteFile(file.id)}
                    disabled={deletingFileId === file.id}
                    type="button"
                >
                    {deletingFileId === file.id ? deletingLabel : deleteLabel}
                </button>
                </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl rounded-md border border-red-300 bg-red-50 p-4 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-red-700">
                  {errorTitle}
                </h3>
                <p className="text-sm text-red-700 whitespace-pre-wrap">{error}</p>
              </div>

              <button
                className="rounded border border-red-300 bg-white px-3 py-1 text-sm text-red-700"
                onClick={() => setError(null)}
                type="button"
              >
                {closeLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
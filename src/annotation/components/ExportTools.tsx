import { useRef, useCallback, useState } from "react";
import type {
  AnnotationRecord,
  LanguageCode,
  ContentLabel,
} from "../../../tests/test-cases/types";

interface ExportToolsProps {
  annotations: AnnotationRecord[];
  onImport: (annotations: AnnotationRecord[]) => void;
  onClearAll: () => void;
  onStartReview: () => void;
}

export function ExportTools({
  annotations,
  onImport,
  onClearAll,
  onStartReview,
}: ExportToolsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const downloadFile = useCallback(
    (content: string, filename: string, type: string) => {
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
    [],
  );

  const handleExportJSON = useCallback(() => {
    const content = JSON.stringify(annotations, null, 2);
    downloadFile(
      content,
      `josan-annotations-${Date.now()}.json`,
      "application/json",
    );
  }, [annotations, downloadFile]);

  const handleExportJSONL = useCallback(() => {
    const lines = annotations.map((a) =>
      JSON.stringify({
        messages: [
          {
            role: "system",
            content: `You are a content moderator for ${
              a.language === "tl"
                ? "Tagalog"
                : a.language === "bis"
                  ? "Bisaya"
                  : "English"
            } text. Classify as CLEAN, MILD, or TOXIC.`,
          },
          {
            role: "user",
            content: `Classify this text: "${a.text}"`,
          },
          {
            role: "assistant",
            content: a.label.toUpperCase(),
          },
        ],
      }),
    );
    downloadFile(
      lines.join("\n"),
      `josan-training-${Date.now()}.jsonl`,
      "application/jsonl",
    );
  }, [annotations, downloadFile]);

  const handleExportSplit = useCallback(() => {
    // Shuffle annotations
    const shuffled = [...annotations].sort(() => Math.random() - 0.5);

    // 80/20 split
    const splitIndex = Math.floor(shuffled.length * 0.8);
    const train = shuffled.slice(0, splitIndex);
    const validation = shuffled.slice(splitIndex);

    const formatJSONL = (items: AnnotationRecord[]) =>
      items
        .map((a) =>
          JSON.stringify({
            messages: [
              {
                role: "system",
                content: `You are a content moderator for ${
                  a.language === "tl"
                    ? "Tagalog"
                    : a.language === "bis"
                      ? "Bisaya"
                      : "English"
                } text. Classify as CLEAN, MILD, or TOXIC.`,
              },
              {
                role: "user",
                content: `Classify this text: "${a.text}"`,
              },
              {
                role: "assistant",
                content: a.label.toUpperCase(),
              },
            ],
          }),
        )
        .join("\n");

    downloadFile(
      formatJSONL(train),
      `josan-train-${Date.now()}.jsonl`,
      "application/jsonl",
    );
    downloadFile(
      formatJSONL(validation),
      `josan-validation-${Date.now()}.jsonl`,
      "application/jsonl",
    );
  }, [annotations, downloadFile]);

  const handleImport = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsImporting(true);
      setImportStatus("Reading file...");

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          setImportStatus("Parsing data...");

          if (file.name.endsWith(".json")) {
            const data = JSON.parse(content);
            // Handle both array and wrapped formats
            const records = Array.isArray(data)
              ? data
              : data.annotations || data.data || [];

            // Validate and normalize each record
            const validRecords: AnnotationRecord[] = records
              .map((item: Record<string, unknown>, idx: number) => ({
                id: String(item.id || `imported-${idx}`),
                text: String(item.text || ""),
                label: String(
                  item.label || "clean",
                ).toLowerCase() as ContentLabel,
                language: String(
                  item.language || "tl",
                ).toLowerCase() as LanguageCode,
                category: String(item.category || "general"),
                source:
                  (item.source as AnnotationRecord["source"]) ||
                  "existing-dataset",
                annotatorId: String(item.annotatorId || "import"),
                confidence: Number(item.confidence) || 0.9,
                metadata: {
                  createdAt: String(
                    (item.metadata as Record<string, unknown>)?.createdAt ||
                      item.createdAt ||
                      new Date().toISOString(),
                  ),
                },
              }))
              .filter((r: AnnotationRecord) => r.text.length > 0);

            setImportStatus(`Importing ${validRecords.length} annotations...`);
            onImport(validRecords);
            setImportStatus(`✅ Imported ${validRecords.length} annotations`);
            setTimeout(() => setImportStatus(null), 3000);
          } else if (file.name.endsWith(".csv")) {
            // Parse CSV from Google Forms
            const lines = content.split("\n").slice(1); // Skip header
            const imported: AnnotationRecord[] = lines
              .filter((line) => line.trim())
              .map((line) => {
                const [timestamp, text, label, language, category] = line
                  .split(",")
                  .map((s) => s.trim().replace(/^"|"$/g, ""));
                return {
                  id: crypto.randomUUID(),
                  text,
                  label: label.toLowerCase() as ContentLabel,
                  language: language.toLowerCase() as LanguageCode,
                  category: category || "general",
                  source: "google-forms" as const,
                  annotatorId: "google-forms",
                  confidence: 0.8,
                  metadata: {
                    createdAt: timestamp || new Date().toISOString(),
                  },
                };
              });
            onImport(imported);
            setImportStatus(`✅ Imported ${imported.length} annotations`);
            setTimeout(() => setImportStatus(null), 3000);
          }
        } catch (error) {
          console.error("[JoSan] Import error:", error);
          setImportStatus(
            `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
          setTimeout(() => setImportStatus(null), 5000);
        } finally {
          setIsImporting(false);
        }
      };
      reader.onerror = () => {
        setImportStatus("❌ Failed to read file");
        setIsImporting(false);
        setTimeout(() => setImportStatus(null), 5000);
      };
      reader.readAsText(file);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [onImport],
  );

  // Quick load existing dataset from public folder
  const handleLoadExistingDataset = useCallback(async () => {
    setIsImporting(true);
    setImportStatus("Loading existing dataset...");

    try {
      const response = await fetch("/data/combined_annotations.json");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      const records = Array.isArray(data) ? data : [];

      setImportStatus(`Importing ${records.length} annotations...`);
      onImport(records);
      setImportStatus(`✅ Imported ${records.length} annotations`);
      setTimeout(() => setImportStatus(null), 3000);
    } catch (error) {
      console.error("[JoSan] Load existing dataset error:", error);
      setImportStatus(
        `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setTimeout(() => setImportStatus(null), 5000);
    } finally {
      setIsImporting(false);
    }
  }, [onImport]);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
      <h3 className="text-lg font-semibold text-white">🔧 Tools</h3>

      {/* Export Buttons */}
      <div className="space-y-2">
        <p className="text-sm text-zinc-400">Export</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleExportJSON}
            disabled={annotations.length === 0}
            className="py-2 px-3 text-sm bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            📄 JSON
          </button>
          <button
            onClick={handleExportJSONL}
            disabled={annotations.length === 0}
            className="py-2 px-3 text-sm bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            📋 JSONL
          </button>
        </div>
        <button
          onClick={handleExportSplit}
          disabled={annotations.length < 10}
          className="w-full py-2 px-3 text-sm bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-600/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          📊 Export 80/20 Split (Train/Val)
        </button>
      </div>

      {/* Import */}
      <div className="space-y-2">
        <p className="text-sm text-zinc-400">Import</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.csv"
          onChange={handleImport}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
          className="w-full py-2 px-3 text-sm bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 rounded-lg transition-colors"
        >
          📥 Import JSON / CSV
        </button>
        <button
          onClick={handleLoadExistingDataset}
          disabled={isImporting}
          className="w-full py-2 px-3 text-sm bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-600/50 disabled:opacity-50 rounded-lg transition-colors"
        >
          🚀 Load Existing Dataset (2,660)
        </button>
        {importStatus && (
          <p
            className={`text-xs ${importStatus.includes("❌") ? "text-red-400" : importStatus.includes("✅") ? "text-green-400" : "text-zinc-400"}`}
          >
            {importStatus}
          </p>
        )}
      </div>

      {/* Review & Clear */}
      <div className="space-y-2 pt-2 border-t border-zinc-800">
        <button
          onClick={onStartReview}
          disabled={annotations.length < 5}
          className="w-full py-2 px-3 text-sm bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 border border-purple-600/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          🔍 Self-Review (Random 20)
        </button>
        <button
          onClick={onClearAll}
          disabled={annotations.length === 0}
          className="w-full py-2 px-3 text-sm bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          🗑️ Clear All
        </button>
      </div>
    </div>
  );
}

import type { AnnotationRecord } from "../../../tests/test-cases/types";

interface AnnotationQueueProps {
  annotations: AnnotationRecord[];
  onEdit: (annotation: AnnotationRecord) => void;
  onDelete: (id: string) => void;
  isReviewMode: boolean;
  reviewQueue: AnnotationRecord[];
  onExitReview: () => void;
}

const LABEL_COLORS: Record<string, string> = {
  clean: "bg-green-900/50 text-green-400 border-green-700",
  mild: "bg-yellow-900/50 text-yellow-400 border-yellow-700",
  toxic: "bg-red-900/50 text-red-400 border-red-700",
};

const LANGUAGE_FLAGS: Record<string, string> = {
  en: "🇺🇸",
  tl: "🇵🇭",
  bis: "🇵🇭",
  mixed: "🌐",
};

export function AnnotationQueue({
  annotations,
  onEdit,
  onDelete,
  isReviewMode,
  reviewQueue,
  onExitReview,
}: AnnotationQueueProps) {
  const displayAnnotations = isReviewMode ? reviewQueue : annotations;
  const recentAnnotations = [...displayAnnotations].reverse().slice(0, 50);

  if (recentAnnotations.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
        <p className="text-zinc-500">No annotations yet. Start adding some!</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          {isReviewMode ? "📋 Review Queue" : "📝 Recent Annotations"}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500">
            {recentAnnotations.length} of {annotations.length}
          </span>
          {isReviewMode && (
            <button
              onClick={onExitReview}
              className="px-3 py-1 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              Exit Review
            </button>
          )}
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {recentAnnotations.map((annotation) => (
          <div
            key={annotation.id}
            className="p-4 border-b border-zinc-800 last:border-b-0 hover:bg-zinc-800/50 transition-colors group"
          >
            <div className="flex items-start gap-3">
              {/* Language Flag */}
              <span className="text-xl" title={annotation.language}>
                {LANGUAGE_FLAGS[annotation.language] || "🌐"}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-zinc-100 font-mono text-sm break-words">
                  {annotation.text}
                </p>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  {/* Label Badge */}
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded border ${
                      LABEL_COLORS[annotation.label]
                    }`}
                  >
                    {annotation.label.toUpperCase()}
                  </span>

                  {/* Category Badge */}
                  <span className="px-2 py-0.5 text-xs font-medium rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                    {annotation.category}
                  </span>

                  {/* Confidence */}
                  <span className="text-xs text-zinc-500">
                    {(annotation.confidence * 100).toFixed(0)}% conf
                  </span>

                  {/* Source */}
                  <span className="text-xs text-zinc-600">
                    via {annotation.source}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onEdit(annotation)}
                  className="p-1.5 text-zinc-500 hover:text-blue-400 hover:bg-zinc-700 rounded transition-colors"
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  onClick={() => onDelete(annotation.id)}
                  className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-700 rounded transition-colors"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

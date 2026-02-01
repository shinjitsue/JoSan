import { useState, useEffect, useCallback } from "react";
import { TextInput } from "./components/TextInput";
import { LabelSelector } from "./components/LabelSelector";
import { AnnotationQueue } from "./components/AnnotationQueue";
import { ExportTools } from "./components/ExportTools";
import { ProgressTracker } from "./components/ProgressTracker";
import { useAnnotationStore } from "./hooks/useAnnotationStore";
import type {
  AnnotationRecord,
  ContentLabel,
  LanguageCode,
} from "../../tests/test-cases/types";

export function Annotation() {
  const {
    annotations,
    addAnnotation,
    deleteAnnotation,
    clearAll,
    importAnnotations,
    getStats,
  } = useAnnotationStore();

  const [currentText, setCurrentText] = useState("");
  const [currentLabel, setCurrentLabel] = useState<ContentLabel>("clean");
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>("tl");
  const [currentCategory, setCurrentCategory] = useState("general");
  const [currentConfidence, setCurrentConfidence] = useState(0.9);
  const [annotatorId, setAnnotatorId] = useState("");
  const [reviewQueue, setReviewQueue] = useState<AnnotationRecord[]>([]);
  const [isReviewMode, setIsReviewMode] = useState(false);

  // Load annotator ID from localStorage
  useEffect(() => {
    const savedAnnotatorId = localStorage.getItem("josan-annotator-id");
    if (savedAnnotatorId) {
      setAnnotatorId(savedAnnotatorId);
    } else {
      const newId = `annotator-${Date.now().toString(36)}`;
      localStorage.setItem("josan-annotator-id", newId);
      setAnnotatorId(newId);
    }
  }, []);

  const handleSubmit = useCallback(() => {
    if (!currentText.trim()) return;

    const newAnnotation: AnnotationRecord = {
      id: crypto.randomUUID(),
      text: currentText.trim(),
      label: currentLabel,
      language: currentLanguage,
      category: currentCategory,
      source: "manual",
      annotatorId,
      confidence: currentConfidence,
      metadata: {
        createdAt: new Date().toISOString(),
      },
    };

    addAnnotation(newAnnotation);
    setCurrentText("");
    setCurrentConfidence(0.9);
  }, [
    currentText,
    currentLabel,
    currentLanguage,
    currentCategory,
    currentConfidence,
    annotatorId,
    addAnnotation,
  ]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const handleEditAnnotation = useCallback(
    (annotation: AnnotationRecord) => {
      setCurrentText(annotation.text);
      setCurrentLabel(annotation.label);
      setCurrentLanguage(annotation.language);
      setCurrentCategory(annotation.category);
      setCurrentConfidence(annotation.confidence);
      deleteAnnotation(annotation.id);
    },
    [deleteAnnotation],
  );

  const handleStartReview = useCallback(() => {
    // Get random subset for self-review
    const shuffled = [...annotations].sort(() => Math.random() - 0.5);
    setReviewQueue(shuffled.slice(0, Math.min(20, shuffled.length)));
    setIsReviewMode(true);
  }, [annotations]);

  const stats = getStats();

  return (
    <div
      className="min-h-screen bg-zinc-950 text-zinc-100 p-6"
      onKeyDown={handleKeyDown}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            🏷️ JoSan Annotation Tool
          </h1>
          <p className="text-zinc-400">
            Create training data for Tagalog &amp; Bisaya content moderation
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Input Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Text Input */}
            <TextInput
              value={currentText}
              onChange={setCurrentText}
              placeholder="Enter text to annotate... (Ctrl+Enter to submit)"
            />

            {/* Label & Language Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LabelSelector
                value={currentLabel}
                onChange={setCurrentLabel}
                type="label"
              />
              <LabelSelector
                value={currentLanguage}
                onChange={setCurrentLanguage}
                type="language"
              />
            </div>

            {/* Category & Confidence */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">
                  Category
                </label>
                <select
                  value={currentCategory}
                  onChange={(e) => setCurrentCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="general">General</option>
                  <option value="threat">Threat</option>
                  <option value="bullying">Bullying</option>
                  <option value="insult">Insult</option>
                  <option value="hate">Hate Speech</option>
                  <option value="gaming">Gaming Context</option>
                  <option value="scunthorpe">
                    Scunthorpe (False Positive)
                  </option>
                  <option value="academic">Academic/Discussion</option>
                  <option value="obfuscated">Obfuscated</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">
                  Confidence: {(currentConfidence * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="1"
                  step="0.05"
                  value={currentConfidence}
                  onChange={(e) =>
                    setCurrentConfidence(parseFloat(e.target.value))
                  }
                  className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!currentText.trim()}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              Add Annotation (Ctrl+Enter)
            </button>

            {/* Annotation Queue */}
            <AnnotationQueue
              annotations={annotations}
              onEdit={handleEditAnnotation}
              onDelete={deleteAnnotation}
              isReviewMode={isReviewMode}
              reviewQueue={reviewQueue}
              onExitReview={() => setIsReviewMode(false)}
            />
          </div>

          {/* Right Column: Stats & Export */}
          <div className="space-y-6">
            <ProgressTracker stats={stats} />

            <ExportTools
              annotations={annotations}
              onImport={importAnnotations}
              onClearAll={clearAll}
              onStartReview={handleStartReview}
            />

            {/* Annotator Info */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <h3 className="text-sm font-medium text-zinc-300 mb-2">
                Annotator ID
              </h3>
              <code className="text-xs text-zinc-500 break-all">
                {annotatorId}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

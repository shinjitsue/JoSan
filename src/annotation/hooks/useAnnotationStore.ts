import { useState, useEffect, useCallback } from "react";
import type {
  AnnotationRecord,
  ContentLabel,
  LanguageCode,
  AnnotationSource,
} from "../../../tests/test-cases/types";

const STORAGE_KEY = "josan-annotations";

interface AnnotationStats {
  total: number;
  byLanguage: Record<LanguageCode, number>;
  byLabel: Record<ContentLabel, number>;
  bySource: Record<AnnotationSource, number>;
  byCategory: Record<string, number>;
}

export function useAnnotationStore() {
  const [annotations, setAnnotations] = useState<AnnotationRecord[]>([]);

  // Load annotations from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AnnotationRecord[];
        setAnnotations(parsed);
      }
    } catch (error) {
      console.error("[JoSan Annotation] Error loading annotations:", error);
    }
  }, []);

  // Save annotations to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(annotations));
    } catch (error) {
      console.error("[JoSan Annotation] Error saving annotations:", error);
    }
  }, [annotations]);

  const addAnnotation = useCallback((annotation: AnnotationRecord) => {
    setAnnotations((prev) => [...prev, annotation]);
  }, []);

  const updateAnnotation = useCallback(
    (id: string, updates: Partial<AnnotationRecord>) => {
      setAnnotations((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                ...updates,
                metadata: {
                  ...a.metadata,
                  updatedAt: new Date().toISOString(),
                },
              }
            : a,
        ),
      );
    },
    [],
  );

  const deleteAnnotation = useCallback((id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    if (
      window.confirm(
        "Are you sure you want to delete all annotations? This cannot be undone.",
      )
    ) {
      setAnnotations([]);
    }
  }, []);

  const importAnnotations = useCallback(
    (newAnnotations: AnnotationRecord[]) => {
      setAnnotations((prev) => {
        // Deduplicate by text content
        const existingTexts = new Set(
          prev.map((a) => a.text.toLowerCase().trim()),
        );
        const uniqueNew = newAnnotations.filter(
          (a) => !existingTexts.has(a.text.toLowerCase().trim()),
        );
        return [...prev, ...uniqueNew];
      });
    },
    [],
  );

  const getStats = useCallback((): AnnotationStats => {
    const stats: AnnotationStats = {
      total: annotations.length,
      byLanguage: { en: 0, tl: 0, bis: 0, mixed: 0 },
      byLabel: { clean: 0, mild: 0, toxic: 0 },
      bySource: {
        manual: 0,
        "google-forms": 0,
        "existing-dataset": 0,
        synthetic: 0,
      },
      byCategory: {},
    };

    annotations.forEach((a) => {
      stats.byLanguage[a.language] = (stats.byLanguage[a.language] || 0) + 1;
      stats.byLabel[a.label] = (stats.byLabel[a.label] || 0) + 1;
      stats.bySource[a.source] = (stats.bySource[a.source] || 0) + 1;
      stats.byCategory[a.category] = (stats.byCategory[a.category] || 0) + 1;
    });

    return stats;
  }, [annotations]);

  const exportToJSON = useCallback(() => {
    return JSON.stringify(annotations, null, 2);
  }, [annotations]);

  const exportToJSONL = useCallback(() => {
    return annotations
      .map((a) =>
        JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are a content moderator for ${a.language === "tl" ? "Tagalog" : a.language === "bis" ? "Bisaya" : "English"} text. Classify as CLEAN, MILD, or TOXIC.`,
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
  }, [annotations]);

  return {
    annotations,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    clearAll,
    importAnnotations,
    getStats,
    exportToJSON,
    exportToJSONL,
  };
}

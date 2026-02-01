import type {
  LanguageCode,
  ContentLabel,
  AnnotationSource,
} from "../../../tests/test-cases/types";

interface AnnotationStats {
  total: number;
  byLanguage: Record<LanguageCode, number>;
  byLabel: Record<ContentLabel, number>;
  bySource: Record<AnnotationSource, number>;
  byCategory: Record<string, number>;
}

interface ProgressTrackerProps {
  stats: AnnotationStats;
}

const TARGET_TOTAL = 5000;
const TARGET_BY_LANGUAGE: Record<LanguageCode, number> = {
  en: 500,
  tl: 2000,
  bis: 2000,
  mixed: 500,
};

export function ProgressTracker({ stats }: ProgressTrackerProps) {
  const overallProgress = Math.min((stats.total / TARGET_TOTAL) * 100, 100);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        📊 Progress
      </h3>

      {/* Overall Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">Overall</span>
          <span className="text-zinc-300 font-medium">
            {stats.total.toLocaleString()} / {TARGET_TOTAL.toLocaleString()}
          </span>
        </div>
        <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <p className="text-xs text-zinc-500 text-right">
          {overallProgress.toFixed(1)}% complete
        </p>
      </div>

      {/* By Language */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-zinc-300">By Language</h4>
        {(Object.entries(TARGET_BY_LANGUAGE) as [LanguageCode, number][]).map(
          ([lang, target]) => {
            const count = stats.byLanguage[lang] || 0;
            const progress = Math.min((count / target) * 100, 100);
            const flag = lang === "en" ? "🇺🇸" : lang === "mixed" ? "🌐" : "🇵🇭";
            const name =
              lang === "en"
                ? "English"
                : lang === "tl"
                  ? "Tagalog"
                  : lang === "bis"
                    ? "Bisaya"
                    : "Mixed";

            return (
              <div key={lang} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">
                    {flag} {name}
                  </span>
                  <span className="text-zinc-500">
                    {count} / {target}
                  </span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      progress >= 100
                        ? "bg-green-500"
                        : progress >= 50
                          ? "bg-blue-500"
                          : "bg-zinc-600"
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            );
          },
        )}
      </div>

      {/* By Label */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-zinc-300">By Label</h4>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-green-900/30 border border-green-800/50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-green-400">
              {stats.byLabel.clean || 0}
            </p>
            <p className="text-xs text-green-500">Clean</p>
          </div>
          <div className="bg-yellow-900/30 border border-yellow-800/50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-yellow-400">
              {stats.byLabel.mild || 0}
            </p>
            <p className="text-xs text-yellow-500">Mild</p>
          </div>
          <div className="bg-red-900/30 border border-red-800/50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-red-400">
              {stats.byLabel.toxic || 0}
            </p>
            <p className="text-xs text-red-500">Toxic</p>
          </div>
        </div>
      </div>

      {/* By Source */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-zinc-300">By Source</h4>
        <div className="text-xs text-zinc-500 space-y-1">
          <div className="flex justify-between">
            <span>Manual</span>
            <span>{stats.bySource.manual || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Google Forms</span>
            <span>{stats.bySource["google-forms"] || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Existing Dataset</span>
            <span>{stats.bySource["existing-dataset"] || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

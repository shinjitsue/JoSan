import type {
  ContentLabel,
  LanguageCode,
} from "../../../tests/test-cases/types";

interface LabelSelectorLabelProps {
  value: ContentLabel;
  onChange: (value: ContentLabel) => void;
  type: "label";
}

interface LabelSelectorLanguageProps {
  value: LanguageCode;
  onChange: (value: LanguageCode) => void;
  type: "language";
}

type LabelSelectorProps = LabelSelectorLabelProps | LabelSelectorLanguageProps;

const LABEL_OPTIONS: Array<{
  value: ContentLabel;
  label: string;
  color: string;
  emoji: string;
}> = [
  {
    value: "clean",
    label: "Clean",
    color: "bg-green-600 hover:bg-green-700",
    emoji: "✅",
  },
  {
    value: "mild",
    label: "Mild",
    color: "bg-yellow-600 hover:bg-yellow-700",
    emoji: "⚠️",
  },
  {
    value: "toxic",
    label: "Toxic",
    color: "bg-red-600 hover:bg-red-700",
    emoji: "🚫",
  },
];

const LANGUAGE_OPTIONS: Array<{
  value: LanguageCode;
  label: string;
  flag: string;
}> = [
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "tl", label: "Tagalog", flag: "🇵🇭" },
  { value: "bis", label: "Bisaya", flag: "🇵🇭" },
  { value: "mixed", label: "Mixed", flag: "🌐" },
];

export function LabelSelector({ value, onChange, type }: LabelSelectorProps) {
  if (type === "label") {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">
          Classification Label
        </label>
        <div className="flex gap-2">
          {LABEL_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all ${
                value === option.value
                  ? `${option.color} text-white ring-2 ring-offset-2 ring-offset-zinc-900 ring-white`
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              <span className="mr-1">{option.emoji}</span>
              {option.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-zinc-300">Language</label>
      <div className="flex gap-2">
        {LANGUAGE_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all ${
              value === option.value
                ? "bg-blue-600 text-white ring-2 ring-offset-2 ring-offset-zinc-900 ring-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            <span className="mr-1">{option.flag}</span>
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

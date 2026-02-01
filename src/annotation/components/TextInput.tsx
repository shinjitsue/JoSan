interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function TextInput({ value, onChange, placeholder }: TextInputProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-zinc-300">
        Text to Annotate
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
        autoFocus
      />
      <div className="flex justify-between text-xs text-zinc-500">
        <span>{value.length} characters</span>
        <span>{value.split(/\s+/).filter(Boolean).length} words</span>
      </div>
    </div>
  );
}

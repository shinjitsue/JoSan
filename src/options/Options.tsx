import { useState, useEffect } from "react";

// Define the settings type
interface Settings {
  enabled: boolean;
  theme: string;
  customWords: string[];
  defaultWordList: boolean;
  filterStrength: string;
}

function Options() {
  const [settings, setSettings] = useState<Settings>({
    enabled: true,
    theme: "light",
    customWords: [] as string[],
    defaultWordList: true,
    filterStrength: "medium", // low, medium, high
  });
  const [newWord, setNewWord] = useState("");
  const [saved, setSaved] = useState(false);

  // Load settings when component mounts
  useEffect(() => {
    chrome.storage.sync.get(
      {
        enabled: true,
        theme: "light",
        customWords: [],
        defaultWordList: true,
        filterStrength: "medium",
      },
      (items) => {
        // Type assertion to ensure the items match our Settings interface
        const typedSettings: Settings = {
          enabled: items.enabled as boolean,
          theme: items.theme as string,
          customWords: items.customWords as string[],
          defaultWordList: items.defaultWordList as boolean,
          filterStrength: items.filterStrength as string,
        };
        setSettings(typedSettings);
      }
    );
  }, []);

  const handleSave = () => {
    chrome.storage.sync.set(settings, () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const addCustomWord = () => {
    if (newWord && !settings.customWords.includes(newWord)) {
      setSettings({
        ...settings,
        customWords: [...settings.customWords, newWord.toLowerCase()],
      });
      setNewWord("");
    }
  };

  const removeCustomWord = (word: string) => {
    setSettings({
      ...settings,
      customWords: settings.customWords.filter((w) => w !== word),
    });
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        JoSan Profanity Filter Options
      </h1>

      <div className="space-y-6">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="enabled"
            checked={settings.enabled}
            onChange={() =>
              setSettings({ ...settings, enabled: !settings.enabled })
            }
            className="mr-2"
          />
          <label htmlFor="enabled">Enable profanity filter</label>
        </div>

        <div>
          <label className="block mb-2">Theme</label>
          <select
            value={settings.theme}
            onChange={(e) =>
              setSettings({ ...settings, theme: e.target.value })
            }
            className="w-full p-2 border rounded"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div>
          <label className="block mb-2">Filter Strength</label>
          <select
            value={settings.filterStrength}
            onChange={(e) =>
              setSettings({ ...settings, filterStrength: e.target.value })
            }
            className="w-full p-2 border rounded"
          >
            <option value="low">Low - Filter only severe profanity</option>
            <option value="medium">Medium - Standard filtering</option>
            <option value="high">High - Strict filtering</option>
          </select>
        </div>

        <div>
          <label className="block mb-2">Use default profanity list</label>
          <input
            type="checkbox"
            checked={settings.defaultWordList}
            onChange={() =>
              setSettings({
                ...settings,
                defaultWordList: !settings.defaultWordList,
              })
            }
          />
        </div>

        <div>
          <label className="block mb-2">Custom Words to Filter</label>
          <div className="flex space-x-2 mb-2">
            <input
              type="text"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              className="flex-1 p-2 border rounded"
              placeholder="Add a word to filter"
            />
            <button
              onClick={addCustomWord}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add
            </button>
          </div>
          <div className="mt-2">
            {settings.customWords.map((word) => (
              <div
                key={word}
                className="flex items-center justify-between bg-gray-100 p-2 rounded mb-1"
              >
                <span>{word}</span>
                <button
                  onClick={() => removeCustomWord(word)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Save Settings
        </button>

        {saved && (
          <div className="text-green-500 mt-2">
            Settings saved successfully!
          </div>
        )}
      </div>
    </div>
  );
}

export default Options;

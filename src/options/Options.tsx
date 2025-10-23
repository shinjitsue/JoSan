import { useState, useEffect } from "react";

interface Settings {
  enabled: boolean;
  theme: string;
  customWords: string[];
  filterFeedsOnly: boolean;
  enabledPlatforms: string[];
}

function Options() {
  const [settings, setSettings] = useState<Settings>({
    enabled: true,
    theme: "light",
    customWords: [],
    filterFeedsOnly: true,
    enabledPlatforms: [
      "facebook",
      "twitter",
      "instagram",
      "reddit",
      "linkedin",
      "tiktok",
      "youtube",
      "pinterest",
      "tumblr",
      "quora",
    ],
  });
  const [newWord, setNewWord] = useState("");
  const [saved, setSaved] = useState(false);

  // Load settings when component mounts
  useEffect(() => {
    chrome.storage.local.get(
      {
        enabled: true,
        theme: "light",
        customWords: [],
        filterFeedsOnly: true,
        enabledPlatforms: [
          "facebook",
          "twitter",
          "instagram",
          "reddit",
          "linkedin",
          "tiktok",
          "youtube",
          "pinterest",
          "tumblr",
          "quora",
        ],
      },
      (items) => {
        const typedSettings: Settings = {
          enabled: items.enabled as boolean,
          theme: items.theme as string,
          customWords: items.customWords as string[],
          filterFeedsOnly: items.filterFeedsOnly as boolean,
          enabledPlatforms: items.enabledPlatforms as string[],
        };
        setSettings(typedSettings);
      }
    );
  }, []);

  const handleSave = () => {
    chrome.storage.local.set(settings, () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);

      // Notify user to reload tabs
      console.log("[JoSan] Settings saved. Please reload affected tabs.");
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
          <label className="block mb-2">Custom Words to Filter</label>
          <div className="flex space-x-2 mb-2">
            <input
              type="text"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addCustomWord()}
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
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
            <p className="text-green-700 font-medium">
              ✓ Settings saved successfully!
            </p>
            <p className="text-sm text-green-600 mt-1">
              Please reload social media tabs for changes to take effect.
            </p>
          </div>
        )}
      </div>

      <h1 className="text-2xl font-bold mb-6 mt-8">JoSan Privacy & Security</h1>

      <div className="space-y-6">
        {/* Privacy Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">🔒 Privacy First</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Filters only public social media feeds</li>
            <li>✓ Never accesses private messages or DMs</li>
            <li>✓ All processing happens locally on your device</li>
            <li>✓ No data sent to external servers</li>
          </ul>
        </div>

        {/* Filter Scope */}
        <div className="border rounded-lg p-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.filterFeedsOnly}
              onChange={() =>
                setSettings({
                  ...settings,
                  filterFeedsOnly: !settings.filterFeedsOnly,
                })
              }
              className="mr-2"
            />
            <span className="font-medium">Filter Feeds Only (Recommended)</span>
          </label>
          <p className="text-sm text-gray-600 mt-2">
            When enabled, JoSan will only filter public social media feeds and
            timelines, excluding private messages, input fields, and personal
            content.
          </p>
        </div>

        {/* Platform Selection */}
        <div>
          <h3 className="font-medium mb-3">Active on Platforms:</h3>
          <p className="text-sm text-gray-600 mb-3">
            Select which social media platforms should have profanity filtering
            enabled. Disabled platforms will not be filtered.
          </p>
          <div className="space-y-2">
            {[
              "facebook",
              "twitter",
              "instagram",
              "reddit",
              "linkedin",
              "tiktok",
              "youtube",
              "tumblr",
              "quora",
              "threads",
              "discord",
              "bluesky",
            ].map((platform) => (
              <label key={platform} className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.enabledPlatforms.includes(platform)}
                  onChange={(e) => {
                    const newPlatforms = e.target.checked
                      ? [...settings.enabledPlatforms, platform]
                      : settings.enabledPlatforms.filter((p) => p !== platform);
                    setSettings({
                      ...settings,
                      enabledPlatforms: newPlatforms,
                    });
                  }}
                  className="mr-2"
                />
                <span className="capitalize">{platform}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Options;

import { useState, useEffect } from "react";
import { GroqService } from "../content/utils/GroqService";
import UsageDashboard from "./components/UsageDashboard";

interface Settings {
  enabled: boolean;
  theme: string;
  customWords: string[];
  filterFeedsOnly: boolean;
  enabledPlatforms: string[];
  useAI: boolean;
  filterMild: boolean;
  filterToxic: boolean;
  groqApiKey: string;
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
    useAI: false,
    filterMild: false,
    filterToxic: true,
    groqApiKey: "",
  });
  const [newWord, setNewWord] = useState("");
  const [saved, setSaved] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<
    "unchecked" | "validating" | "valid" | "invalid"
  >("unchecked");

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
        useAI: false,
        filterMild: false,
        filterToxic: true,
        groqApiKey: "",
      },
      (items) => {
        setSettings(items as Settings);
      }
    );
  }, []);

  const validateApiKey = async () => {
    if (!settings.groqApiKey) {
      setApiKeyStatus("invalid");
      return;
    }

    setApiKeyStatus("validating");
    GroqService.setApiKey(settings.groqApiKey);

    const isValid = await GroqService.validateApiKey();
    setApiKeyStatus(isValid ? "valid" : "invalid");

    if (isValid) {
      setTimeout(() => setApiKeyStatus("unchecked"), 3000);
    }
  };

  const handleSave = () => {
    chrome.storage.local.set(settings, () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
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
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        JoSan Profanity Filter Options
      </h1>

      <div className="space-y-6">
        {/* Basic Settings */}
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

        {/* AI-Powered Filtering Section */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <span className="mr-2">🤖</span>
            AI-Powered Context Analysis
          </h2>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="useAI"
                checked={settings.useAI}
                onChange={() =>
                  setSettings({ ...settings, useAI: !settings.useAI })
                }
                className="mr-2"
              />
              <label htmlFor="useAI" className="font-medium">
                Enable AI Double-Check (Llama-3.1 8B via Groq)
              </label>
            </div>

            <p className="text-sm text-gray-600 bg-white/50 p-3 rounded">
              When enabled, suspicious content flagged by regex will be sent to
              Groq's AI model for context-aware analysis to determine if it's
              harassment, insult, or hate speech.
            </p>

            {settings.useAI && (
              <>
                {/* API Key Input with Validation */}
                <div className="bg-white p-4 rounded border">
                  <label className="block mb-2 font-medium">
                    Groq API Key <span className="text-red-500">*</span>
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={settings.groqApiKey}
                      onChange={(e) => {
                        setSettings({
                          ...settings,
                          groqApiKey: e.target.value,
                        });
                        setApiKeyStatus("unchecked");
                      }}
                      className="flex-1 p-2 border rounded font-mono text-sm"
                      placeholder="gsk_..."
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
                    >
                      {showApiKey ? "Hide" : "Show"}
                    </button>
                    <button
                      onClick={validateApiKey}
                      disabled={apiKeyStatus === "validating"}
                      className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                    >
                      {apiKeyStatus === "validating"
                        ? "Checking..."
                        : "Validate"}
                    </button>
                  </div>

                  {/* API Key Status */}
                  {apiKeyStatus === "valid" && (
                    <div className="mt-2 text-sm text-green-600 flex items-center">
                      <span className="mr-2">✓</span>
                      API key is valid
                    </div>
                  )}
                  {apiKeyStatus === "invalid" && (
                    <div className="mt-2 text-sm text-red-600 flex items-center">
                      <span className="mr-2">✗</span>
                      Invalid API key or network error
                    </div>
                  )}

                  <p className="text-xs text-gray-500 mt-2">
                    Get your free API key at{" "}
                    <a
                      href="https://console.groq.com/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      console.groq.com/keys
                    </a>
                  </p>

                  {/* Privacy Notice */}
                  <div className="mt-3 p-3 bg-blue-50 rounded text-xs">
                    <p className="font-medium text-blue-900 mb-1">
                      🔒 Your API Key is Safe
                    </p>
                    <ul className="text-blue-700 space-y-1">
                      <li>• Stored locally in your browser only</li>
                      <li>• Never sent to JoSan servers</li>
                      <li>• Only you have access to your key</li>
                      <li>• Direct communication with Groq API</li>
                    </ul>
                  </div>
                </div>

                {/* Filter Severity Levels */}
                <div className="bg-white p-4 rounded border">
                  <h3 className="font-medium mb-3">
                    Filter These AI Classifications:
                  </h3>

                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.filterToxic}
                        onChange={() =>
                          setSettings({
                            ...settings,
                            filterToxic: !settings.filterToxic,
                          })
                        }
                        className="mr-2"
                      />
                      <span className="flex items-center">
                        <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                        <strong>Toxic</strong>
                        <span className="text-sm text-gray-600 ml-2">
                          - Harassment, insults, hate speech
                        </span>
                      </span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.filterMild}
                        onChange={() =>
                          setSettings({
                            ...settings,
                            filterMild: !settings.filterMild,
                          })
                        }
                        className="mr-2"
                      />
                      <span className="flex items-center">
                        <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                        <strong>Mild</strong>
                        <span className="text-sm text-gray-600 ml-2">
                          - Emotional, frustrated, but not abusive
                        </span>
                      </span>
                    </label>

                    <div className="flex items-center text-gray-500 mt-2">
                      <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                      <strong>Clean</strong>
                      <span className="text-sm ml-2">
                        - Harmless content (never filtered)
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 🆕 Usage Dashboard - Show only when AI is enabled */}
        {settings.useAI && settings.groqApiKey && <UsageDashboard />}

        {/* Theme */}
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

        {/* Custom Words */}
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

        {/* Save Button */}
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

      {/* Privacy Section (existing code) */}
      <h1 className="text-2xl font-bold mb-6 mt-8">JoSan Privacy & Security</h1>

      <div className="space-y-6">
        {/* Privacy Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">🔒 Privacy First</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Filters only public social media feeds</li>
            <li>✓ Never accesses private messages or DMs</li>
            <li>✓ AI only checks flagged content (not everything)</li>
            <li>✓ Your API key is stored locally in your browser</li>
            <li>✓ No data sent to JoSan servers (direct Groq API calls)</li>
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

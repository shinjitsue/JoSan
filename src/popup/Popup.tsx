import { useState, useEffect } from "react";

function Popup() {
  const [isEnabled, setIsEnabled] = useState(true);
  const [stats, setStats] = useState({
    blockedWords: 0,
    pagesScanned: 0,
    lastScan: "",
  });
  const [filterStrength, setFilterStrength] = useState("medium");

  // Load settings when component mounts
  useEffect(() => {
    chrome.storage.sync.get(
      {
        enabled: true,
        filterStrength: "medium",
        stats: { blockedWords: 0, pagesScanned: 0, lastScan: "" },
      },
      (items) => {
        setIsEnabled(items.enabled);
        setFilterStrength(items.filterStrength);
        if (items.stats) setStats(items.stats);
      }
    );
  }, []);

  // Toggle filter state
  const toggleFilter = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    chrome.storage.sync.set({ enabled: newState });

    // Send message to content script to update filter state
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "updateFilterState",
          enabled: newState,
        });
      }
    });
  };

  // Change filter strength
  const handleStrengthChange = (strength: string) => {
    setFilterStrength(strength);
    chrome.storage.sync.set({ filterStrength: strength });

    // Send message to content script to update filter strength
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "updateFilterStrength",
          strength: strength,
        });
      }
    });
  };

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  // Get appropriate badge color based on filter strength
  const getStrengthBadgeColor = (strength: string) => {
    switch (strength) {
      case "low":
        return "bg-blue-500";
      case "medium":
        return "bg-yellow-500";
      case "high":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="w-80 p-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold flex items-center">
            JoSan Filter
            <span
              className={`ml-2 w-2 h-2 rounded-full ${getStrengthBadgeColor(
                filterStrength
              )}`}
            ></span>
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Advanced profanity filtering
          </p>
        </div>
        <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full">
          <input
            type="checkbox"
            id="toggle"
            className="absolute w-6 h-6 opacity-0 cursor-pointer"
            checked={isEnabled}
            onChange={toggleFilter}
          />
          <label
            htmlFor="toggle"
            className={`block h-6 overflow-hidden rounded-full cursor-pointer transition-colors duration-300 ease-in-out ${
              isEnabled ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`block h-6 w-6 rounded-full bg-white shadow-md transform transition-transform duration-300 ease-in-out ${
                isEnabled ? "translate-x-6" : "translate-x-0"
              }`}
            ></span>
          </label>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-700 my-3"></div>

      {/* Filter Strength */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 flex items-center">
          Filter Strength
          <span
            className={`ml-2 px-2 py-1 rounded-full text-xs text-white ${getStrengthBadgeColor(
              filterStrength
            )}`}
          >
            {filterStrength.toUpperCase()}
          </span>
        </label>
        <div className="flex space-x-2">
          {["low", "medium", "high"].map((strength) => (
            <button
              key={strength}
              onClick={() => handleStrengthChange(strength)}
              className={`px-3 py-1.5 rounded capitalize text-sm focus:outline-none transition-colors flex items-center ${
                filterStrength === strength
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-2 border-blue-500"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full mr-2 ${getStrengthBadgeColor(
                  strength
                )}`}
              ></span>
              {strength}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
        <h2 className="text-sm font-medium mb-2">Filter Statistics</h2>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white dark:bg-gray-800 p-2 rounded">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Words Blocked
            </div>
            <div className="text-lg font-semibold">{stats.blockedWords}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-2 rounded">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Pages Scanned
            </div>
            <div className="text-lg font-semibold">{stats.pagesScanned}</div>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {stats.lastScan ? `Last scan: ${stats.lastScan}` : "No recent scans"}
        </div>
      </div>

      {/* Active Status */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm">Filter Status:</span>
        <div className="flex items-center">
          <span
            className={`inline-block w-2 h-2 rounded-full mr-2 ${
              isEnabled ? "bg-green-500" : "bg-red-500"
            }`}
          ></span>
          <span className="text-sm">{isEnabled ? "Active" : "Inactive"}</span>
          {isEnabled && (
            <span
              className={`ml-2 px-2 py-1 rounded-full text-xs text-white ${getStrengthBadgeColor(
                filterStrength
              )}`}
            >
              {filterStrength}
            </span>
          )}
        </div>
      </div>

      {/* Settings Button */}
      <button
        onClick={openOptions}
        className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition duration-200 flex items-center justify-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        Advanced Settings
      </button>
    </div>
  );
}

export default Popup;

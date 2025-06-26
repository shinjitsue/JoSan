export class FilterProcessor {
  private profanityList: string[] = [];
  private isEnabled = true;
  private isInitialized = false;
  private filterStrength = "medium";
  private stats = {
    blockedWords: 0,
    pagesScanned: 0,
    lastScan: "",
  };

  constructor() {
    this.loadSettings();
  }

  async loadSettings(): Promise<void> {
    try {
      const result = await chrome.storage.sync.get({
        enabled: true,
        customWords: [] as string[],
        defaultWordList: true,
        filterStrength: "medium",
        stats: { blockedWords: 0, pagesScanned: 0, lastScan: "" },
      });

      this.isEnabled = result.enabled;
      this.filterStrength = result.filterStrength;
      this.stats = result.stats;

      // Load appropriate word list based on filter strength
      this.profanityList = result.defaultWordList
        ? [...this.getDefaultProfanityList(this.filterStrength)]
        : [];

      if (result.customWords.length > 0) {
        this.profanityList.push(...result.customWords);
      }

      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  }

  processPage(): void {
    if (!this.isEnabled || !this.isInitialized) return;

    // Update stats
    this.stats.pagesScanned += 1;
    this.stats.lastScan = new Date().toLocaleString();
    this.saveStats();

    this.processNode(document.body);
  }

  processNodes(nodes: NodeList): void {
    if (!this.isEnabled || !this.isInitialized) return;
    nodes.forEach((node) => {
      this.processNode(node);
    });
  }

  processNode(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE) {
      this.filterText(node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // Skip script, style elements
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();
      if (tagName === "script" || tagName === "style") return;

      // Process child nodes
      element.childNodes.forEach((child) => {
        this.processNode(child);
      });
    }
  }

  filterText(textNode: Node): void {
    const originalText = textNode.nodeValue || "";
    let filteredText = originalText;
    let blockedCount = 0;

    this.profanityList.forEach((word) => {
      // Case insensitive replace
      const regex = new RegExp(`\\b${this.escapeRegExp(word)}\\b`, "gi");
      const matches = originalText.match(regex);
      if (matches) {
        blockedCount += matches.length;
      }

      filteredText = filteredText.replace(regex, (match) =>
        "*".repeat(match.length)
      );
    });

    if (filteredText !== originalText) {
      textNode.nodeValue = filteredText;
      // Update stats
      this.stats.blockedWords += blockedCount;
      this.saveStats();
    }
  }

  private saveStats(): void {
    chrome.storage.sync.set({ stats: this.stats });
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private getDefaultProfanityList(strength: string): string[] {
    // Base list for all strengths
    const baseList = ["shit", "fuck", "damn", "bitch", "crap", "ass"];

    // Add more words based on filter strength
    if (strength === "medium") {
      return [
        ...baseList,
        "bastard",
        "hell",
        "piss",
        "whore",
        "dick",
        // Add more medium-level words
      ];
    }

    if (strength === "high") {
      return [
        ...baseList,
        "bastard",
        "hell",
        "piss",
        "whore",
        "dick",
        // Medium words included
        "bloody",
        "cunt",
        "bollocks",
        "bugger",
        "wanker",
        "pussy",
        "cock",
        // Add more high-level words
      ];
    }

    // Return base list for "low" strength
    return baseList;
  }

  // Method to update filter state dynamically
  updateFilterState(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  // Method to update filter strength dynamically
  async updateFilterStrength(strength: string): Promise<void> {
    this.filterStrength = strength;

    const result = await chrome.storage.sync.get({
      customWords: [] as string[],
      defaultWordList: true,
    });

    // Reload word list based on new strength
    if (result.defaultWordList) {
      this.profanityList = [...this.getDefaultProfanityList(strength)];
      if (result.customWords.length > 0) {
        this.profanityList.push(...result.customWords);
      }
    }

    // Re-process current page with new settings
    if (this.isEnabled) {
      this.processPage();
    }
  }
}

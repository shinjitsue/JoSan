export class FilterProcessor {
  private profanitySet: Set<string> = new Set();
  private profanityRegex: RegExp | null = null;
  private isEnabled = true;
  private isInitialized = false;
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
      // Load profanity list from external file
      const response = await fetch(chrome.runtime.getURL("data/en.txt"));
      const text = await response.text();
      const words = text
        .split("\n")
        .map((w) => w.trim().toLowerCase())
        .filter((w) => w.length > 0);

      this.profanitySet = new Set(words);

      // Load settings from storage
      const result = await chrome.storage.local.get({
        enabled: true,
        customWords: [] as string[],
        stats: { blockedWords: 0, pagesScanned: 0, lastScan: "" },
      });

      this.isEnabled = result.enabled;
      this.stats = result.stats;

      // Add custom words to the set
      if (result.customWords.length > 0) {
        result.customWords.forEach((w: string) =>
          this.profanitySet.add(w.toLowerCase())
        );
      }

      // Compile regex once for performance
      this.compileRegex();
      this.isInitialized = true;

      console.log(`Loaded ${this.profanitySet.size} profanity words`);
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  }

  private compileRegex(): void {
    if (this.profanitySet.size === 0) {
      this.profanityRegex = null;
      return;
    }

    const escapedWords = Array.from(this.profanitySet)
      .map((w) => this.escapeRegExp(w))
      .join("|");

    this.profanityRegex = new RegExp(`\\b(${escapedWords})\\b`, "gi");
  }

  processPage(): void {
    if (!this.isEnabled || !this.isInitialized) return;

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
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();
      if (tagName === "script" || tagName === "style") return;

      element.childNodes.forEach((child) => {
        this.processNode(child);
      });
    }
  }

  filterText(textNode: Node): void {
    if (!this.profanityRegex) return;

    const originalText = textNode.nodeValue || "";
    const matches = originalText.match(this.profanityRegex);

    if (matches) {
      const filteredText = originalText.replace(this.profanityRegex, (match) =>
        "*".repeat(match.length)
      );

      textNode.nodeValue = filteredText;
      this.stats.blockedWords += matches.length;
      this.saveStats();
    }
  }

  private saveStats(): void {
    chrome.storage.local.set({ stats: this.stats });
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  updateFilterState(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  async addCustomWord(word: string): Promise<void> {
    const result = await chrome.storage.local.get({ customWords: [] });
    const customWords = [...result.customWords, word];

    await chrome.storage.local.set({ customWords });
    this.profanitySet.add(word.toLowerCase());
    this.compileRegex();
  }

  async removeCustomWord(word: string): Promise<void> {
    const result = await chrome.storage.local.get({ customWords: [] });
    const customWords = result.customWords.filter((w: string) => w !== word);

    await chrome.storage.local.set({ customWords });
    this.profanitySet.delete(word.toLowerCase());
    this.compileRegex();
  }
}

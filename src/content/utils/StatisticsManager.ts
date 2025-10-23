interface Stats {
  blockedWords: number;
  pagesScanned: number;
  lastScan: string;
}

export class StatisticsManager {
  private stats: Stats = {
    blockedWords: 0,
    pagesScanned: 0,
    lastScan: "",
  };

  loadStats(stats: Stats): void {
    this.stats = stats;
  }

  incrementBlockedWords(count: number): void {
    this.stats.blockedWords += count;
    this.save();
  }

  incrementPagesScanned(): void {
    this.stats.pagesScanned += 1;
    this.stats.lastScan = new Date().toLocaleString();
    this.save();
  }

  getStats(): Stats {
    return { ...this.stats };
  }

  private save(): void {
    try {
      if (!chrome.runtime?.id) {
        console.warn(
          "[JoSan] Extension context invalidated, cannot save stats"
        );
        return;
      }
      chrome.storage.local.set({ stats: this.stats });
    } catch (error) {
      console.warn("[JoSan] Failed to save stats:", error);
    }
  }
}

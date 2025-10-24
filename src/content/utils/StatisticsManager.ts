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

  private isContextValid(): boolean {
    return !!chrome?.runtime?.id;
  }

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
    if (!this.isContextValid()) {
      console.debug("[JoSan] Context invalid - stats kept in memory only");
      return;
    }

    try {
      chrome.storage.local.set({ stats: this.stats });
    } catch (error) {
      console.warn("[JoSan] Failed to save stats:", error);
    }
  }

  async forceSave(): Promise<boolean> {
    if (!this.isContextValid()) {
      return false;
    }

    try {
      await chrome.storage.local.set({ stats: this.stats });
      return true;
    } catch (error) {
      console.error("[JoSan] Force save failed:", error);
      return false;
    }
  }
}

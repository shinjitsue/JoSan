import { PrivacyFilter } from "../utils/PrivacyFilter";
import { FastLanguageDetector } from "../utils/FastLanguageDetector";
import { FEED_SELECTORS } from "../config/SelectorConfig";

interface Language {
  code: string;
  name: string;
  confidence: number;
  scores: Record<string, number>;
}

interface FilterResult {
  filteredText: string;
  matchCount: number;
  detectedLanguages: string[];
}

interface AIProcessingResponse {
  id: string;
  action: "filter" | "keep" | "error";
  classification?: string;
  confidence?: number;
  language?: string;
  reason?: string;
}

export class DOMProcessor {
  // Tracks nodes already processed to avoid duplicate work
  private processedNodes = new WeakSet<Node>();
  private processedCount = 0;
  // Start timestamp to measure UI latency relative to enable/config load
  private startTimestamp: number | null = null;
  // Track placeholder times for AI roundtrip latency (placeholder → final)
  private placeholderTimes = new WeakMap<Node, number>();

  // Cache original text so placeholder races never lose it
  private originalTextMap = new WeakMap<Node, string>();

  // Track AI replacements so we can update them when results arrive
  private aiReplacementMap = new WeakMap<Node, HTMLElement>();

  // Filter mode: "interactive" allows reveal, "strict" blocks permanently
  private filterMode: "interactive" | "strict" = "interactive";

  // Invalidate a node (and descendants) so it can be reprocessed
  invalidate(node: Node): void {
    const walk = (n: Node) => {
      this.processedNodes.delete(n);
      n.childNodes.forEach(walk);
    };
    walk(node);
  }

  // Baseline for latency logs; set by FilterProcessor after settings load
  setStartTimestamp(ts: number): void {
    this.startTimestamp = ts;
  }

  // Set the filter mode (interactive or strict)
  setFilterMode(mode: "interactive" | "strict"): void {
    this.filterMode = mode;
  }

  processPage(
    enabledPlatforms: string[],
    currentPlatform: string,
    textProcessor: (textNode: Node) => Promise<void>
  ): void {
    if (!enabledPlatforms.includes(currentPlatform)) return;
    console.log(`[JoSan] Processing enhanced page on ${currentPlatform}...`);
    this.processFeedAreas(textProcessor);
  }

  async processNode(
    node: Node,
    textProcessor: (textNode: Node) => Promise<void>
  ): Promise<void> {
    try {
      if (this.processedNodes.has(node)) return;

      if (
        node.nodeType === Node.ELEMENT_NODE &&
        node instanceof Element &&
        node.hasAttribute("data-josan-filtered")
      ) {
        this.processedNodes.add(node);
        return;
      }

      if (node.nodeType === Node.TEXT_NODE) {
        await textProcessor(node);
        this.processedNodes.add(node);
        this.processedCount++;
        return;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        if (PrivacyFilter.isPrivateContent(node)) {
          this.processedNodes.add(node);
          return;
        }

        const children = Array.from(node.childNodes);
        for (const child of children) {
          if (!this.processedNodes.has(child)) {
            await this.processNode(child, textProcessor);
          }
        }
      }

      this.processedNodes.add(node);
    } catch (error) {
      console.error("[JoSan] Error processing node:", error);
    }
  }

  private collectTextNodes(root: Node, acc: Node[] = []): Node[] {
    if (root.nodeType === Node.TEXT_NODE) {
      acc.push(root);
      return acc;
    }
    if (root instanceof Element) {
      if (
        root.hasAttribute("data-josan-filtered") ||
        PrivacyFilter.isPrivateContent(root)
      ) {
        return acc;
      }
    }
    root.childNodes.forEach((c) => this.collectTextNodes(c, acc));
    return acc;
  }

  private async processElementBatched(
    element: Element,
    textProcessor: (textNode: Node) => Promise<void>,
    batchSize = 25
  ): Promise<void> {
    const nodes = this.collectTextNodes(element).filter(
      (n) => !this.processedNodes.has(n)
    );
    for (let i = 0; i < nodes.length; i += batchSize) {
      const slice = nodes.slice(i, i + batchSize);
      await Promise.all(
        slice.map(async (n) => {
          try {
            await textProcessor(n);
            this.processedNodes.add(n);
            this.processedCount++;
          } catch (e) {
            console.warn("[JoSan] Batched node error:", e);
          }
        })
      );
    }
  }

  private async processFeedAreas(
    textProcessor: (textNode: Node) => Promise<void>
  ): Promise<void> {
    try {
      const feedElements = document.querySelectorAll(FEED_SELECTORS.join(", "));
      console.log(`[JoSan] Found ${feedElements.length} feed areas`);

      for (const element of Array.from(feedElements)) {
        if (!(element instanceof Element)) continue;
        if (this.processedNodes.has(element)) continue;
        if (PrivacyFilter.isPrivateContent(element)) continue;
        await this.processElementBatched(element, textProcessor);
        this.processedNodes.add(element);
      }
    } catch (error) {
      console.error("[JoSan] Error processing feed areas:", error);
    }
  }

  // Updated to use new FilterResult interface
  applyRegexFilter(
    textNode: Node,
    filterResult: FilterResult,
    language: Language
  ): void {
    textNode.nodeValue = filterResult.filteredText;
    const langName = FastLanguageDetector.getLanguageName(language.code);
    console.log(
      `[JoSan Bloom+Trie] Blocked ${
        filterResult.matchCount
      } word(s) in ${langName} (${filterResult.detectedLanguages.join(", ")})`
    );

    // Latency since enable for regex masking
    if (this.startTimestamp !== null) {
      const delta = performance.now() - this.startTimestamp;
      console.log(
        `[JoSan Perf] Regex UI latency since enable: ${delta.toFixed(2)}ms`
      );
    }
  }

  applyAIFilter(
    textNode: Node,
    originalText: string,
    aiResult: AIProcessingResponse,
    language: Language
  ): void {
    const level = aiResult.classification || "unknown";
    const langName =
      aiResult.language || FastLanguageDetector.getLanguageName(language.code);

    // Create replacement based on filter mode
    const replacement =
      this.filterMode === "interactive"
        ? this.createInteractiveReplacement(
            originalText,
            level,
            aiResult.reason
          )
        : this.createStrictReplacement(originalText, level);

    // Check if we previously created an element replacement for this node
    const existing = this.aiReplacementMap.get(textNode);
    if (existing && existing.parentElement) {
      // Replace the existing element with the new replacement
      existing.parentElement.replaceChild(replacement, existing);
      this.processedNodes.add(replacement);
      this.aiReplacementMap.set(textNode, replacement);
    } else if (textNode.parentElement) {
      // Replace text node with replacement
      textNode.parentElement.replaceChild(replacement, textNode);
      this.processedNodes.add(replacement);
      this.aiReplacementMap.set(textNode, replacement);
    } else {
      // Fallback when no parent - just set text
      textNode.nodeValue = this.getFilteredText(originalText, level);
    }

    console.log(
      `[JoSan AI] Content filtered: ${level} in ${langName} (confidence: ${
        aiResult.confidence?.toFixed(2) || "unknown"
      }) [Mode: ${this.filterMode}]`
    );

    // Latency metrics
    const now = performance.now();
    const phStart = this.placeholderTimes.get(textNode);
    if (phStart !== undefined) {
      const roundtrip = now - phStart;
      console.log(
        `[JoSan Perf] AI roundtrip latency (placeholder→final): ${roundtrip.toFixed(
          2
        )}ms`
      );
      this.placeholderTimes.delete(textNode);
    }
    if (this.startTimestamp !== null) {
      const delta = now - this.startTimestamp;
      console.log(
        `[JoSan Perf] AI UI latency since enable: ${delta.toFixed(2)}ms`
      );
    }
  }

  setPlaceholder(textNode: Node, language: Language): void {
    // Prevent double placeholder
    if (textNode.nodeValue?.startsWith("[Analyzing ")) return;
    const originalValue = textNode.nodeValue || "";
    this.originalTextMap.set(textNode, originalValue);
    this.placeholderTimes.set(textNode, performance.now());
    textNode.nodeValue = `[Analyzing ${FastLanguageDetector.getLanguageName(
      language.code
    )} content...]`;
  }

  restoreOriginalText(textNode: Node, originalText?: string): void {
    const stored = this.originalTextMap.get(textNode);
    textNode.nodeValue = originalText ?? stored ?? "";
    if (stored) this.originalTextMap.delete(textNode);
  }

  private getFilteredText(_text: string, level: string): string {
    if (level === "toxic") return `Harmful Content Blocked`;
    if (level === "mild") return `Inappropriate Content Filtered`;
    return `Content Filtered`;
  }

  // Get colors based on severity level
  private getLevelColors(level: string): {
    bg: string;
    border: string;
    text: string;
    hoverBg: string;
    gradient: string;
    shadow: string;
  } {
    if (level === "toxic") {
      return {
        bg: "#fef2f2",
        border: "#fecaca",
        text: "#dc2626",
        hoverBg: "#fee2e2",
        gradient: "linear-gradient(135deg, #fef2f2 0%, #fce7f3 100%)",
        shadow: "rgba(220, 38, 38, 0.15)",
      };
    }
    if (level === "mild") {
      return {
        bg: "#fffbeb",
        border: "#fde68a",
        text: "#d97706",
        hoverBg: "#fef3c7",
        gradient: "linear-gradient(135deg, #fffbeb 0%, #fef9c3 100%)",
        shadow: "rgba(217, 119, 6, 0.15)",
      };
    }
    return {
      bg: "#f3f4f6",
      border: "#e5e7eb",
      text: "#6b7280",
      hoverBg: "#e5e7eb",
      gradient: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
      shadow: "rgba(107, 114, 128, 0.15)",
    };
  }

  // Create STRICT mode replacement - just colored text, no interaction
  private createStrictReplacement(
    originalText: string,
    level: string
  ): HTMLSpanElement {
    const colors = this.getLevelColors(level);
    const filteredText = this.getFilteredText(originalText, level);

    const span = document.createElement("span");
    span.setAttribute("data-josan-filtered", level);
    span.setAttribute("data-josan-mode", "strict");
    span.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: ${colors.text};
      font-weight: 600;
      background: ${colors.gradient};
      padding: 4px 12px;
      border-radius: 8px;
      border: 1px solid ${colors.border};
      font-size: 0.875em;
      box-shadow: 0 1px 3px ${colors.shadow};
    `;

    span.textContent = filteredText;

    return span;
  }

  // Create INTERACTIVE mode replacement - users can reveal/hide content
  private createInteractiveReplacement(
    originalText: string,
    level: string,
    reason?: string
  ): HTMLSpanElement {
    const colors = this.getLevelColors(level);
    const filteredText = this.getFilteredText(originalText, level);

    // Main container
    const container = document.createElement("span");
    container.setAttribute("data-josan-filtered", level);
    container.setAttribute("data-josan-mode", "interactive");
    container.style.cssText = `
      display: inline;
      position: relative;
    `;

    // Badge element (shown when content is hidden)
    const badge = document.createElement("span");
    badge.className = "josan-badge";
    badge.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 5px 14px;
      border-radius: 20px;
      background: ${colors.gradient};
      border: 1.5px solid ${colors.border};
      color: ${colors.text};
      font-weight: 600;
      font-size: 0.85em;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 6px ${colors.shadow};
      user-select: none;
    `;

    // Text for badge
    const badgeText = document.createElement("span");
    badgeText.textContent = filteredText;
    badgeText.style.cssText = "white-space: nowrap;";

    // Eye icon button (reveal button)
    const eyeBtn = document.createElement("button");
    eyeBtn.type = "button";
    eyeBtn.setAttribute("aria-label", "Reveal content");
    eyeBtn.title = "Click to reveal content";
    eyeBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    eyeBtn.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.9);
      border: 1.5px solid ${colors.border};
      color: ${colors.text};
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      padding: 0;
      margin-left: 4px;
      flex-shrink: 0;
    `;

    badge.appendChild(badgeText);
    badge.appendChild(eyeBtn);

    // Original content element (hidden initially)
    const originalContent = document.createElement("span");
    originalContent.className = "josan-original";
    originalContent.style.cssText = `
      display: none;
      align-items: center;
      gap: 8px;
    `;

    // The actual text with styling
    const textSpan = document.createElement("span");
    textSpan.textContent = originalText;
    textSpan.style.cssText = `
      padding: 5px 12px;
      border-radius: 8px;
      background: linear-gradient(135deg, rgba(0,0,0,0.03) 0%, rgba(0,0,0,0.06) 100%);
      border: 1.5px dashed ${colors.border};
      color: inherit;
      font-style: italic;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    `;

    // Hide button with eye-off icon
    const hideBtn = document.createElement("button");
    hideBtn.type = "button";
    hideBtn.setAttribute("aria-label", "Hide content");
    hideBtn.title = "Click to hide content";
    hideBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
    hideBtn.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: ${colors.bg};
      border: 1.5px solid ${colors.border};
      color: ${colors.text};
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      padding: 0;
      flex-shrink: 0;
    `;

    originalContent.appendChild(textSpan);
    originalContent.appendChild(hideBtn);

    container.appendChild(badge);
    container.appendChild(originalContent);

    // State management
    let isRevealed = false;

    const showOriginal = () => {
      isRevealed = true;
      badge.style.cssText = `
        display: none;
        opacity: 0;
        transform: scale(0.95);
      `;
      originalContent.style.cssText = `
        display: inline-flex;
        align-items: center;
        gap: 8px;
        animation: josan-fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      `;
    };

    const showBadge = () => {
      isRevealed = false;
      originalContent.style.cssText = `
        display: none;
        opacity: 0;
        transform: scale(0.95);
      `;
      badge.style.cssText = `
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 5px 14px;
        border-radius: 20px;
        background: ${colors.gradient};
        border: 1.5px solid ${colors.border};
        color: ${colors.text};
        font-weight: 600;
        font-size: 0.85em;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 2px 6px ${colors.shadow};
        user-select: none;
        animation: josan-fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      `;
    };

    // Event handlers
    eyeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      showOriginal();
    });

    badge.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      showOriginal();
    });

    hideBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      showBadge();
    });

    // Hover effects for badge
    badge.addEventListener("mouseenter", () => {
      if (!isRevealed) {
        badge.style.transform = "translateY(-2px)";
        badge.style.boxShadow = `0 6px 16px ${colors.shadow}`;
      }
    });

    badge.addEventListener("mouseleave", () => {
      if (!isRevealed) {
        badge.style.transform = "translateY(0)";
        badge.style.boxShadow = `0 2px 6px ${colors.shadow}`;
      }
    });

    // Hover effects for buttons
    [eyeBtn, hideBtn].forEach((btn) => {
      btn.addEventListener("mouseenter", () => {
        btn.style.transform = "scale(1.15)";
        btn.style.boxShadow = `0 3px 10px ${colors.shadow}`;
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.transform = "scale(1)";
        btn.style.boxShadow = "none";
      });
    });

    // Set tooltip
    container.title = reason
      ? `Filtered: ${reason}`
      : `Content classified as ${level} - Click to reveal`;

    // Inject keyframe animation if not already present
    this.injectAnimationStyles();

    return container;
  }

  // Inject CSS animation styles into the document
  private injectAnimationStyles(): void {
    const styleId = "josan-animation-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      @keyframes josan-fade-in {
        from {
          opacity: 0;
          transform: scale(0.95) translateY(-2px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
      
      @keyframes josan-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
      
      [data-josan-filtered] {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      
      [data-josan-mode="interactive"] .josan-badge:focus-visible,
      [data-josan-mode="interactive"] button:focus-visible {
        outline: 2px solid currentColor;
        outline-offset: 2px;
      }
    `;
    document.head.appendChild(style);
  }

  getProcessedNodesCount(): number {
    return this.processedCount;
  }

  cleanup(): void {
    this.processedNodes = new WeakSet();
    this.processedCount = 0;
    this.originalTextMap = new WeakMap();
    this.placeholderTimes = new WeakMap();
    this.aiReplacementMap = new WeakMap();
    this.startTimestamp = null;
  }
}

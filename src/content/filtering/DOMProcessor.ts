import { PrivacyFilter } from "../utils/PrivacyFilter";
import { FastLanguageDetector } from "../utils/FastLanguageDetector";
import { FEED_SELECTORS } from "../config/SelectorConfig";

interface Language {
  code: string;
  name: string;
  confidence: number;
  scores: Record<string, number>;
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

  // Invalidate a node (and descendants) so it can be reprocessed
  invalidate(node: Node): void {
    const walk = (n: Node) => {
      this.processedNodes.delete(n);
      n.childNodes.forEach(walk);
    };
    walk(node);
  }

  processPage(
    enabledPlatforms: string[],
    currentPlatform: string,
    textProcessor: (textNode: Node) => Promise<void>
  ): void {
    if (!enabledPlatforms.includes(currentPlatform)) return;
    console.log(`[JoSan] Processing optimized page on ${currentPlatform}...`);
    this.processFeedAreas(textProcessor);
  }

  // Recursive traversal with async handling for text nodes
  async processNode(
    node: Node,
    textProcessor: (textNode: Node) => Promise<void>
  ): Promise<void> {
    try {
      if (this.processedNodes.has(node)) return;

      // Skip filtered wrappers
      if (
        node.nodeType === Node.ELEMENT_NODE &&
        node instanceof Element &&
        node.hasAttribute("data-josan-filtered")
      ) {
        this.processedNodes.add(node);
        return;
      }

      if (node.nodeType === Node.TEXT_NODE) {
        // Await to reduce race conditions with AI placeholder replacement
        await textProcessor(node);
        this.processedNodes.add(node);
        this.processedCount++;
        return;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        // Skip private content
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
            this.processedCount++; // count text nodes processed
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
        // Use batched processing instead of deep recursion
        await this.processElementBatched(element, textProcessor);
        this.processedNodes.add(element);
      }
    } catch (error) {
      console.error("[JoSan] Error processing feed areas:", error);
    }
  }

  applyRegexFilter(
    textNode: Node,
    regexResult: {
      filteredText: string;
      matchCount: number;
      detectedLanguages: string[];
    },
    language: Language
  ): void {
    textNode.nodeValue = regexResult.filteredText;
    const langName = FastLanguageDetector.getLanguageName(language.code);
    console.log(
      `[JoSan Regex] Blocked ${
        regexResult.matchCount
      } word(s) in ${langName} (${regexResult.detectedLanguages.join(", ")})`
    );
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

    const filteredText = this.getFilteredText(originalText, level, langName);
    const parent = textNode.parentElement;

    if (parent) {
      const span = document.createElement("span");
      span.textContent = filteredText;
      span.style.cssText = this.getFilterStyle(level);
      span.title = `Content filtered: ${aiResult.reason || level}`;
      span.setAttribute("data-josan-filtered", level);
      parent.replaceChild(span, textNode);
      this.processedNodes.add(span);
    } else {
      textNode.nodeValue = filteredText;
    }

    console.log(
      `[JoSan AI] Content filtered: ${level} in ${langName} (confidence: ${
        aiResult.confidence?.toFixed(2) || "unknown"
      })`
    );
  }

  setPlaceholder(textNode: Node, language: Language): string {
    const placeholder = `[Analyzing ${FastLanguageDetector.getLanguageName(
      language.code
    )} content...]`;
    const originalValue = textNode.nodeValue || "";
    textNode.nodeValue = placeholder;
    return originalValue;
  }

  restoreOriginalText(textNode: Node, originalText: string): void {
    textNode.nodeValue = originalText;
  }

  private getFilteredText(
    _text: string,
    level: string,
    language: string
  ): string {
    if (level === "toxic") return `[${language} Toxic Content Blocked]`;
    if (level === "mild") return `[${language} Mild Content Filtered]`;
    return `[${language} Content Filtered]`;
  }

  private getFilterStyle(level: string): string {
    if (level === "toxic") {
      return "background-color: #fee; color: #c33; padding: 2px 6px; border-radius: 4px; border: 1px solid #fcc; cursor: help; font-size: 0.875em; font-weight: 500;";
    }
    if (level === "mild") {
      return "background-color: #fff3cd; color: #856404; padding: 2px 6px; border-radius: 4px; border: 1px solid #ffeaa7; cursor: help; font-size: 0.875em;";
    }
    return "background-color: #f8f9fa; color: #6c757d; padding: 2px 6px; border-radius: 4px; border: 1px solid #dee2e6; cursor: help; font-size: 0.875em;";
  }

  getProcessedNodesCount(): number {
    return this.processedCount;
  }

  cleanup(): void {
    this.processedNodes = new WeakSet();
    this.processedCount = 0;
  }
}

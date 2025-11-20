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

export class ContentAIProxy {
  private pendingRequests = new Map<string, Node>();

  async processWithAI(
    textNode: Node,
    originalText: string,
    language: Language,
    regexMatches: number
  ): Promise<AIProcessingResponse | null> {
    const requestId = `ai_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    // Store reference for cleanup
    this.pendingRequests.set(requestId, textNode);

    try {
      // Send to background service (NO API KEY EXPOSURE)
      const aiResult = await new Promise<AIProcessingResponse>((resolve) => {
        let resolved = false;

        const handleResolve = (result: AIProcessingResponse) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            resolve(result);
          }
        };

        // Set timeout
        const timeoutId = setTimeout(() => {
          handleResolve({
            id: requestId,
            action: "error",
            reason: "AI request timeout (15s)",
          });
        }, 15000);

        try {
          chrome.runtime.sendMessage(
            {
              type: "PROCESS_AI",
              data: {
                id: requestId,
                text: originalText,
                language: language,
                regexMatches,
                timestamp: Date.now(),
              },
            },
            (response) => {
              if (chrome.runtime.lastError) {
                console.error(
                  "[JoSan] Runtime error:",
                  chrome.runtime.lastError.message
                );
                handleResolve({
                  id: requestId,
                  action: "error",
                  reason: "Extension context error",
                });
                return;
              }

              handleResolve(
                response || {
                  id: requestId,
                  action: "error",
                  reason: "No response from background",
                }
              );
            }
          );
        } catch (error) {
          console.error("[JoSan] Failed to send message:", error);
          handleResolve({
            id: requestId,
            action: "error",
            reason: "Failed to send AI request",
          });
        }
      });

      this.pendingRequests.delete(requestId);
      return aiResult;
    } catch (error) {
      console.error("[JoSan AI] Background processing error:", error);
      this.pendingRequests.delete(requestId);
      return null;
    }
  }

  cleanup(): void {
    // Cancel any pending AI requests
    this.pendingRequests.forEach((textNode, requestId) => {
      console.log(`[JoSan] Cleaning up pending AI request: ${requestId}`);
    });
    this.pendingRequests.clear();
  }

  getPendingRequestsCount(): number {
    return this.pendingRequests.size;
  }
}

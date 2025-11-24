export class FastLanguageDetector {
  // Enhanced patterns with more comprehensive word coverage
  private static readonly LANGUAGE_PATTERNS = {
    en: /\b(the|and|or|but|in|on|at|to|for|of|with|by|is|are|was|were|this|that|will|would|can|could|should|have|has|had|do|does|did|not|very|more|most|good|great|bad|make|get|take|come|go|see|know|think|say|tell|feel|look|work|try|ask|need|want|use|like|help|call|find|give|put|keep|let|turn|start|stop|play|run|walk|talk|move|live|die|eat|drink|sleep|love|hate|happy|sad|big|small|new|old|high|low|fast|slow|hot|cold|yes|no|maybe|please|thank|sorry|hello|goodbye|man|woman|boy|girl|people|person|family|friend|house|home|car|food|water|money|time|day|night|year|today|tomorrow|yesterday|from|into|over|under|through|between|about|after|before|during|while|until|since|because|although|however|therefore|actually|really|just|only|also|even|still|already|yet|again|never|always|sometimes|often|usually|probably|maybe|definitely|absolutely|completely|totally|exactly|almost|nearly|quite|rather|pretty|fairly|extremely|incredibly)\b/gi,

    tl: /\b(ang|ng|sa|na|ay|si|ni|ka|ako|ikaw|siya|kami|kayo|sila|po|opo|hindi|oo|mga|para|kung|pero|kasi|kaya|saan|ano|sino|kailan|bakit|paano|ito|iyan|iyon|dito|diyan|doon|mula|hanggang|habang|kapag|dahil|upang|nang|at|o|man|din|rin|lang|lamang|pala|nga|ba|talaga|sobra|masyado|medyo|konti|marami|lahat|walang|mayron|meron|pwede|dapat|gusto|ayaw|mahal|libre|bago|luma|malaki|maliit|maganda|pangit|mabuti|masama|mataba|payat|mataas|mababa|mabilis|mabagal|mainit|malamig|masaya|malungkot|galit|takot|antok|gutom|uhaw|pagod|sakit|galing|tama|mali|totoo|fake|alam|hindi_alam|nandito|nandoon|pumunta|umuwi|kumain|uminom|matulog|gumising|magwork|mag_aral|maglaro|manood|makinig|magsalita|tumawa|umiyak|sumigaw|tumakbo|maglakad|umupo|tumayo|humiga|magbasa|magsulat|mag_isip|mag_alala|mag_antay|salamat|pasensya|patawad|walang_anuman|sige|tara|halika|bili|bayad|libre|mahal|mura|magkano|piso|peso|tao|babae|lalaki|bata|matanda|kaibigan|pamilya|nanay|tatay|kuya|ate|bunso|lola|lolo|asawa|anak|kapatid)\b/gi,

    bis: /\b(ang|sa|og|ug|ni|si|kay|aron|ka|kung|dili|oo|bitaw|lagi|gud|man|pod|ra|nya|nila|nato|ninyo|kanila|kami|kamo|sila|ako|ikaw|siya|kini|kana|kadto|dinhi|didto|adto|gikan|padulong|samtang|human|una|sunod|karong|gahapon|ugma|karon|unya|dayon|usa|duha|tulo|upat|lima|unom|pito|walo|siyam|napulo|daghan|gamay|dako|gagmay|taas|mubo|paspas|hinay|init|bugnaw|nindot|bati|maayo|dili_maayo|bag_o|daan|gwapa|pangit|tambok|niwang|kusog|huyang|maalamon|buang|buotan|dautan|higala|kaaway|pamilya|balay|sakyanan|pagkaon|tubig|kwarta|oras|adlaw|gabii|tuig|karong_adlawa|ugma|gahapon|moadto|mouli|mokaon|mo_inom|matulog|mata|magtrabaho|mag_eskwela|magdula|motan_aw|maminaw|mosulti|mokatawa|mohilak|mosinggit|modagan|maglakaw|molingkod|motindog|mohigda|magbasa|magsulat|mag_isip|mag_alaala|maghulat|salamat|pasaylo|way_sapayan|sige|tara|halin|palit|bayad|libre|mahal|barato|pila|piso|tawo|babaye|lalaki|bata|tigulang|higala|pamilya|mama|papa|kuya|ate|manghod|lola|lolo|bana|asawa|anak|igsoon)\b/gi,
  };

  // Character frequency patterns for each language
  private static readonly CHAR_FREQUENCY = {
    en: {
      commonChars: ["e", "t", "a", "o", "i", "n", "s", "h", "r"],
      weight: 1.0,
    },
    tl: {
      commonChars: ["a", "n", "g", "i", "o", "k", "s", "t", "l"],
      weight: 1.2,
    },
    bis: {
      commonChars: ["a", "g", "n", "o", "i", "k", "u", "l", "s"],
      weight: 1.2,
    },
  };

  static detectBest(text: string): {
    code: string;
    confidence: number;
    scores: Record<string, number>;
  } {
    // Preprocess text to handle evasion techniques before detection
    const preprocessedText = this.preprocessForDetection(text);

    const textLower = preprocessedText.toLowerCase();
    const words = textLower.split(/\s+/).filter((w) => w.length > 1);
    const totalWords = Math.max(words.length, 1);

    // Calculate pattern-based scores for each language
    const scores = {
      en:
        (textLower.match(this.LANGUAGE_PATTERNS.en) || []).length / totalWords,
      tl:
        (textLower.match(this.LANGUAGE_PATTERNS.tl) || []).length / totalWords,
      bis:
        (textLower.match(this.LANGUAGE_PATTERNS.bis) || []).length / totalWords,
    };

    // Add character frequency analysis for better accuracy
    const charScores = this.analyzeCharFrequency(textLower);
    scores.en += charScores.en * 0.3;
    scores.tl += charScores.tl * 0.3;
    scores.bis += charScores.bis * 0.3;

    // Find dominant language
    const maxLang = Object.entries(scores).reduce((a, b) =>
      scores[a[0] as keyof typeof scores] > scores[b[0] as keyof typeof scores]
        ? a
        : b
    )[0];
    const maxScore = scores[maxLang as keyof typeof scores];

    // Enhanced mixed language detection
    const totalScore = scores.en + scores.tl + scores.bis;
    const nonZeroScores = Object.values(scores).filter((s) => s > 0.05).length;
    const isMixed = totalScore > 0.2 && nonZeroScores >= 2;

    // Calculate confidence based on score distribution
    let confidence: number;
    if (isMixed) {
      confidence = Math.min(totalScore * 2, 0.9); // Mixed languages have lower max confidence
    } else {
      confidence = Math.min(maxScore * 4, 1.0);
      // Boost confidence for clear winners
      if (maxScore > scores.en + scores.tl + scores.bis - maxScore) {
        confidence = Math.min(confidence * 1.2, 1.0);
      }
    }

    return {
      code: isMixed ? "mixed" : maxLang,
      confidence,
      scores,
    };
  }

  private static preprocessForDetection(text: string): string {
    let processed = text;

    // Normalize common leetspeak for better language detection
    const basicLeetMap: Record<string, string> = {
      "3": "e",
      "1": "i",
      "0": "o",
      "4": "a",
      "5": "s",
      "7": "t",
    };

    for (const [leet, normal] of Object.entries(basicLeetMap)) {
      processed = processed.replace(new RegExp(leet, "g"), normal);
    }

    // Remove excessive spacing
    processed = processed.replace(/\s{2,}/g, " ");

    return processed;
  }

  private static analyzeCharFrequency(text: string): Record<string, number> {
    const charCounts: Record<string, number> = {};
    const totalChars = text.replace(/\s/g, "").length;

    // Count character frequencies
    for (const char of text.replace(/\s/g, "")) {
      charCounts[char] = (charCounts[char] || 0) + 1;
    }

    const scores = { en: 0, tl: 0, bis: 0 };

    // Calculate language scores based on character frequency patterns
    Object.entries(this.CHAR_FREQUENCY).forEach(([lang, pattern]) => {
      let langScore = 0;
      pattern.commonChars.forEach((char, index) => {
        const frequency = (charCounts[char] || 0) / totalChars;
        const weight =
          (pattern.commonChars.length - index) / pattern.commonChars.length;
        langScore += frequency * weight * pattern.weight;
      });
      scores[lang as keyof typeof scores] = langScore;
    });

    return scores;
  }

  // Enhanced multi-language regex application with better evasion handling
  static applyMultiLangFilter(
    text: string,
    regexSets: Record<string, RegExp | null>
  ): {
    filteredText: string;
    matchCount: number;
    detectedLanguages: string[];
  } {
    let filtered = text;
    let totalMatches = 0;
    const detectedLangs: string[] = [];

    // Apply all language filters
    Object.entries(regexSets).forEach(([lang, regex]) => {
      if (regex) {
        const matches = filtered.match(regex);
        if (matches) {
          filtered = filtered.replace(regex, (match) => {
            totalMatches++;
            if (!detectedLangs.includes(lang)) {
              detectedLangs.push(lang);
            }
            return "*".repeat(match.length);
          });
        }
      }
    });

    return {
      filteredText: filtered,
      matchCount: totalMatches,
      detectedLanguages: detectedLangs,
    };
  }

  // Get language name for display
  static getLanguageName(code: string): string {
    const names: Record<string, string> = {
      en: "English",
      tl: "Tagalog",
      bis: "Bisaya",
      mixed: "Mixed Languages",
    };
    return names[code] || "Unknown";
  }

  // Enhanced script analysis
  static getScriptInfo(text: string): {
    hasLatin: boolean;
    hasSpecialChars: boolean;
    ratio: number;
    wordCount: number;
    avgWordLength: number;
  } {
    const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
    const specialChars = (text.match(/[^\w\s]/g) || []).length;
    const totalChars = text.length;
    const words = text
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);

    return {
      hasLatin: latinChars > 0,
      hasSpecialChars: specialChars > totalChars * 0.15,
      ratio: latinChars / Math.max(totalChars, 1),
      wordCount: words.length,
      avgWordLength:
        words.length > 0
          ? words.reduce((sum, word) => sum + word.length, 0) / words.length
          : 0,
    };
  }

  // Quick quality check for text worth analyzing
  static isTextWorthAnalyzing(text: string): boolean {
    const info = this.getScriptInfo(text);

    // Skip if too short
    if (text.length < 10) return false;

    // Skip if mostly symbols/numbers
    if (info.ratio < 0.3) return false;

    // Skip if too few words
    if (info.wordCount < 2) return false;

    // Skip URLs, handles, hashtags
    if (/^(https?:\/\/|@\w+|#\w+)/.test(text.trim())) return false;

    return true;
  }

  // Enhanced decision logic for AI usage
  static shouldUseAI(text: string, regexMatches: number): boolean {
    if (!this.isTextWorthAnalyzing(text)) return false;

    const detection = this.detectBest(text);

    // Enhanced logic: Use AI for more sophisticated evasion patterns
    const hasComplexEvasion = this.detectComplexEvasion(text);

    // Use AI if:
    // 1. Complex evasion detected regardless of regex matches
    // 2. Low confidence detection with some regex matches
    // 3. Mixed languages
    // 4. Ambiguous cases with moderate regex matches
    // 5. Text has suspicious patterns but low regex matches

    return (
      hasComplexEvasion ||
      (detection.confidence < 0.6 && regexMatches > 0 && regexMatches < 3) ||
      (detection.code === "mixed" && regexMatches > 0) ||
      (regexMatches === 1 && text.length > 50) ||
      this.hasSuspiciousPatterns(text, regexMatches)
    );
  }

  private static detectComplexEvasion(text: string): boolean {
    // Check for patterns that suggest intentional evasion
    const evasionPatterns = [
      /[a-z]\s+[a-z]\s+[a-z]\s+[a-z]/i, // Excessive spacing: "f u c k"
      /[a-z][-_.]{2,}[a-z]/i, // Multiple separators: "f---u---c---k"
      /[@4∆3ε1!|0ø$5§]+.*[@4∆3ε1!|0ø$5§]+/i, // Multiple leetspeak chars
      /(.)\1{4,}/i, // Excessive repetition: "fuuuuuck"
      /[a-z]([^a-z\s])+[a-z]/i, // Interspersed symbols: "f*u*c*k"
    ];

    return evasionPatterns.some((pattern) => pattern.test(text));
  }

  private static hasSuspiciousPatterns(
    text: string,
    regexMatches: number
  ): boolean {
    // Text that looks suspicious but might have evaded regex
    if (regexMatches > 0) return false; // Already caught by regex

    const suspiciousPatterns = [
      /\b[a-z]{2,}[@4∆3ε1!|0ø$5§][a-z]{2,}\b/i, // Words with leetspeak in middle
      /\b[a-z]+[-_.]+[a-z]+[-_.]+[a-z]+\b/i, // Hyphenated/separated words
      /\b[a-z]*[1!|@4$5]+[a-z]*\b/i, // Mixed alphanumeric
    ];

    const wordCount = text.split(/\s+/).length;
    const suspiciousCount = suspiciousPatterns.reduce((count, pattern) => {
      return count + (text.match(pattern)?.length || 0);
    }, 0);

    // If more than 20% of words are suspicious, use AI
    return suspiciousCount > 0 && suspiciousCount / wordCount > 0.2;
  }
}

export class BloomFilter {
  private bits: Uint8Array;
  private size: number;
  private hashFunctions: number;

  constructor(expectedItems: number, falsePositiveRate: number = 0.01) {
    // Calculate optimal size and hash functions
    this.size = Math.ceil(
      (-expectedItems * Math.log(falsePositiveRate)) /
        (Math.log(2) * Math.log(2))
    );
    this.hashFunctions = Math.ceil((this.size / expectedItems) * Math.log(2));
    this.bits = new Uint8Array(Math.ceil(this.size / 8));

    console.log(
      `[JoSan Bloom] Created filter: ${this.size} bits, ${this.hashFunctions} hash functions for ${expectedItems} items`
    );
  }

  private hash1(str: string): number {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h * 31 + str.charCodeAt(i)) >>> 0;
    }
    return h % this.size;
  }

  private hash2(str: string): number {
    let h = 5381;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
    }
    return h % this.size;
  }

  private hash3(str: string): number {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h * 33 + str.charCodeAt(i)) >>> 0;
    }
    return h % this.size;
  }

  private getHash(str: string, seed: number): number {
    switch (seed % 3) {
      case 0:
        return this.hash1(str);
      case 1:
        return this.hash2(str);
      case 2:
        return this.hash3(str);
      default:
        return this.hash1(str);
    }
  }

  private setBit(index: number): void {
    const byteIndex = Math.floor(index / 8);
    const bitIndex = index % 8;
    this.bits[byteIndex] |= 1 << bitIndex;
  }

  private getBit(index: number): boolean {
    const byteIndex = Math.floor(index / 8);
    const bitIndex = index % 8;
    return (this.bits[byteIndex] & (1 << bitIndex)) !== 0;
  }

  add(item: string): void {
    const normalized = item.toLowerCase().trim();
    for (let i = 0; i < this.hashFunctions; i++) {
      const hash = this.getHash(normalized, i);
      this.setBit(hash);
    }
  }

  mightContain(item: string): boolean {
    const normalized = item.toLowerCase().trim();

    // 🔍 ADD DEBUG LOGGING
    console.log(
      `[BloomFilter DEBUG] Checking "${item}" (normalized: "${normalized}")`
    );

    for (let i = 0; i < this.hashFunctions; i++) {
      const hash = this.getHash(normalized, i);
      if (!this.getBit(hash)) {
        console.log(`[BloomFilter DEBUG] Hash ${i} failed for "${normalized}"`);
        return false;
      }
    }

    console.log(`[BloomFilter DEBUG] All hashes passed for "${normalized}"`);
    return true;
  }

  getMemoryUsage(): number {
    return this.bits.length;
  }

  getStats(): { size: number; hashFunctions: number; memoryBytes: number } {
    return {
      size: this.size,
      hashFunctions: this.hashFunctions,
      memoryBytes: this.bits.length,
    };
  }
}

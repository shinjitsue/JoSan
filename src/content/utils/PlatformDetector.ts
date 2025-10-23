export class PlatformDetector {
  static detect(): string {
    const hostname = window.location.hostname;

    if (hostname.includes("facebook.com")) return "facebook";
    if (hostname.includes("twitter.com") || hostname.includes("x.com"))
      return "twitter";
    if (hostname.includes("instagram.com")) return "instagram";
    if (hostname.includes("reddit.com")) return "reddit";
    if (hostname.includes("linkedin.com")) return "linkedin";
    if (hostname.includes("tiktok.com")) return "tiktok";
    if (hostname.includes("youtube.com")) return "youtube";
    if (hostname.includes("tumblr.com")) return "tumblr";
    if (hostname.includes("quora.com")) return "quora";
    if (hostname.includes("threads.net")) return "threads";
    if (hostname.includes("discord.com")) return "discord";
    if (hostname.includes("bsky.app")) return "bluesky";

    return "unknown";
  }
}

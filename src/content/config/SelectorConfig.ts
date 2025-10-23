export const FEED_SELECTORS = [
  // Facebook
  'div[role="feed"]',
  'div[data-pagelet*="FeedUnit"]',

  // Twitter/X
  'article[data-testid="tweet"]',
  'div[data-testid="primaryColumn"]',

  // Instagram
  'article[role="presentation"]',
  'div[class*="feed"]',

  // Reddit
  'div[data-testid="post-container"]',
  "shreddit-post",

  // LinkedIn
  'div[class*="feed-shared-update"]',

  // TikTok
  'div[data-e2e="recommend-list-item"]',
  'div[class*="DivItemContainer"]',

  // YouTube
  "ytd-comment-thread-renderer",
  "ytd-backstage-post-thread-renderer",
  "#contents.ytd-item-section-renderer",

  // Tumblr
  'article[class*="post"]',
  'div[data-id][class*="post_"]',

  // Quora
  'div[class*="q-box"]',
  'div[class="qu-"]',

  // Threads (Meta)
  'div[role="article"]',
  'div[class*="x1lliihq"]',

  // Discord (public servers/channels only)
  'li[class*="messageListItem"]',
  'div[class*="message_"]',

  // BlueSky
  'div[data-testid="feedItem"]',
  'div[class*="post-"]',

  // Generic feed patterns
  "[data-feed]",
  '[class*="feed"]',
  '[class*="timeline"]',
  '[role="article"]',
];

export const PRIVATE_SELECTORS = [
  // Messages/DMs
  '[data-testid*="message"]',
  '[class*="message"]',
  '[class*="chat"]',
  '[class*="dm"]',
  '[aria-label*="message"]',
  '[aria-label*="conversation"]',

  // Discord specific private areas
  '[class*="privateChannels"]',
  '[aria-label*="Direct Messages"]',
  '[data-list-id="private-channels"]',

  // Threads DMs
  '[class*="direct"]',
  '[aria-label*="Direct"]',

  // Input fields
  'input[type="password"]',
  "textarea",
  'input[type="text"]',
  '[contenteditable="true"]',

  // Forms
  "form",
  '[role="textbox"]',

  // Private areas
  '[data-testid*="inbox"]',
  '[class*="inbox"]',
  '[class*="direct"]',
];

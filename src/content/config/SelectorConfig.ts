export const FEED_SELECTORS = [
  // Facebook
  'div[role="feed"]',
  'div[data-pagelet*="FeedUnit"]',
  'div[data-pagelet*="MainFeed"]',
  'div[class*="x1yztbdb"]',
  'div[data-visualcompletion="ignore-dynamic"]',

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
  // Facebook Private Areas
  '[aria-label="Messenger"]',
  '[aria-label*="Send a message to"]',
  '[data-pagelet="Messenger"]',
  'div[data-pagelet*="MessengerDotCom"]',
  '[role="complementary"][aria-label*="Messenger"]',

  // Twitter/X DMs - Specific selectors
  '[data-testid="DMDrawer"]',
  '[data-testid="DMConversationEntry"]',
  '[aria-label*="Direct Messages"]',

  // Instagram Direct - Specific selectors
  'section[class*="x1qjc9v5"][role="main"]', // DM section
  '[aria-label*="Direct messages"]',

  // Reddit Chat/Messages - Specific selectors
  'shreddit-async-loader[bundlename="chat"]',
  '[routename="chat"]',

  // LinkedIn Messaging - Specific selectors
  "section.msg-overlay-list-bubble",
  'aside[aria-label*="Messaging"]',

  // Discord Private Channels - Specific selectors
  '[class*="privateChannels"]',
  '[data-list-id="private-channels"]',
  'li[class*="channel"][class*="private"]',

  // Input fields
  'input[type="password"]',
  "textarea",
  'input[type="text"]',
  '[contenteditable="true"]',

  // Forms
  "form",
  '[role="textbox"]',

  // Inbox/Message areas
  '[data-pagelet*="inbox"]',
  '[data-testid*="inbox"]',
  'div[aria-label*="Inbox"]',
  'div[aria-label*="Messages"]',

  // Generic chat UI
  '[role="dialog"][aria-label*="chat"]',
  '[role="dialog"][aria-label*="message"]',
];

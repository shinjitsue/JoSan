/**
 * English Test Cases - 100 Tricky Cases for Contextual Analysis
 *
 * 50 CLEAN cases - Text that looks problematic but is actually clean
 * 50 PROFANE cases - Toxic content including obfuscated profanity
 */

import type { TestCase } from "./types";

// =============================================================================
// CLEAN TEST CASES (50 cases) - Should be classified as "clean"
// =============================================================================

/**
 * Scunthorpe Problem Cases (1-10)
 * Words containing profanity substrings that are actually clean
 */
export const scunthorpeCases: TestCase[] = [
  {
    id: 1,
    text: "I play bass guitar in a local band every weekend",
    expectedLabel: "clean",
    category: "scunthorpe",
    description: "Bass contains 'ass' but is musical instrument",
  },
  {
    id: 2,
    text: "The classic cocktail party was absolutely elegant",
    expectedLabel: "clean",
    category: "scunthorpe",
    description: "Cocktail contains 'cock' but is a drink",
  },
  {
    id: 3,
    text: "She won the breaststroke competition at the Olympics",
    expectedLabel: "clean",
    category: "scunthorpe",
    description: "Breaststroke is swimming term",
  },
  {
    id: 4,
    text: "The assassin in the movie had a tragic backstory",
    expectedLabel: "clean",
    category: "scunthorpe",
    description: "Assassin contains 'ass' twice but is legitimate word",
  },
  {
    id: 5,
    text: "Scunthorpe is a lovely town in Lincolnshire, England",
    expectedLabel: "clean",
    category: "scunthorpe",
    description: "Scunthorpe is a real place name",
  },
  {
    id: 6,
    text: "The massage therapist helped relieve my back pain",
    expectedLabel: "clean",
    category: "scunthorpe",
    description: "Massage contains 'ass' but is therapy",
  },
  {
    id: 7,
    text: "We need to analyze the data before making conclusions",
    expectedLabel: "clean",
    category: "scunthorpe",
    description: "Analyze contains 'anal' but is analytical term",
  },
  {
    id: 8,
    text: "The assembly line workers were very efficient today",
    expectedLabel: "clean",
    category: "scunthorpe",
    description: "Assembly contains 'ass' but is manufacturing term",
  },
  {
    id: 9,
    text: "Buckingham Palace is a beautiful historical landmark",
    expectedLabel: "clean",
    category: "scunthorpe",
    description: "Buckingham contains 'king' but place name",
  },
  {
    id: 10,
    text: "The therapist recommended cognitive behavioral therapy",
    expectedLabel: "clean",
    category: "scunthorpe",
    description: "Therapist contains 'rapist' but is medical professional",
  },
];

/**
 * Academic/Educational Context Cases (11-18)
 * Discussions about sensitive topics in educational settings
 */
export const academicCases: TestCase[] = [
  {
    id: 11,
    text: "The study examined how hate speech affects online communities",
    expectedLabel: "clean",
    category: "academic",
    description: "Academic discussion of hate speech",
  },
  {
    id: 12,
    text: "Research shows that profanity usage varies across cultures",
    expectedLabel: "clean",
    category: "academic",
    description: "Research about profanity itself",
  },
  {
    id: 13,
    text: "The documentary explored the history of racial slurs in America",
    expectedLabel: "clean",
    category: "academic",
    description: "Documentary discussing sensitive topics",
  },
  {
    id: 14,
    text: "Psychologists study the psychological impact of bullying on children",
    expectedLabel: "clean",
    category: "academic",
    description: "Psychology research topic",
  },
  {
    id: 15,
    text: "The professor lectured on sexual harassment in the workplace",
    expectedLabel: "clean",
    category: "academic",
    description: "Educational lecture on serious topic",
  },
  {
    id: 16,
    text: "This book analyzes toxic masculinity in modern media",
    expectedLabel: "clean",
    category: "academic",
    description: "Academic analysis of social concept",
  },
  {
    id: 17,
    text: "The course covers the ethics of violent video games",
    expectedLabel: "clean",
    category: "academic",
    description: "Course description about violence",
  },
  {
    id: 18,
    text: "Researchers found that aggressive behavior decreases with age",
    expectedLabel: "clean",
    category: "academic",
    description: "Research findings on behavior",
  },
];

/**
 * Reporting/Quoting Context Cases (19-21)
 * Discussions that mention or report on profanity without using it
 */
export const reportingCases: TestCase[] = [
  {
    id: 19,
    text: "The witness said 'he called me a bad name' during testimony",
    expectedLabel: "clean",
    category: "reporting",
    description: "Indirect quote without actual profanity",
  },
  {
    id: 20,
    text: "The content filter detected the word 'shit' in 42 posts",
    expectedLabel: "clean",
    category: "reporting",
    description: "Technical reporting of filtered content",
  },
  {
    id: 21,
    text: "Users complained about seeing explicit content on the platform",
    expectedLabel: "clean",
    category: "reporting",
    description: "Complaint reporting without profanity",
  },
];

/**
 * Medical/Scientific Context Cases (22-25)
 * Medical terminology that might be flagged incorrectly
 */
export const medicalCases: TestCase[] = [
  {
    id: 22,
    text: "The patient complained of penile discomfort after the procedure",
    expectedLabel: "clean",
    category: "medical",
    description: "Medical terminology",
  },
  {
    id: 23,
    text: "Breast cancer awareness month is in October every year",
    expectedLabel: "clean",
    category: "medical",
    description: "Medical awareness campaign",
  },
  {
    id: 24,
    text: "The urologist specializes in erectile dysfunction treatment",
    expectedLabel: "clean",
    category: "medical",
    description: "Medical specialty description",
  },
  {
    id: 25,
    text: "Testicular self-examination is important for early detection",
    expectedLabel: "clean",
    category: "medical",
    description: "Medical advice",
  },
];

/**
 * Literary/Artistic Context Cases (26-28)
 * References to literature, art, and creative content
 */
export const literaryCases: TestCase[] = [
  {
    id: 26,
    text: "The character screamed in anger but the dialogue was censored",
    expectedLabel: "clean",
    category: "literary",
    description: "Description of censored content",
  },
  {
    id: 27,
    text: "The novel depicts the harsh realities of prison life",
    expectedLabel: "clean",
    category: "literary",
    description: "Book description",
  },
  {
    id: 28,
    text: "Shakespeare used crude humor throughout his comedies",
    expectedLabel: "clean",
    category: "literary",
    description: "Literary analysis",
  },
];

/**
 * Gaming/Sports Context Cases (29-32)
 * Gaming and sports terminology that uses violent language innocuously
 */
export const gamingAndSportsCases: TestCase[] = [
  {
    id: 29,
    text: "He got killed in the game and had to respawn at base",
    expectedLabel: "clean",
    category: "gaming",
    description: "Video game terminology",
  },
  {
    id: 30,
    text: "The boxer destroyed his opponent in the third round",
    expectedLabel: "clean",
    category: "sports",
    description: "Sports commentary",
  },
  {
    id: 31,
    text: "That team got absolutely murdered on the scoreboard yesterday",
    expectedLabel: "clean",
    category: "sports",
    description: "Sports metaphor for losing badly",
  },
  {
    id: 32,
    text: "The sniper headshot was incredible, what a play!",
    expectedLabel: "clean",
    category: "gaming",
    description: "Gaming achievement",
  },
];

/**
 * Food/Cooking Context Cases (33-35)
 * Cooking terminology that might seem suggestive
 */
export const cookingCases: TestCase[] = [
  {
    id: 33,
    text: "Beat the eggs vigorously until peaks form",
    expectedLabel: "clean",
    category: "cooking",
    description: "Cooking instruction",
  },
  {
    id: 34,
    text: "Whip the cream until it's stiff and glossy",
    expectedLabel: "clean",
    category: "cooking",
    description: "Cooking instruction with potentially suggestive word",
  },
  {
    id: 35,
    text: "The spotted dick is a traditional British dessert",
    expectedLabel: "clean",
    category: "cooking",
    description: "Traditional food name",
  },
];

/**
 * Technical/Professional Context Cases (36-38)
 * Technical terminology from computing and other fields
 */
export const technicalCases: TestCase[] = [
  {
    id: 36,
    text: "The slave device must be connected to the master controller",
    expectedLabel: "clean",
    category: "technical",
    description: "Technical computing terminology",
  },
  {
    id: 37,
    text: "Execute the kill command to terminate the process",
    expectedLabel: "clean",
    category: "technical",
    description: "Unix/Linux command terminology",
  },
  {
    id: 38,
    text: "The daemon process runs in the background continuously",
    expectedLabel: "clean",
    category: "technical",
    description: "Computing terminology",
  },
];

/**
 * Frustrated but Clean Expressions Cases (39-42)
 * Expressions of frustration without actual profanity
 */
export const frustrationCases: TestCase[] = [
  {
    id: 39,
    text: "This is so frustrating, I've been trying for hours!",
    expectedLabel: "clean",
    category: "frustration",
    description: "Frustration without profanity",
  },
  {
    id: 40,
    text: "Ugh, I can't believe this happened again",
    expectedLabel: "clean",
    category: "frustration",
    description: "Annoyance without profanity",
  },
  {
    id: 41,
    text: "This situation is absolutely terrible and disappointing",
    expectedLabel: "clean",
    category: "frustration",
    description: "Strong negative emotion without profanity",
  },
  {
    id: 42,
    text: "I'm so angry right now I could scream",
    expectedLabel: "clean",
    category: "frustration",
    description: "Anger expression without profanity",
  },
];

/**
 * Criticism without Profanity Cases (43-45)
 * Strong criticism that doesn't use profane language
 */
export const criticismCases: TestCase[] = [
  {
    id: 43,
    text: "Your argument lacks logical foundation and evidence",
    expectedLabel: "clean",
    category: "criticism",
    description: "Strong criticism without profanity",
  },
  {
    id: 44,
    text: "This work is subpar and needs significant improvement",
    expectedLabel: "clean",
    category: "criticism",
    description: "Negative feedback without profanity",
  },
  {
    id: 45,
    text: "The presentation was poorly executed and unprofessional",
    expectedLabel: "clean",
    category: "criticism",
    description: "Professional criticism",
  },
];

/**
 * Similar-sounding Clean Words Cases (46-50)
 * Words that sound similar to profanity but are clean
 */
export const homophonesCases: TestCase[] = [
  {
    id: 46,
    text: "The ship docked at the port yesterday morning",
    expectedLabel: "clean",
    category: "homophones",
    description: "Ship sounds like but isn't profanity",
  },
  {
    id: 47,
    text: "I need to sit down and rest for a while",
    expectedLabel: "clean",
    category: "homophones",
    description: "Sit is clean",
  },
  {
    id: 48,
    text: "The witch in the story was actually kind-hearted",
    expectedLabel: "clean",
    category: "homophones",
    description: "Witch sounds like but isn't bitch",
  },
  {
    id: 49,
    text: "Pass me the fork please, this one is dirty",
    expectedLabel: "clean",
    category: "homophones",
    description: "Fork is clean",
  },
  {
    id: 50,
    text: "The duck swam gracefully across the pond",
    expectedLabel: "clean",
    category: "homophones",
    description: "Duck is clean",
  },
];

// =============================================================================
// PROFANE TEST CASES (50 cases) - Should be classified as "toxic"
// =============================================================================

/**
 * Leet Speak / Character Substitution Cases (51-58)
 * Profanity using number and symbol substitutions
 */
export const leetSpeakCases: TestCase[] = [
  {
    id: 51,
    text: "You're such a b1tch, I can't stand you anymore",
    expectedLabel: "toxic",
    category: "leet_speak",
    description: "Bitch with 1 for i",
  },
  {
    id: 52,
    text: "That was a 5h1t performance, totally embarrassing",
    expectedLabel: "toxic",
    category: "leet_speak",
    description: "Shit with 5 and 1",
  },
  {
    id: 53,
    text: "What the fvck is wrong with you people",
    expectedLabel: "toxic",
    category: "leet_speak",
    description: "Fuck with v for u",
  },
  {
    id: 54,
    text: "You're @n @ssh0le and everyone knows it",
    expectedLabel: "toxic",
    category: "leet_speak",
    description: "Asshole with @ and 0",
  },
  {
    id: 55,
    text: "Stop being such a d1ck to everyone in chat",
    expectedLabel: "toxic",
    category: "leet_speak",
    description: "Dick with 1 for i",
  },
  {
    id: 56,
    text: "That's f4cking ridiculous, are you serious?",
    expectedLabel: "toxic",
    category: "leet_speak",
    description: "Fucking with 4 for a/u",
  },
  {
    id: 57,
    text: "You absolute b4st4rd, how could you do this",
    expectedLabel: "toxic",
    category: "leet_speak",
    description: "Bastard with 4s",
  },
  {
    id: 58,
    text: "That's the dumb3st sh1t I've ever heard",
    expectedLabel: "toxic",
    category: "leet_speak",
    description: "Multiple leet substitutions",
  },
];

/**
 * Spaced Profanity Cases (59-64)
 * Profanity with spaces or separators between letters
 */
export const spacedProfanityCases: TestCase[] = [
  {
    id: 59,
    text: "F u c k you and everyone who agrees with you",
    expectedLabel: "toxic",
    category: "spaced",
    description: "Fuck with spaces",
  },
  {
    id: 60,
    text: "You are such a b i t c h, it's unbelievable",
    expectedLabel: "toxic",
    category: "spaced",
    description: "Bitch with spaces",
  },
  {
    id: 61,
    text: "What a load of s.h.i.t this argument is",
    expectedLabel: "toxic",
    category: "spaced",
    description: "Shit with dots",
  },
  {
    id: 62,
    text: "Go f-u-c-k yourself, nobody asked you",
    expectedLabel: "toxic",
    category: "spaced",
    description: "Fuck with hyphens",
  },
  {
    id: 63,
    text: "You're an a_s_s_h_o_l_e for doing that",
    expectedLabel: "toxic",
    category: "spaced",
    description: "Asshole with underscores",
  },
  {
    id: 64,
    text: "S H I T, I can't believe this is happening",
    expectedLabel: "toxic",
    category: "spaced",
    description: "Shit fully spaced caps",
  },
];

/**
 * Vowel Removal Cases (65-70)
 * Profanity with vowels removed
 */
export const vowelRemovalCases: TestCase[] = [
  {
    id: 65,
    text: "What the fck is this garbage content",
    expectedLabel: "toxic",
    category: "vowel_removal",
    description: "Fuck without u",
  },
  {
    id: 66,
    text: "You're a complete btch and everyone sees it",
    expectedLabel: "toxic",
    category: "vowel_removal",
    description: "Bitch without i",
  },
  {
    id: 67,
    text: "This is absolute sht, what were they thinking",
    expectedLabel: "toxic",
    category: "vowel_removal",
    description: "Shit without i",
  },
  {
    id: 68,
    text: "Stfu nobody wants to hear your opinion",
    expectedLabel: "toxic",
    category: "vowel_removal",
    description: "STFU acronym",
  },
  {
    id: 69,
    text: "Gtfo of here with that nonsense",
    expectedLabel: "toxic",
    category: "vowel_removal",
    description: "GTFO acronym",
  },
  {
    id: 70,
    text: "You're such a dck, always causing problems",
    expectedLabel: "toxic",
    category: "vowel_removal",
    description: "Dick without i",
  },
];

/**
 * Direct Profanity Cases - Baseline (71-75)
 * Direct, unobfuscated profanity
 */
export const directProfanityCases: TestCase[] = [
  {
    id: 71,
    text: "You're fucking stupid and everyone knows it",
    expectedLabel: "toxic",
    category: "direct",
    description: "Direct profanity with insult",
  },
  {
    id: 72,
    text: "This is bullshit, I don't believe a word",
    expectedLabel: "toxic",
    category: "direct",
    description: "Direct profanity expressing disbelief",
  },
  {
    id: 73,
    text: "What an asshole, can't believe he did that",
    expectedLabel: "toxic",
    category: "direct",
    description: "Calling someone asshole",
  },
  {
    id: 74,
    text: "She's such a bitch, always starting drama",
    expectedLabel: "toxic",
    category: "direct",
    description: "Calling someone bitch",
  },
  {
    id: 75,
    text: "Shut the fuck up already, nobody cares",
    expectedLabel: "toxic",
    category: "direct",
    description: "Aggressive profanity",
  },
];

/**
 * Death Threats / Violence Cases (76-80)
 * Threats and violent content
 */
export const threatCases: TestCase[] = [
  {
    id: 76,
    text: "Kill yourself, the world would be better without you",
    expectedLabel: "toxic",
    category: "threat",
    description: "Self-harm encouragement",
  },
  {
    id: 77,
    text: "I hope you die in your sleep tonight",
    expectedLabel: "toxic",
    category: "threat",
    description: "Death wish",
  },
  {
    id: 78,
    text: "Someone should put you down like a sick animal",
    expectedLabel: "toxic",
    category: "threat",
    description: "Violent metaphor",
  },
  {
    id: 79,
    text: "I'm going to find where you live and end you",
    expectedLabel: "toxic",
    category: "threat",
    description: "Direct threat",
  },
  {
    id: 80,
    text: "You deserve to suffer for what you said",
    expectedLabel: "toxic",
    category: "threat",
    description: "Wishing harm",
  },
];

/**
 * Hate Speech / Discrimination Cases (81-85)
 * Discriminatory and hateful content
 */
export const hateSpeechCases: TestCase[] = [
  {
    id: 81,
    text: "Go back to where you came from, you don't belong here",
    expectedLabel: "toxic",
    category: "hate",
    description: "Xenophobic comment",
  },
  {
    id: 82,
    text: "Your kind shouldn't be allowed in this country",
    expectedLabel: "toxic",
    category: "hate",
    description: "Discriminatory statement",
  },
  {
    id: 83,
    text: "People like you are the reason society is failing",
    expectedLabel: "toxic",
    category: "hate",
    description: "Group-based attack",
  },
  {
    id: 84,
    text: "That's so gay, imagine actually liking that",
    expectedLabel: "toxic",
    category: "hate",
    description: "Homophobic usage",
  },
  {
    id: 85,
    text: "Women belong in the kitchen, not in leadership",
    expectedLabel: "toxic",
    category: "hate",
    description: "Sexist statement",
  },
];

/**
 * Cyberbullying / Personal Attacks Cases (86-90)
 * Personal attacks and bullying behavior
 */
export const bullyingCases: TestCase[] = [
  {
    id: 86,
    text: "Nobody likes you, everyone talks behind your back",
    expectedLabel: "toxic",
    category: "bullying",
    description: "Social isolation attack",
  },
  {
    id: 87,
    text: "You're so ugly, how do you even look in the mirror",
    expectedLabel: "toxic",
    category: "bullying",
    description: "Appearance-based attack",
  },
  {
    id: 88,
    text: "Your existence is a mistake and everyone knows it",
    expectedLabel: "toxic",
    category: "bullying",
    description: "Existential attack",
  },
  {
    id: 89,
    text: "Just delete your account, nobody wants you here",
    expectedLabel: "toxic",
    category: "bullying",
    description: "Exclusion encouragement",
  },
  {
    id: 90,
    text: "I'm going to expose all your secrets to everyone",
    expectedLabel: "toxic",
    category: "bullying",
    description: "Blackmail threat",
  },
];

/**
 * Subtle/Disguised Toxicity Cases (91-95)
 * Toxic content wrapped in polite language
 */
export const subtleToxicityCases: TestCase[] = [
  {
    id: 91,
    text: "With all due respect, you're an absolute moron",
    expectedLabel: "toxic",
    category: "subtle",
    description: "Polite framing with insult",
  },
  {
    id: 92,
    text: "Not to be rude, but you're the dumbest person I know",
    expectedLabel: "toxic",
    category: "subtle",
    description: "Disclaimer before insult",
  },
  {
    id: 93,
    text: "I'm just saying, you should probably shut up forever",
    expectedLabel: "toxic",
    category: "subtle",
    description: "Casual framing of toxic message",
  },
  {
    id: 94,
    text: "No offense but your face makes me want to puke",
    expectedLabel: "toxic",
    category: "subtle",
    description: "Fake politeness with attack",
  },
  {
    id: 95,
    text: "Bless your heart, but you're pathetically stupid",
    expectedLabel: "toxic",
    category: "subtle",
    description: "Southern passive aggression",
  },
];

/**
 * Mixed Obfuscation Cases (96-100)
 * Profanity using multiple obfuscation techniques combined
 */
export const mixedObfuscationCases: TestCase[] = [
  {
    id: 96,
    text: "You're a f.u.c.k.1.n.g idiot, learn to spell",
    expectedLabel: "toxic",
    category: "mixed",
    description: "Dots and leet combined",
  },
  {
    id: 97,
    text: "Such b u l l 5 h 1 t, can't believe this",
    expectedLabel: "toxic",
    category: "mixed",
    description: "Spaced with leet speak",
  },
  {
    id: 98,
    text: "You're a complete @$$hole and a waste of space",
    expectedLabel: "toxic",
    category: "mixed",
    description: "Symbol substitution",
  },
  {
    id: 99,
    text: "That's fkng pathetic, try harder next time",
    expectedLabel: "toxic",
    category: "mixed",
    description: "Consonant only profanity",
  },
  {
    id: 100,
    text: "What a sh!tty thing to say, you're disgusting",
    expectedLabel: "toxic",
    category: "mixed",
    description: "Leet with word variation",
  },
];

// =============================================================================
// COMBINED EXPORTS
// =============================================================================

/**
 * All 50 clean test cases combined
 */
export const cleanTestCases: TestCase[] = [
  ...scunthorpeCases,
  ...academicCases,
  ...reportingCases,
  ...medicalCases,
  ...literaryCases,
  ...gamingAndSportsCases,
  ...cookingCases,
  ...technicalCases,
  ...frustrationCases,
  ...criticismCases,
  ...homophonesCases,
];

/**
 * All 50 profane test cases combined
 */
export const profaneTestCases: TestCase[] = [
  ...leetSpeakCases,
  ...spacedProfanityCases,
  ...vowelRemovalCases,
  ...directProfanityCases,
  ...threatCases,
  ...hateSpeechCases,
  ...bullyingCases,
  ...subtleToxicityCases,
  ...mixedObfuscationCases,
];

/**
 * All 100 English test cases
 */
export const englishTestCases: TestCase[] = [
  ...cleanTestCases,
  ...profaneTestCases,
];

/**
 * Category summary for documentation
 */
export const categoryInfo = {
  clean: {
    total: 50,
    categories: [
      {
        name: "scunthorpe",
        count: 10,
        description: "Words containing profanity substrings",
      },
      {
        name: "academic",
        count: 8,
        description: "Educational/research contexts",
      },
      {
        name: "reporting",
        count: 3,
        description: "Reporting/quoting contexts",
      },
      { name: "medical", count: 4, description: "Medical terminology" },
      { name: "literary", count: 3, description: "Literary/artistic contexts" },
      { name: "gaming", count: 2, description: "Gaming terminology" },
      { name: "sports", count: 2, description: "Sports commentary" },
      { name: "cooking", count: 3, description: "Cooking instructions" },
      { name: "technical", count: 3, description: "Technical terminology" },
      {
        name: "frustration",
        count: 4,
        description: "Clean frustration expressions",
      },
      { name: "criticism", count: 3, description: "Professional criticism" },
      {
        name: "homophones",
        count: 5,
        description: "Similar-sounding clean words",
      },
    ],
  },
  profane: {
    total: 50,
    categories: [
      {
        name: "leet_speak",
        count: 8,
        description: "Character substitution (1337)",
      },
      { name: "spaced", count: 6, description: "Spaced out profanity" },
      { name: "vowel_removal", count: 6, description: "Vowels removed" },
      {
        name: "direct",
        count: 5,
        description: "Direct unobfuscated profanity",
      },
      { name: "threat", count: 5, description: "Threats and violence" },
      { name: "hate", count: 5, description: "Hate speech/discrimination" },
      {
        name: "bullying",
        count: 5,
        description: "Cyberbullying/personal attacks",
      },
      { name: "subtle", count: 5, description: "Politely framed toxicity" },
      {
        name: "mixed",
        count: 5,
        description: "Multiple obfuscation techniques",
      },
    ],
  },
};

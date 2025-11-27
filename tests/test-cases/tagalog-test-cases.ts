import type { TestCase } from "./types";

/**
 * Scunthorpe-like Problem Cases (1-8)
 * Words containing profanity substrings that are actually clean in Tagalog
 */
export const tagalogScunthorpeCases: TestCase[] = [
  {
    id: 1,
    text: "Ang puting ibon ay lumilipad sa langit",
    expectedLabel: "clean",
    category: "scunthorpe",
    description: "'puting' looks like 'puta' but means 'white'",
  },
  {
    id: 2,
    text: "Naghuhugas ako ng pinggan sa lababo",
    expectedLabel: "clean",
    category: "scunthorpe",
    description: "'hugas' is a clean word meaning 'wash'",
  },
  {
    id: 3,
    text: "Ang tangang-tangang hayop na ito ay masarap kainin",
    expectedLabel: "clean",
    category: "scunthorpe",
    description: "'tangang-tangang' refers to a type of fish (milkfish)",
  },
  {
    id: 4,
    text: "Mag-ingat ka sa buwaya sa ilog",
    expectedLabel: "clean",
    category: "scunthorpe",
    description: "'buwaya' (crocodile) sounds like 'buwisit'",
  },
  {
    id: 5,
    text: "Ang putol na kahoy ay ginagamit sa apoy",
    expectedLabel: "clean",
    category: "scunthorpe",
    description: "'putol' (cut) sounds similar to profanity but is clean",
  },
  {
    id: 6,
    text: "Gusto ko ng inihaw na pusit sa dagat",
    expectedLabel: "clean",
    category: "scunthorpe",
    description: "'pusit' (squid) is a clean food word",
  },
  {
    id: 7,
    text: "Ang lehitimong negosyo ay kumikita ng malaki",
    expectedLabel: "clean",
    category: "scunthorpe",
    description: "'lehi' within 'lehitimo' is incidental",
  },
  {
    id: 8,
    text: "Bumili ako ng puting sapatos sa tindahan",
    expectedLabel: "clean",
    category: "scunthorpe",
    description: "'puting' (white) is a common adjective",
  },
];

/**
 * Academic/Educational Context Cases (9-16)
 * Discussions about sensitive topics in educational settings
 */
export const tagalogAcademicCases: TestCase[] = [
  {
    id: 9,
    text: "Ang pag-aaral tungkol sa hate speech ay mahalaga sa lipunan",
    expectedLabel: "clean",
    category: "academic",
    description: "Academic discussion of hate speech",
  },
  {
    id: 10,
    text: "Sinusuri ng mga mananaliksik ang epekto ng cyberbullying",
    expectedLabel: "clean",
    category: "academic",
    description: "Research about cyberbullying",
  },
  {
    id: 11,
    text: "Ang dokumentaryo ay tungkol sa kasaysayan ng diskriminasyon",
    expectedLabel: "clean",
    category: "academic",
    description: "Documentary about discrimination",
  },
  {
    id: 12,
    text: "Ang thesis ko ay tungkol sa epekto ng masasamang salita online",
    expectedLabel: "clean",
    category: "academic",
    description: "Thesis topic about profanity",
  },
  {
    id: 13,
    text: "Tinalakay ng guro ang mga bawal na salita sa klase",
    expectedLabel: "clean",
    category: "academic",
    description: "Teacher discussing forbidden words",
  },
  {
    id: 14,
    text: "Ang seminar ay tungkol sa karahasan sa pamilya",
    expectedLabel: "clean",
    category: "academic",
    description: "Seminar about domestic violence",
  },
  {
    id: 15,
    text: "Pinag-aralan namin ang mga sanhi ng pagiging agresibo",
    expectedLabel: "clean",
    category: "academic",
    description: "Study about causes of aggression",
  },
  {
    id: 16,
    text: "Ang libro ay naglalaman ng mga halimbawa ng toxic masculinity",
    expectedLabel: "clean",
    category: "academic",
    description: "Book containing examples of toxic masculinity",
  },
];

/**
 * Medical/Health Context Cases (17-22)
 * Medical terminology that might be flagged incorrectly
 */
export const tagalogMedicalCases: TestCase[] = [
  {
    id: 17,
    text: "Ang breast cancer awareness ay importante para sa kababaihan",
    expectedLabel: "clean",
    category: "medical",
    description: "Breast cancer awareness",
  },
  {
    id: 18,
    text: "Kumonsulta ka sa doktor tungkol sa sexual health mo",
    expectedLabel: "clean",
    category: "medical",
    description: "Sexual health consultation",
  },
  {
    id: 19,
    text: "Ang reproductive health ay dapat ituro sa eskwelahan",
    expectedLabel: "clean",
    category: "medical",
    description: "Reproductive health education",
  },
  {
    id: 20,
    text: "May sakit siya sa ari ng lalaki, kailangan niya ng doktor",
    expectedLabel: "clean",
    category: "medical",
    description: "Medical discussion about male genitalia",
  },
  {
    id: 21,
    text: "Ang mental health ay kasinghalaga ng physical health",
    expectedLabel: "clean",
    category: "medical",
    description: "Mental health awareness",
  },
  {
    id: 22,
    text: "Ang mga sintomas ng STD ay dapat malaman ng lahat",
    expectedLabel: "clean",
    category: "medical",
    description: "STD symptoms education",
  },
];

/**
 * Gaming/Sports Context Cases (23-28)
 * Gaming and sports terminology
 */
export const tagalogGamingCases: TestCase[] = [
  {
    id: 23,
    text: "Pinatay ko ang kalaban sa Mobile Legends, GG!",
    expectedLabel: "clean",
    category: "gaming",
    description: "Gaming terminology - killing enemies",
  },
  {
    id: 24,
    text: "Binugbog namin ang kabilang team sa basketball",
    expectedLabel: "clean",
    category: "sports",
    description: "Sports metaphor for winning badly",
  },
  {
    id: 25,
    text: "Ang headshot ko ay epic, nag-MVP ako!",
    expectedLabel: "clean",
    category: "gaming",
    description: "Gaming achievement",
  },
  {
    id: 26,
    text: "Binasag namin ang depensa nila sa volleyball",
    expectedLabel: "clean",
    category: "sports",
    description: "Sports terminology",
  },
  {
    id: 27,
    text: "Namatay ako sa laro pero respawn ako agad",
    expectedLabel: "clean",
    category: "gaming",
    description: "Gaming respawn terminology",
  },
  {
    id: 28,
    text: "Sinakal ko ang kalaban sa wrestling match",
    expectedLabel: "clean",
    category: "sports",
    description: "Wrestling terminology",
  },
];

/**
 * Cooking/Food Context Cases (29-32)
 * Cooking terminology that might seem inappropriate
 */
export const tagalogCookingCases: TestCase[] = [
  {
    id: 29,
    text: "Batiin mo ang itlog hanggang maging malapot",
    expectedLabel: "clean",
    category: "cooking",
    description: "Cooking instruction - beating eggs",
  },
  {
    id: 30,
    text: "Dikdikin mo ang bawang at sibuyas para sa sawsawan",
    expectedLabel: "clean",
    category: "cooking",
    description: "Cooking instruction - crushing garlic",
  },
  {
    id: 31,
    text: "Ihahalo mo ang katas ng calamansi sa laman loob",
    expectedLabel: "clean",
    category: "cooking",
    description: "Recipe with innards (laman loob)",
  },
  {
    id: 32,
    text: "Ang betamax na ginagawa mula sa dugo ng baboy ay masarap",
    expectedLabel: "clean",
    category: "cooking",
    description: "Filipino street food description",
  },
];

/**
 * Frustration without Profanity Cases (33-38)
 * Expressions of frustration without actual profanity
 */
export const tagalogFrustrationCases: TestCase[] = [
  {
    id: 33,
    text: "Nakakabwisit itong sitwasyon na ito!",
    expectedLabel: "clean",
    category: "frustration",
    description: "Frustrating situation without direct profanity",
  },
  {
    id: 34,
    text: "Naiinis na ako, ang hirap naman nito!",
    expectedLabel: "clean",
    category: "frustration",
    description: "Frustration expression",
  },
  {
    id: 35,
    text: "Ang sama ng araw ko ngayon, lahat ay mali!",
    expectedLabel: "clean",
    category: "frustration",
    description: "Bad day expression",
  },
  {
    id: 36,
    text: "Hindi ko na kaya, ang hirap ng buhay!",
    expectedLabel: "clean",
    category: "frustration",
    description: "Life difficulty expression",
  },
  {
    id: 37,
    text: "Ay nako, paulit-ulit na lang ang problema!",
    expectedLabel: "clean",
    category: "frustration",
    description: "Repeated problem frustration",
  },
  {
    id: 38,
    text: "Sumakit ang ulo ko sa problemang ito!",
    expectedLabel: "clean",
    category: "frustration",
    description: "Headache from problems",
  },
];

/**
 * Professional Criticism Cases (39-42)
 * Strong criticism without profane language
 */
export const tagalogCriticismCases: TestCase[] = [
  {
    id: 39,
    text: "Ang presentation mo ay hindi maayos at kulang sa detalye",
    expectedLabel: "clean",
    category: "criticism",
    description: "Professional work criticism",
  },
  {
    id: 40,
    text: "Kailangan mong mag-improve sa iyong performance",
    expectedLabel: "clean",
    category: "criticism",
    description: "Performance feedback",
  },
  {
    id: 41,
    text: "Hindi acceptable ang output mo, ulitin mo",
    expectedLabel: "clean",
    category: "criticism",
    description: "Work rejection feedback",
  },
  {
    id: 42,
    text: "Ang plano mo ay may maraming butas at hindi praktikal",
    expectedLabel: "clean",
    category: "criticism",
    description: "Plan criticism",
  },
];

/**
 * Religious/Cultural Context Cases (43-46)
 * Religious and cultural expressions
 */
export const tagalogReligiousCases: TestCase[] = [
  {
    id: 43,
    text: "Diyos ko po, tulungan mo kami sa panahong ito",
    expectedLabel: "clean",
    category: "religious",
    description: "Religious prayer",
  },
  {
    id: 44,
    text: "Susmariosep, nalate na naman ako sa trabaho!",
    expectedLabel: "clean",
    category: "religious",
    description: "Religious exclamation (not profanity)",
  },
  {
    id: 45,
    text: "Ay Hesus, ang mahal naman ng presyo nito!",
    expectedLabel: "clean",
    category: "religious",
    description: "Religious exclamation about price",
  },
  {
    id: 46,
    text: "Madre de Dios, anong nangyari dito?",
    expectedLabel: "clean",
    category: "religious",
    description: "Spanish religious expression common in Tagalog",
  },
];

/**
 * Reporting/Quoting Context Cases (47-50)
 * Discussions that mention or report on profanity
 */
export const tagalogReportingCases: TestCase[] = [
  {
    id: 47,
    text: "Sinabi ng biktima na tinawag siyang 'masasamang salita'",
    expectedLabel: "clean",
    category: "reporting",
    description: "Indirect quote without actual profanity",
  },
  {
    id: 48,
    text: "Ang filter ay nakakita ng salitang 'gago' sa 50 posts",
    expectedLabel: "clean",
    category: "reporting",
    description: "Technical reporting of filtered content",
  },
  {
    id: 49,
    text: "Nagreklamo ang mga user tungkol sa masasamang content",
    expectedLabel: "clean",
    category: "reporting",
    description: "User complaint reporting",
  },
  {
    id: 50,
    text: "Ang study ay nagsuri sa paggamit ng mura sa social media",
    expectedLabel: "clean",
    category: "reporting",
    description: "Research about profanity usage",
  },
];

// =============================================================================
// TOXIC TEST CASES (50 cases)
// =============================================================================

/**
 * Direct Tagalog Profanity Cases (51-58)
 * Direct, unobfuscated Tagalog profanity
 */
export const tagalogDirectProfanityCases: TestCase[] = [
  {
    id: 51,
    text: "Putang ina mo, ang tanga tanga mo talaga!",
    expectedLabel: "toxic",
    category: "direct",
    description: "Direct profanity - putang ina",
  },
  {
    id: 52,
    text: "Gago ka, wala kang utak na ginagamit!",
    expectedLabel: "toxic",
    category: "direct",
    description: "Direct profanity - gago",
  },
  {
    id: 53,
    text: "Ulol ka, sino ka ba para mag-salita?",
    expectedLabel: "toxic",
    category: "direct",
    description: "Direct profanity - ulol",
  },
  {
    id: 54,
    text: "Bobo mo naman, hindi mo maintindihan yan?",
    expectedLabel: "toxic",
    category: "direct",
    description: "Direct profanity - bobo",
  },
  {
    id: 55,
    text: "Tarantado ka talaga, nakakasuka ka!",
    expectedLabel: "toxic",
    category: "direct",
    description: "Direct profanity - tarantado",
  },
  {
    id: 56,
    text: "Leche ka, ang pangit ng ugali mo!",
    expectedLabel: "toxic",
    category: "direct",
    description: "Direct profanity - leche",
  },
  {
    id: 57,
    text: "Punyeta, sino gumawa nito? Ang pangit!",
    expectedLabel: "toxic",
    category: "direct",
    description: "Direct profanity - punyeta",
  },
  {
    id: 58,
    text: "Walang hiya ka, paano mo nagawa yan?",
    expectedLabel: "toxic",
    category: "direct",
    description: "Direct profanity - walang hiya",
  },
];

/**
 * Leet Speak / Character Substitution Cases (59-66)
 * Tagalog profanity using number and symbol substitutions
 */
export const tagalogLeetSpeakCases: TestCase[] = [
  {
    id: 59,
    text: "Put4ng 1n4 mo, ang t4ng4 mo!",
    expectedLabel: "toxic",
    category: "leet_speak",
    description: "Putang ina with 4 for a and 1 for i",
  },
  {
    id: 60,
    text: "G4g0 ka talaga, walang kwenta!",
    expectedLabel: "toxic",
    category: "leet_speak",
    description: "Gago with 4 for a and 0 for o",
  },
  {
    id: 61,
    text: "B0b0 mo naman, hindi mo gets?",
    expectedLabel: "toxic",
    category: "leet_speak",
    description: "Bobo with 0 for o",
  },
  {
    id: 62,
    text: "T4r4nt4d0 kang hayop ka!",
    expectedLabel: "toxic",
    category: "leet_speak",
    description: "Tarantado with 4 and 0",
  },
  {
    id: 63,
    text: "Pun¥€t4 naman, ang hirap mo kasama!",
    expectedLabel: "toxic",
    category: "leet_speak",
    description: "Punyeta with symbols",
  },
  {
    id: 64,
    text: "Ul0l k4, wag kang mag-salita!",
    expectedLabel: "toxic",
    category: "leet_speak",
    description: "Ulol with 0 and 4",
  },
  {
    id: 65,
    text: "L3ch3 ka talaga, napakasama mo!",
    expectedLabel: "toxic",
    category: "leet_speak",
    description: "Leche with 3 for e",
  },
  {
    id: 66,
    text: "P0t4 ka, ang kapal ng mukha mo!",
    expectedLabel: "toxic",
    category: "leet_speak",
    description: "Pota with 0 and 4",
  },
];

/**
 * Spaced Profanity Cases (67-72)
 * Tagalog profanity with spaces or separators
 */
export const tagalogSpacedCases: TestCase[] = [
  {
    id: 67,
    text: "P u t a n g i n a mo, ang sama mo!",
    expectedLabel: "toxic",
    category: "spaced",
    description: "Putangina with spaces",
  },
  {
    id: 68,
    text: "G a g o ka talaga, nakakairita ka!",
    expectedLabel: "toxic",
    category: "spaced",
    description: "Gago with spaces",
  },
  {
    id: 69,
    text: "T.a.n.g.a mo, bakit hindi mo alam yan?",
    expectedLabel: "toxic",
    category: "spaced",
    description: "Tanga with dots",
  },
  {
    id: 70,
    text: "B-o-b-o ka, napakadali lang naman niyan!",
    expectedLabel: "toxic",
    category: "spaced",
    description: "Bobo with hyphens",
  },
  {
    id: 71,
    text: "U_l_o_l ka, tumahimik ka na lang!",
    expectedLabel: "toxic",
    category: "spaced",
    description: "Ulol with underscores",
  },
  {
    id: 72,
    text: "P U N Y E T A, sino ba kasi gumawa nito?",
    expectedLabel: "toxic",
    category: "spaced",
    description: "Punyeta spaced caps",
  },
];

/**
 * Abbreviated/Acronym Cases (73-76)
 * Common Tagalog profanity abbreviations
 */
export const tagalogAcronymCases: TestCase[] = [
  {
    id: 73,
    text: "P.I. ka talaga, nakakabwisit ka!",
    expectedLabel: "toxic",
    category: "acronym",
    description: "P.I. abbreviation for putang ina",
  },
  {
    id: 74,
    text: "Pota ka, ang kapal ng mukha mo!",
    expectedLabel: "toxic",
    category: "acronym",
    description: "Pota shortened form",
  },
  {
    id: 75,
    text: "Kingina mo, ang sama ng ugali mo!",
    expectedLabel: "toxic",
    category: "acronym",
    description: "Kingina shortened putangina",
  },
  {
    id: 76,
    text: "Ampota ka, wag ka ngang mag-salita!",
    expectedLabel: "toxic",
    category: "acronym",
    description: "Ampota variation",
  },
];

/**
 * Death Threats / Violence Cases (77-82)
 * Threats and violent content in Tagalog
 */
export const tagalogThreatCases: TestCase[] = [
  {
    id: 77,
    text: "Patayin mo na lang sarili mo, walang magmamahal sayo",
    expectedLabel: "toxic",
    category: "threat",
    description: "Self-harm encouragement",
  },
  {
    id: 78,
    text: "Sana mamatay ka sa sakit mo, you deserve it!",
    expectedLabel: "toxic",
    category: "threat",
    description: "Death wish",
  },
  {
    id: 79,
    text: "Hahanapin kita at sasaktan kita, tandaan mo yan!",
    expectedLabel: "toxic",
    category: "threat",
    description: "Direct threat",
  },
  {
    id: 80,
    text: "Dapat nahulog ka sa hagdan at namatay ka na!",
    expectedLabel: "toxic",
    category: "threat",
    description: "Wishing harm",
  },
  {
    id: 81,
    text: "Bubugbugin kita pag nakita kita, maghintay ka!",
    expectedLabel: "toxic",
    category: "threat",
    description: "Violence threat",
  },
  {
    id: 82,
    text: "Ipapabaril kita sa mga kakilala ko, ingat ka!",
    expectedLabel: "toxic",
    category: "threat",
    description: "Murder threat",
  },
];

/**
 * Hate Speech / Discrimination Cases (83-88)
 * Discriminatory and hateful content in Tagalog
 */
export const tagalogHateSpeechCases: TestCase[] = [
  {
    id: 83,
    text: "Bakit kayo dito? Bumalik na kayo sa probinsya nyo!",
    expectedLabel: "toxic",
    category: "hate",
    description: "Regional discrimination",
  },
  {
    id: 84,
    text: "Ang mga mahihirap dapat hindi pinapayagang bumoto",
    expectedLabel: "toxic",
    category: "hate",
    description: "Class discrimination",
  },
  {
    id: 85,
    text: "Ang mga bakla at tomboy ay abnormal at dapat ayusin",
    expectedLabel: "toxic",
    category: "hate",
    description: "LGBTQ+ discrimination",
  },
  {
    id: 86,
    text: "Mga babae dapat sa kusina lang, hindi sa trabaho",
    expectedLabel: "toxic",
    category: "hate",
    description: "Sexist statement",
  },
  {
    id: 87,
    text: "Ang mga taga-ibang bansa ay dapat ipabalik sa kanila",
    expectedLabel: "toxic",
    category: "hate",
    description: "Xenophobic comment",
  },
  {
    id: 88,
    text: "Mga Muslim terrorist lahat, dapat bantayan sila!",
    expectedLabel: "toxic",
    category: "hate",
    description: "Religious discrimination",
  },
];

/**
 * Cyberbullying / Personal Attacks Cases (89-94)
 * Personal attacks and bullying in Tagalog
 */
export const tagalogBullyingCases: TestCase[] = [
  {
    id: 89,
    text: "Napaka pangit mo, parang patay na daga ang itsura mo!",
    expectedLabel: "toxic",
    category: "bullying",
    description: "Appearance-based attack",
  },
  {
    id: 90,
    text: "Walang nagmamahal sayo, kaya mag-isa ka palagi",
    expectedLabel: "toxic",
    category: "bullying",
    description: "Social isolation attack",
  },
  {
    id: 91,
    text: "Dapat hindi ka na ipinanganak, pagkakamali ka lang!",
    expectedLabel: "toxic",
    category: "bullying",
    description: "Existential attack",
  },
  {
    id: 92,
    text: "Delete mo na account mo, walang gusto sa opinyon mo!",
    expectedLabel: "toxic",
    category: "bullying",
    description: "Exclusion encouragement",
  },
  {
    id: 93,
    text: "Ang taba mo naman, kain ka na naman ng kain!",
    expectedLabel: "toxic",
    category: "bullying",
    description: "Body shaming",
  },
  {
    id: 94,
    text: "Ang dumi ng bahay nyo, kasing dumi ng ugali mo!",
    expectedLabel: "toxic",
    category: "bullying",
    description: "Personal attack on family",
  },
];

/**
 * Subtle/Disguised Toxicity Cases (95-100)
 * Toxic content wrapped in seemingly polite language
 */
export const tagalogSubtleToxicityCases: TestCase[] = [
  {
    id: 95,
    text: "Hindi naman ako bastos pero ang bobo mo talaga",
    expectedLabel: "toxic",
    category: "subtle",
    description: "Disclaimer before insult",
  },
  {
    id: 96,
    text: "Pasensya na pero ang tanga mo kasi eh",
    expectedLabel: "toxic",
    category: "subtle",
    description: "Apologetic framing with insult",
  },
  {
    id: 97,
    text: "No offense pero ang pangit ng style mo",
    expectedLabel: "toxic",
    category: "subtle",
    description: "No offense prefix with attack",
  },
  {
    id: 98,
    text: "Para sa ikabubuti mo, tigilan mo na ang pagmamagaling mo",
    expectedLabel: "toxic",
    category: "subtle",
    description: "Fake concern with attack",
  },
  {
    id: 99,
    text: "Sa totoo lang, wala kang silbi sa mundo",
    expectedLabel: "toxic",
    category: "subtle",
    description: "Honesty framing with toxic message",
  },
  {
    id: 100,
    text: "Kaibigan, ang pangit ng mukha mo at ugali mo",
    expectedLabel: "toxic",
    category: "subtle",
    description: "Friendly address with insult",
  },
];

// =============================================================================
// COMBINED EXPORTS
// =============================================================================

/**
 * All 50 clean test cases combined
 */
export const tagalogCleanTestCases: TestCase[] = [
  ...tagalogScunthorpeCases,
  ...tagalogAcademicCases,
  ...tagalogMedicalCases,
  ...tagalogGamingCases,
  ...tagalogCookingCases,
  ...tagalogFrustrationCases,
  ...tagalogCriticismCases,
  ...tagalogReligiousCases,
  ...tagalogReportingCases,
];

/**
 * All 50 toxic test cases combined
 */
export const tagalogToxicTestCases: TestCase[] = [
  ...tagalogDirectProfanityCases,
  ...tagalogLeetSpeakCases,
  ...tagalogSpacedCases,
  ...tagalogAcronymCases,
  ...tagalogThreatCases,
  ...tagalogHateSpeechCases,
  ...tagalogBullyingCases,
  ...tagalogSubtleToxicityCases,
];

/**
 * All 100 Tagalog test cases
 */
export const tagalogTestCases: TestCase[] = [
  ...tagalogCleanTestCases,
  ...tagalogToxicTestCases,
];

/**
 * Category summary for documentation
 */
export const tagalogCategoryInfo = {
  clean: {
    total: 50,
    categories: [
      {
        name: "scunthorpe",
        count: 8,
        description: "Words containing profanity substrings",
      },
      {
        name: "academic",
        count: 8,
        description: "Educational/research contexts",
      },
      { name: "medical", count: 6, description: "Medical terminology" },
      { name: "gaming", count: 3, description: "Gaming terminology" },
      { name: "sports", count: 3, description: "Sports commentary" },
      { name: "cooking", count: 4, description: "Cooking instructions" },
      {
        name: "frustration",
        count: 6,
        description: "Clean frustration expressions",
      },
      { name: "criticism", count: 4, description: "Professional criticism" },
      { name: "religious", count: 4, description: "Religious expressions" },
      {
        name: "reporting",
        count: 4,
        description: "Reporting/quoting contexts",
      },
    ],
  },
  toxic: {
    total: 50,
    categories: [
      {
        name: "direct",
        count: 8,
        description: "Direct unobfuscated profanity",
      },
      {
        name: "leet_speak",
        count: 8,
        description: "Character substitution (1337)",
      },
      { name: "spaced", count: 6, description: "Spaced out profanity" },
      { name: "acronym", count: 4, description: "Abbreviated profanity" },
      { name: "threat", count: 6, description: "Threats and violence" },
      { name: "hate", count: 6, description: "Hate speech/discrimination" },
      {
        name: "bullying",
        count: 6,
        description: "Cyberbullying/personal attacks",
      },
      { name: "subtle", count: 6, description: "Politely framed toxicity" },
    ],
  },
};

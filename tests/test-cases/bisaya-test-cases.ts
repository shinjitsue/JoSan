/**
 * Bisaya (Cebuano) Test Cases - 100 Cases for Contextual Analysis
 *
 * 50 CLEAN cases - Text that looks problematic but is actually clean
 * 50 TOXIC cases - Toxic content including obfuscated profanity
 */

import type { TestCase } from "./types";

// =============================================================================
// CLEAN TEST CASES (50 cases) - Should be classified as "clean"
// =============================================================================

/**
 * Scunthorpe-like Problem Cases (1-8)
 * Words containing profanity substrings that are actually clean in Bisaya
 */
export const bisayaScunthorpeCases: TestCase[] = [
  {
    id: 1,
    text: "Ang puti nga baboy naa sa uma",
    expectedLabel: "clean",
    category: "scunthorpe",
    description: "'puti' (white) looks similar to profanity but is color",
  },
  {
    id: 2,
    text: "Naay bugas sa sako, dad-on nato sa balay",
    expectedLabel: "clean",
    category: "scunthorpe",
    description: "'bugas' (rice) sounds similar to 'bugo' but is food",
  },
  {
    id: 3,
    text: "Ang bata nagdula sa parke gamit ang bola",
    expectedLabel: "clean",
    category: "scunthorpe",
    description: "'bata' is clean word for child",
  },
  {
    id: 4,
    text: "Maayo ang panahon karon, hayahay kaayo",
    expectedLabel: "clean",
    category: "scunthorpe",
    description: "'maayo' (good) contains 'maot' substring but is positive",
  },
  {
    id: 5,
    text: "Ang piso naa sa lamesa, kuhaon nako",
    expectedLabel: "clean",
    category: "scunthorpe",
    description: "'piso' (peso/money) sounds similar but is currency",
  },
  {
    id: 6,
    text: "Nindot ang lawas sa imong trabaho, congrats!",
    expectedLabel: "clean",
    category: "scunthorpe",
    description:
      "'lawas' in 'lawas sa trabaho' means body of work, not 'law-ay'",
  },
  {
    id: 7,
    text: "Ang bogaboga sa bukid nindot tan-awon",
    expectedLabel: "clean",
    category: "scunthorpe",
    description: "'bogaboga' (butterflies) contains 'bogo' but is nature term",
  },
  {
    id: 8,
    text: "Ang bogas ilisan nato og bag-o",
    expectedLabel: "clean",
    category: "scunthorpe",
    description: "'bogas' (rice grain) sounds like 'bogo' but is food",
  },
];

/**
 * Academic/Educational Context Cases (9-16)
 * Discussions about sensitive topics in educational settings
 */
export const bisayaAcademicCases: TestCase[] = [
  {
    id: 9,
    text: "Ang pag-tuon bahin sa hate speech importante sa katilingban",
    expectedLabel: "clean",
    category: "academic",
    description: "Academic discussion of hate speech",
  },
  {
    id: 10,
    text: "Gi-research sa mga estudyante ang epekto sa cyberbullying",
    expectedLabel: "clean",
    category: "academic",
    description: "Research about cyberbullying",
  },
  {
    id: 11,
    text: "Ang dokumentaryo nagsaysay sa kasaysayan sa diskriminasyon",
    expectedLabel: "clean",
    category: "academic",
    description: "Documentary about discrimination",
  },
  {
    id: 12,
    text: "Ang thesis nako bahin sa epekto sa dautan nga mga pulong online",
    expectedLabel: "clean",
    category: "academic",
    description: "Thesis topic about profanity online",
  },
  {
    id: 13,
    text: "Gi-discuss sa magtutudlo ang mga bawal nga pulong sa klase",
    expectedLabel: "clean",
    category: "academic",
    description: "Teacher discussing forbidden words",
  },
  {
    id: 14,
    text: "Ang seminar bahin sa kasamok sa pamilya",
    expectedLabel: "clean",
    category: "academic",
    description: "Seminar about domestic violence",
  },
  {
    id: 15,
    text: "Gi-tun-an namo ang mga hinungdan sa pagka-agresibo",
    expectedLabel: "clean",
    category: "academic",
    description: "Study about causes of aggression",
  },
  {
    id: 16,
    text: "Ang libro adunay mga example sa toxic masculinity",
    expectedLabel: "clean",
    category: "academic",
    description: "Book containing examples of toxic masculinity",
  },
];

/**
 * Medical/Health Context Cases (17-22)
 * Medical terminology that might be flagged incorrectly
 */
export const bisayaMedicalCases: TestCase[] = [
  {
    id: 17,
    text: "Ang breast cancer awareness importante para sa kababayen-an",
    expectedLabel: "clean",
    category: "medical",
    description: "Breast cancer awareness",
  },
  {
    id: 18,
    text: "Pakonsulta sa doktor bahin sa imong sexual health",
    expectedLabel: "clean",
    category: "medical",
    description: "Sexual health consultation",
  },
  {
    id: 19,
    text: "Ang reproductive health kinahanglan itudlo sa eskwelahan",
    expectedLabel: "clean",
    category: "medical",
    description: "Reproductive health education",
  },
  {
    id: 20,
    text: "May sakit siya sa lawas, kinahanglan niya og doktor",
    expectedLabel: "clean",
    category: "medical",
    description: "Medical discussion about body illness",
  },
  {
    id: 21,
    text: "Ang mental health pareho ka-importante sa physical health",
    expectedLabel: "clean",
    category: "medical",
    description: "Mental health awareness",
  },
  {
    id: 22,
    text: "Ang mga sintomas sa STD kinahanglan mahibaloan sa tanan",
    expectedLabel: "clean",
    category: "medical",
    description: "STD symptoms education",
  },
];

/**
 * Gaming/Sports Context Cases (23-28)
 * Gaming and sports terminology
 */
export const bisayaGamingCases: TestCase[] = [
  {
    id: 23,
    text: "Gipatay nako ang kalaban sa Mobile Legends, GG!",
    expectedLabel: "clean",
    category: "gaming",
    description: "Gaming terminology - killing enemies",
  },
  {
    id: 24,
    text: "Gibunalan namo ang laing team sa basketball",
    expectedLabel: "clean",
    category: "sports",
    description: "Sports metaphor for winning badly",
  },
  {
    id: 25,
    text: "Ang headshot nako epic kaayo, nag-MVP ko!",
    expectedLabel: "clean",
    category: "gaming",
    description: "Gaming achievement",
  },
  {
    id: 26,
    text: "Gibali namo ang depensa nila sa volleyball",
    expectedLabel: "clean",
    category: "sports",
    description: "Sports terminology - breaking defense",
  },
  {
    id: 27,
    text: "Namatay ko sa dula pero nag-respawn dayon ko",
    expectedLabel: "clean",
    category: "gaming",
    description: "Gaming respawn terminology",
  },
  {
    id: 28,
    text: "Gisakal nako ang kalaban sa wrestling match",
    expectedLabel: "clean",
    category: "sports",
    description: "Wrestling terminology",
  },
];

/**
 * Cooking/Food Context Cases (29-32)
 * Cooking terminology that might seem inappropriate
 */
export const bisayaCookingCases: TestCase[] = [
  {
    id: 29,
    text: "Batiha ang itlog hangtod mahimong mapusok",
    expectedLabel: "clean",
    category: "cooking",
    description: "Cooking instruction - beating eggs",
  },
  {
    id: 30,
    text: "Dugmoka ang ahos ug sibuyas para sa sawsawan",
    expectedLabel: "clean",
    category: "cooking",
    description: "Cooking instruction - crushing garlic",
  },
  {
    id: 31,
    text: "Isagol ang katas sa calamansi sa kinhasun",
    expectedLabel: "clean",
    category: "cooking",
    description: "Recipe instruction with citrus",
  },
  {
    id: 32,
    text: "Ang dugo sa baboy gamiton sa dinuguan, lami kaayo",
    expectedLabel: "clean",
    category: "cooking",
    description: "Filipino dish description - dinuguan",
  },
];

/**
 * Frustration without Profanity Cases (33-38)
 * Expressions of frustration without actual profanity
 */
export const bisayaFrustrationCases: TestCase[] = [
  {
    id: 33,
    text: "Samok kaayo ning sitwasyon nga ni!",
    expectedLabel: "clean",
    category: "frustration",
    description: "Frustrating situation without profanity",
  },
  {
    id: 34,
    text: "Kapoy na kaayo ko, lisod kaayo ni!",
    expectedLabel: "clean",
    category: "frustration",
    description: "Frustration expression",
  },
  {
    id: 35,
    text: "Grabe ka daotan ang adlaw nako karon, tanan sayop!",
    expectedLabel: "clean",
    category: "frustration",
    description: "Bad day expression",
  },
  {
    id: 36,
    text: "Di na nako makaya, lisod kaayo sa kinabuhi!",
    expectedLabel: "clean",
    category: "frustration",
    description: "Life difficulty expression",
  },
  {
    id: 37,
    text: "Ay amo, balik-balik ra ang problema!",
    expectedLabel: "clean",
    category: "frustration",
    description: "Repeated problem frustration",
  },
  {
    id: 38,
    text: "Nasakitan ang akong ulo tungod aning problema!",
    expectedLabel: "clean",
    category: "frustration",
    description: "Headache from problems",
  },
];

/**
 * Professional Criticism Cases (39-42)
 * Strong criticism without profane language
 */
export const bisayaCriticismCases: TestCase[] = [
  {
    id: 39,
    text: "Ang imong presentation dili maayo ug kulang sa detalye",
    expectedLabel: "clean",
    category: "criticism",
    description: "Professional work criticism",
  },
  {
    id: 40,
    text: "Kinahanglan nimo mag-improve sa imong performance",
    expectedLabel: "clean",
    category: "criticism",
    description: "Performance feedback",
  },
  {
    id: 41,
    text: "Dili acceptable ang imong output, usaba",
    expectedLabel: "clean",
    category: "criticism",
    description: "Work rejection feedback",
  },
  {
    id: 42,
    text: "Ang imong plano daghang buho ug dili praktikal",
    expectedLabel: "clean",
    category: "criticism",
    description: "Plan criticism",
  },
];

/**
 * Religious/Cultural Context Cases (43-46)
 * Religious and cultural expressions
 */
export const bisayaReligiousCases: TestCase[] = [
  {
    id: 43,
    text: "Ginoo ko, tabangi kami niining panahona",
    expectedLabel: "clean",
    category: "religious",
    description: "Religious prayer",
  },
  {
    id: 44,
    text: "Hesus Maria Jose, nalate na pud ko sa trabaho!",
    expectedLabel: "clean",
    category: "religious",
    description: "Religious exclamation (not profanity)",
  },
  {
    id: 45,
    text: "Ay Dios ko, ka mahal kaayo ani!",
    expectedLabel: "clean",
    category: "religious",
    description: "Religious exclamation about price",
  },
  {
    id: 46,
    text: "Santo Papa, unsa may nahitabo diri?",
    expectedLabel: "clean",
    category: "religious",
    description: "Religious exclamation common in Bisaya",
  },
];

/**
 * Reporting/Quoting Context Cases (47-50)
 * Discussions that mention or report on profanity
 */
export const bisayaReportingCases: TestCase[] = [
  {
    id: 47,
    text: "Miingon ang biktima nga gitawag siya og 'dautan nga pulong'",
    expectedLabel: "clean",
    category: "reporting",
    description: "Indirect quote without actual profanity",
  },
  {
    id: 48,
    text: "Ang filter nakakita sa pulong 'yawa' sa 50 ka posts",
    expectedLabel: "clean",
    category: "reporting",
    description: "Technical reporting of filtered content",
  },
  {
    id: 49,
    text: "Nagreklamo ang mga user bahin sa dautan nga content",
    expectedLabel: "clean",
    category: "reporting",
    description: "User complaint reporting",
  },
  {
    id: 50,
    text: "Ang study nag-analyze sa paggamit og mura sa social media",
    expectedLabel: "clean",
    category: "reporting",
    description: "Research about profanity usage",
  },
];

// =============================================================================
// TOXIC TEST CASES (50 cases) - Should be classified as "toxic"
// =============================================================================

/**
 * Direct Bisaya Profanity Cases (51-58)
 * Direct, unobfuscated Bisaya profanity
 */
export const bisayaDirectProfanityCases: TestCase[] = [
  {
    id: 51,
    text: "Yawa ka, ka buang nimo oy!",
    expectedLabel: "toxic",
    category: "direct",
    description: "Direct profanity - yawa",
  },
  {
    id: 52,
    text: "Buang ka, wala kay utok nga gigamit!",
    expectedLabel: "toxic",
    category: "direct",
    description: "Direct profanity - buang",
  },
  {
    id: 53,
    text: "Bogo kaayo ka, dili ka kasabot?",
    expectedLabel: "toxic",
    category: "direct",
    description: "Direct profanity - bogo",
  },
  {
    id: 54,
    text: "Piste ka, daotan kaayo imong batasan!",
    expectedLabel: "toxic",
    category: "direct",
    description: "Direct profanity - piste",
  },
  {
    id: 55,
    text: "Linti ka, unsa may imong problema?",
    expectedLabel: "toxic",
    category: "direct",
    description: "Direct profanity - linti",
  },
  {
    id: 56,
    text: "Law-ay kaayo imong nawong ug batasan!",
    expectedLabel: "toxic",
    category: "direct",
    description: "Direct profanity - law-ay",
  },
  {
    id: 57,
    text: "Yati imong kinabuhi, way pulos ka!",
    expectedLabel: "toxic",
    category: "direct",
    description: "Direct profanity - yati",
  },
  {
    id: 58,
    text: "Animal ka, way batasan gyud!",
    expectedLabel: "toxic",
    category: "direct",
    description: "Direct profanity - animal (as insult)",
  },
];

/**
 * Leet Speak / Character Substitution Cases (59-66)
 * Bisaya profanity using number and symbol substitutions
 */
export const bisayaLeetSpeakCases: TestCase[] = [
  {
    id: 59,
    text: "Y4w4 k4, k4 bu4ng nimo!",
    expectedLabel: "toxic",
    category: "leet_speak",
    description: "Yawa with 4 for a",
  },
  {
    id: 60,
    text: "Bu4ng k4 t4l4g4, w4y kwent4!",
    expectedLabel: "toxic",
    category: "leet_speak",
    description: "Buang with 4 for a",
  },
  {
    id: 61,
    text: "B0g0 kaayo ka, dili ka kasabot?",
    expectedLabel: "toxic",
    category: "leet_speak",
    description: "Bogo with 0 for o",
  },
  {
    id: 62,
    text: "P1st3 k4, d40t4n k4ay0 im0ng b4t4s4n!",
    expectedLabel: "toxic",
    category: "leet_speak",
    description: "Piste with 1, 3, and 4",
  },
  {
    id: 63,
    text: "L1nt1 k4, uns4 m4y pr0bl3m4 nim0?",
    expectedLabel: "toxic",
    category: "leet_speak",
    description: "Linti with 1 and symbols",
  },
  {
    id: 64,
    text: "L4w-4y k4ay0 im0ng n4w0ng!",
    expectedLabel: "toxic",
    category: "leet_speak",
    description: "Law-ay with 4 and 0",
  },
  {
    id: 65,
    text: "Y4t1 im0ng k1n4buh1, w4y pul0s k4!",
    expectedLabel: "toxic",
    category: "leet_speak",
    description: "Yati with 4, 1, and 0",
  },
  {
    id: 66,
    text: "4n1m4l k4, w4y b4t4s4n gyud!",
    expectedLabel: "toxic",
    category: "leet_speak",
    description: "Animal with 4 and 1",
  },
];

/**
 * Spaced Profanity Cases (67-72)
 * Bisaya profanity with spaces or separators
 */
export const bisayaSpacedCases: TestCase[] = [
  {
    id: 67,
    text: "Y a w a ka, ka buang nimo!",
    expectedLabel: "toxic",
    category: "spaced",
    description: "Yawa with spaces",
  },
  {
    id: 68,
    text: "B u a n g ka talaga, samok kaayo ka!",
    expectedLabel: "toxic",
    category: "spaced",
    description: "Buang with spaces",
  },
  {
    id: 69,
    text: "B.o.g.o kaayo ka, ngano dili ka kasabot?",
    expectedLabel: "toxic",
    category: "spaced",
    description: "Bogo with dots",
  },
  {
    id: 70,
    text: "P-i-s-t-e ka, ka daotan nimo!",
    expectedLabel: "toxic",
    category: "spaced",
    description: "Piste with hyphens",
  },
  {
    id: 71,
    text: "L_i_n_t_i ka, hilom diha!",
    expectedLabel: "toxic",
    category: "spaced",
    description: "Linti with underscores",
  },
  {
    id: 72,
    text: "L A W - A Y kaayo imong nawong ug batasan!",
    expectedLabel: "toxic",
    category: "spaced",
    description: "Law-ay spaced caps",
  },
];

/**
 * Combined/Compound Insults Cases (73-76)
 * Common Bisaya compound profanity phrases
 */
export const bisayaCompoundCases: TestCase[] = [
  {
    id: 73,
    text: "Pisting yawa ka, samok kaayo!",
    expectedLabel: "toxic",
    category: "compound",
    description: "Compound profanity - pisting yawa",
  },
  {
    id: 74,
    text: "Buang ka yawa, unsay imong gibuhat?",
    expectedLabel: "toxic",
    category: "compound",
    description: "Compound profanity - buang yawa",
  },
  {
    id: 75,
    text: "Bogo ka piste, di ka kasabot og simple!",
    expectedLabel: "toxic",
    category: "compound",
    description: "Compound profanity - bogo piste",
  },
  {
    id: 76,
    text: "Hinampak ka buang, maot imong batasan!",
    expectedLabel: "toxic",
    category: "compound",
    description: "Compound profanity - hinampak buang",
  },
];

/**
 * Death Threats / Violence Cases (77-82)
 * Threats and violent content in Bisaya
 */
export const bisayaThreatCases: TestCase[] = [
  {
    id: 77,
    text: "Patya nalang imong kaugalingon, walay magmahal nimo",
    expectedLabel: "toxic",
    category: "threat",
    description: "Self-harm encouragement",
  },
  {
    id: 78,
    text: "Unta mamatay ka sa imong sakit, deserve nimo na!",
    expectedLabel: "toxic",
    category: "threat",
    description: "Death wish",
  },
  {
    id: 79,
    text: "Pangitaon tika ug sakiton tika, hinumdomi na!",
    expectedLabel: "toxic",
    category: "threat",
    description: "Direct threat",
  },
  {
    id: 80,
    text: "Unta nahulog ka sa hagdan ug namatay ka na!",
    expectedLabel: "toxic",
    category: "threat",
    description: "Wishing harm",
  },
  {
    id: 81,
    text: "Bunalan tika inig kita nato, hulat lang!",
    expectedLabel: "toxic",
    category: "threat",
    description: "Violence threat",
  },
  {
    id: 82,
    text: "Ipapusil tika sa akong mga kaila, pag-amping ka!",
    expectedLabel: "toxic",
    category: "threat",
    description: "Murder threat",
  },
];

/**
 * Hate Speech / Discrimination Cases (83-88)
 * Discriminatory and hateful content in Bisaya
 */
export const bisayaHateSpeechCases: TestCase[] = [
  {
    id: 83,
    text: "Ngano naa mo diri? Balik na mo sa inyong probinsya!",
    expectedLabel: "toxic",
    category: "hate",
    description: "Regional discrimination",
  },
  {
    id: 84,
    text: "Ang mga pobre dili dapat tugotan nga mobotar",
    expectedLabel: "toxic",
    category: "hate",
    description: "Class discrimination",
  },
  {
    id: 85,
    text: "Ang mga bayot ug tomboy abnormal ug kinahanglan ayohon",
    expectedLabel: "toxic",
    category: "hate",
    description: "LGBTQ+ discrimination",
  },
  {
    id: 86,
    text: "Mga babaye dapat sa kusina ra, dili sa trabaho",
    expectedLabel: "toxic",
    category: "hate",
    description: "Sexist statement",
  },
  {
    id: 87,
    text: "Ang mga taga-laing nasud kinahanglan ipabalik sa ila",
    expectedLabel: "toxic",
    category: "hate",
    description: "Xenophobic comment",
  },
  {
    id: 88,
    text: "Mga Muslim terorista tanan, kinahanglan bantayan sila!",
    expectedLabel: "toxic",
    category: "hate",
    description: "Religious discrimination",
  },
];

/**
 * Cyberbullying / Personal Attacks Cases (89-94)
 * Personal attacks and bullying in Bisaya
 */
export const bisayaBullyingCases: TestCase[] = [
  {
    id: 89,
    text: "Ka pangit nimo, sama sa patay nga ilaga imong itsura!",
    expectedLabel: "toxic",
    category: "bullying",
    description: "Appearance-based attack",
  },
  {
    id: 90,
    text: "Walay nagmahal nimo, maoy ra ka kanunay",
    expectedLabel: "toxic",
    category: "bullying",
    description: "Social isolation attack",
  },
  {
    id: 91,
    text: "Dapat wala ka gipanganak, sayop ka lang!",
    expectedLabel: "toxic",
    category: "bullying",
    description: "Existential attack",
  },
  {
    id: 92,
    text: "Delete na imong account, walay gusto sa imong opinyon!",
    expectedLabel: "toxic",
    category: "bullying",
    description: "Exclusion encouragement",
  },
  {
    id: 93,
    text: "Ka tambok nimo, kaon napud ka og kaon!",
    expectedLabel: "toxic",
    category: "bullying",
    description: "Body shaming",
  },
  {
    id: 94,
    text: "Ka hugaw sa inyong balay, sama ka hugaw sa imong batasan!",
    expectedLabel: "toxic",
    category: "bullying",
    description: "Personal attack on family",
  },
];

/**
 * Subtle/Disguised Toxicity Cases (95-100)
 * Toxic content wrapped in seemingly polite language
 */
export const bisayaSubtleToxicityCases: TestCase[] = [
  {
    id: 95,
    text: "Dili ko bastos pero bogo ka gyud talaga",
    expectedLabel: "toxic",
    category: "subtle",
    description: "Disclaimer before insult",
  },
  {
    id: 96,
    text: "Pasensya na pero buang ka man gud",
    expectedLabel: "toxic",
    category: "subtle",
    description: "Apologetic framing with insult",
  },
  {
    id: 97,
    text: "No offense pero law-ay kaayo imong style",
    expectedLabel: "toxic",
    category: "subtle",
    description: "No offense prefix with attack",
  },
  {
    id: 98,
    text: "Para sa imong kaayohan, undanga na ang imong pagpangita og away",
    expectedLabel: "toxic",
    category: "subtle",
    description: "Fake concern with attack",
  },
  {
    id: 99,
    text: "Sa tinuod lang, walay pulos ka sa kalibutan",
    expectedLabel: "toxic",
    category: "subtle",
    description: "Honesty framing with toxic message",
  },
  {
    id: 100,
    text: "Higala, ka pangit sa imong nawong ug batasan",
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
export const bisayaCleanTestCases: TestCase[] = [
  ...bisayaScunthorpeCases,
  ...bisayaAcademicCases,
  ...bisayaMedicalCases,
  ...bisayaGamingCases,
  ...bisayaCookingCases,
  ...bisayaFrustrationCases,
  ...bisayaCriticismCases,
  ...bisayaReligiousCases,
  ...bisayaReportingCases,
];

/**
 * All 50 toxic test cases combined
 */
export const bisayaToxicTestCases: TestCase[] = [
  ...bisayaDirectProfanityCases,
  ...bisayaLeetSpeakCases,
  ...bisayaSpacedCases,
  ...bisayaCompoundCases,
  ...bisayaThreatCases,
  ...bisayaHateSpeechCases,
  ...bisayaBullyingCases,
  ...bisayaSubtleToxicityCases,
];

/**
 * All 100 Bisaya test cases
 */
export const bisayaTestCases: TestCase[] = [
  ...bisayaCleanTestCases,
  ...bisayaToxicTestCases,
];

/**
 * Category summary for documentation
 */
export const bisayaCategoryInfo = {
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
      { name: "compound", count: 4, description: "Compound profanity phrases" },
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

/**
 * Phonetic helper - Generate phonetic variants of names for better STT recognition
 * Helps Deepgram recognize names even with accent/pronunciation variations
 */

// Vietnamese phonetic patterns for common name transcription errors
const PHONETIC_PATTERNS: Record<string, string[]> = {
  // Vowels
  a: ["ă", "â", "á", "à", "ả", "ã", "ạ"],
  e: ["ê", "é", "è", "ẻ", "ẽ", "ẹ"],
  i: ["í", "ì", "ỉ", "ĩ", "ị"],
  o: ["ô", "ơ", "ó", "ò", "ỏ", "õ", "ọ"],
  u: ["ư", "ú", "ù", "ủ", "ũ", "ụ"],
  y: ["ý", "ỳ", "ỷ", "ỹ", "ỵ"],

  // Common consonant confusions in STT
  c: ["k", "q"],
  k: ["c", "q"],
  ch: ["tr", "tch"],
  tr: ["ch"],
  th: ["t", "th"],
  ph: ["f", "v"],
  d: ["đ", "th"],
  đ: ["d"],
  x: ["s", "x"],
  v: ["b", "v"],
}

/**
 * Generate phonetic variants of a name for STT hints
 * Example: "Nicko" -> ["Nicko", "Nickô", "Nícko", "Nicho", "Ninco", ...]
 */
export function generatePhoneticVariants(name: string): string[] {
  const variants = new Set<string>()

  // Add original name
  variants.add(name.toLowerCase())

  // Add common Vietnamese STT misrecognitions
  // Examples:
  // - "Nicko" might be heard as "Nícko", "Niko", "Niquo", etc.

  const lowerName = name.toLowerCase()

  // 1. Remove diacritics variant
  const noDiacritics = lowerName
    .replace(/[áàảãạăằắẳẵặâầấẩẫậ]/g, "a")
    .replace(/[éèẻẽẹêềếểễệ]/g, "e")
    .replace(/[íìỉĩị]/g, "i")
    .replace(/[óòỏõọôồốổỗộơờớởỡợ]/g, "o")
    .replace(/[úùủũụưừứửữự]/g, "u")
    .replace(/[ýỳỷỹỵ]/g, "y")
    .replace(/đ/g, "d")

  if (noDiacritics !== lowerName) {
    variants.add(noDiacritics)
  }

  // 2. Common phonetic substitutions for Vietnamese
  // c/k confusion
  if (lowerName.includes("c")) {
    variants.add(lowerName.replace(/c/g, "k"))
  }
  if (lowerName.includes("k")) {
    variants.add(lowerName.replace(/k/g, "c"))
  }

  // ch/tr confusion
  if (lowerName.includes("ch")) {
    variants.add(lowerName.replace(/ch/g, "tr"))
  }
  if (lowerName.includes("tr")) {
    variants.add(lowerName.replace(/tr/g, "ch"))
  }

  // th/t confusion
  if (lowerName.includes("th")) {
    variants.add(lowerName.replace(/th/g, "t"))
  }

  // v/b confusion
  if (lowerName.includes("v")) {
    variants.add(lowerName.replace(/v/g, "b"))
  }
  if (lowerName.includes("b")) {
    variants.add(lowerName.replace(/b/g, "v"))
  }

  // x/s confusion
  if (lowerName.includes("x")) {
    variants.add(lowerName.replace(/x/g, "s"))
  }
  if (lowerName.includes("s")) {
    variants.add(lowerName.replace(/s/g, "x"))
  }

  // 3. Space/no-space variants
  if (lowerName.includes(" ")) {
    variants.add(lowerName.replace(/\s+/g, ""))
  }

  // 4. Common single-character variations
  // Nicko -> Niko, Nicô, Nikô, Nicô, etc.
  if (lowerName.length >= 3) {
    // Try removing each character
    for (let i = 0; i < lowerName.length; i++) {
      const variant = lowerName.slice(0, i) + lowerName.slice(i + 1)
      if (variant.length > 2) {
        variants.add(variant)
      }
    }
  }

  return Array.from(variants)
}

/**
 * Generate STT keywords from contact list
 * Includes name + phonetic variants
 */
export function generateSTTKeywords(contactNames: string[]): string[] {
  const keywords = new Set<string>()

  for (const name of contactNames) {
    // Add all phonetic variants
    const variants = generatePhoneticVariants(name)
    variants.forEach((v) => keywords.add(v))
  }

  return Array.from(keywords)
}

/**
 * Example usage:
 *
 * const contacts = ["Nicko", "Lecoo", "John"];
 * const keywords = generateSTTKeywords(contacts);
 * // keywords = ["nicko", "niko", "nicô", "nicho", ..., "lecoo", "lecô", ..., "john"]
 *
 * // Pass to backend STT:
 * const response = await mockApiCall(audioBase64, {
 *   sttKeywords: keywords,
 * });
 */

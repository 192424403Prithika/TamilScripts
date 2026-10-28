import json
import os

def generate_tamil_unicode_map():
    # 12 vowels (Uyir)
    vowels = [
        ("அ", "a", "U+0B85", "short 'a' as in 'cup'", 2),
        ("ஆ", "aa", "U+0B86", "long 'aa' as in 'father'", 3),
        ("இ", "i", "U+0B87", "short 'i' as in 'bit'", 3),
        ("ஈ", "ee", "U+0B88", "long 'ee' as in 'feet'", 3),
        ("உ", "u", "U+0B89", "short 'u' as in 'put'", 2),
        ("ஊ", "oo", "U+0B8A", "long 'oo' as in 'boot'", 3),
        ("எ", "e", "U+0B8E", "short 'e' as in 'bed'", 2),
        ("ஏ", "ae", "U+0B8F", "long 'ae' as in 'make'", 2),
        ("ஐ", "ai", "U+0B90", "diphthong 'ai' as in 'eye'", 3),
        ("ஒ", "o", "U+0B92", "short 'o' as in 'pot'", 3),
        ("ஓ", "oa", "U+0B93", "long 'oa' as in 'boat'", 3),
        ("ஔ", "au", "U+0B94", "diphthong 'au' as in 'cow'", 4),
    ]

    # Special / Ayutham
    ayutham = [("ஃ", "ak", "U+0B83", "Ayutha Ezhuthu (visarga/gemination marker)", 3)]

    # 18 Consonants (Mei) with pulli
    pure_consonants = [
        ("க்", "k", "U+0B95 U+0BCD", "velar plosive 'k'", 3),
        ("ங்", "ng", "U+0B99 U+0BCD", "velar nasal 'ng'", 3),
        ("ச்", "ch", "U+0B9A U+0BCD", "palatal affricate 'ch'", 3),
        ("ஞ்", "nj", "U+0B9E U+0BCD", "palatal nasal 'ny'", 4),
        ("ட்", "t", "U+0B9F U+0BCD", "retroflex plosive 't'", 2),
        ("ண்", "N", "U+0BA3 U+0BCD", "retroflex nasal 'N'", 4),
        ("த்", "th", "U+0BA4 U+0BCD", "dental plosive 'th'", 3),
        ("ந்", "nth", "U+0BA8 U+0BCD", "dental nasal 'n'", 3),
        ("ப்", "p", "U+0BAA U+0BCD", "bilabial plosive 'p'", 2),
        ("ம்", "m", "U+0BAE U+0BCD", "bilabial nasal 'm'", 3),
        ("ய்", "y", "U+0BAF U+0BCD", "palatal approximant 'y'", 3),
        ("ர்", "r", "U+0BB0 U+0BCD", "alveolar flap 'r'", 2),
        ("ல்", "l", "U+0BB2 U+0BCD", "alveolar lateral 'l'", 3),
        ("வ்", "v", "U+0BB5 U+0BCD", "labiodental approximant 'v'", 3),
        ("ழ்", "zh", "U+0BB4 U+0BCD", "retroflex approximant 'zh'", 3),
        ("ள்", "L", "U+0BB3 U+0BCD", "retroflex lateral 'L'", 3),
        ("ற்", "R", "U+0BB1 U+0BCD", "alveolar trill 'R'", 3),
        ("ன்", "n", "U+0BA9 U+0BCD", "alveolar nasal 'n'", 3),
    ]

    # Base consonants without pulli (Uyirmei root with 'a')
    base_consonants = [
        ("க", "ka", "U+0B95", "consonant 'ka'", 2),
        ("ங", "nga", "U+0B99", "consonant 'nga'", 2),
        ("ச", "cha", "U+0B9A", "consonant 'cha'", 2),
        ("ஞ", "nja", "U+0B9E", "consonant 'nya'", 3),
        ("ட", "ta", "U+0B9F", "consonant 'ta'", 1),
        ("ண", "Na", "U+0BA3", "consonant 'Na'", 3),
        ("த", "tha", "U+0BA4", "consonant 'tha'", 2),
        ("ந", "na", "U+0BA8", "consonant 'na'", 2),
        ("ப", "pa", "U+0BAA", "consonant 'pa'", 1),
        ("ம", "ma", "U+0BAE", "consonant 'ma'", 2),
        ("ய", "ya", "U+0BAF", "consonant 'ya'", 2),
        ("ர", "ra", "U+0BB0", "consonant 'ra'", 1),
        ("ல", "la", "U+0BB2", "consonant 'la'", 2),
        ("வ", "va", "U+0BB5", "consonant 'va'", 2),
        ("ழ", "zha", "U+0BB4", "consonant 'zha'", 2),
        ("ள", "La", "U+0BB3", "consonant 'La'", 2),
        ("ற", "Ra", "U+0BB1", "consonant 'Ra'", 2),
        ("ன", "na", "U+0BA9", "consonant 'na'", 2),
    ]

    # Grantha
    grantha = [
        ("ஜ", "ja", "U+0B9C", "Grantha consonant 'ja'", 3),
        ("ஷ", "sha", "U+0BA7", "Grantha consonant 'sha'", 3),
        ("ஸ", "sa", "U+0BB8", "Grantha consonant 'sa'", 3),
        ("ஹ", "ha", "U+0BB9", "Grantha consonant 'ha'", 3),
        ("க்ஷ", "ksha", "U+0B95 U+0BCD U+0BA7", "Grantha ligature 'ksha'", 4),
        ("ஸ்ரீ", "sri", "U+0BB8 U+0BCD U+0BB0 U+0BC0", "Auspicious symbol 'sri'", 4),
    ]

    # Vowel signs to create uyirmei compounds
    # Signs: aa (ா), i (ி), ee (ீ), u (ு), oo (ூ), e (ெ), ae (ே), ai (ை), o (ொ), oa (ோ), au (ௌ)
    vowel_signs = [
        ("ா", "aa", 1),
        ("ி", "i", 1),
        ("ீ", "ee", 1),
        ("ு", "u", 1),
        ("ூ", "oo", 1),
        ("ெ", "e", 1),
        ("ே", "ae", 1),
        ("ை", "ai", 1),
        ("ொ", "o", 2),
        ("ோ", "oa", 2),
        ("ௌ", "au", 2),
    ]

    classes = []
    cid = 0

    # 1. Add Vowels
    for char, trans, ucode, mean, strokes in vowels:
        classes.append({
            "id": cid,
            "char": char,
            "transliteration": trans,
            "category": "vowel",
            "unicode": ucode,
            "meaning": mean,
            "stroke_count": strokes
        })
        cid += 1

    # 2. Add Ayutham
    for char, trans, ucode, mean, strokes in ayutham:
        classes.append({
            "id": cid,
            "char": char,
            "transliteration": trans,
            "category": "special",
            "unicode": ucode,
            "meaning": mean,
            "stroke_count": strokes
        })
        cid += 1

    # 3. Add Pure Consonants
    for char, trans, ucode, mean, strokes in pure_consonants:
        classes.append({
            "id": cid,
            "char": char,
            "transliteration": trans,
            "category": "pure_consonant",
            "unicode": ucode,
            "meaning": mean,
            "stroke_count": strokes
        })
        cid += 1

    # 4. Add Base Consonants
    for char, trans, ucode, mean, strokes in base_consonants:
        classes.append({
            "id": cid,
            "char": char,
            "transliteration": trans,
            "category": "consonant",
            "unicode": ucode,
            "meaning": mean,
            "stroke_count": strokes
        })
        cid += 1

    # 5. Add Grantha
    for char, trans, ucode, mean, strokes in grantha:
        classes.append({
            "id": cid,
            "char": char,
            "transliteration": trans,
            "category": "grantha",
            "unicode": ucode,
            "meaning": mean,
            "stroke_count": strokes
        })
        cid += 1

    # 6. Fill remaining uyirmei compounds up to 156 classes
    # Combining primary consonants with key vowel diacritics
    primary_bases = ["க", "ச", "ட", "த", "ப", "ம", "ய", "ர", "ல", "வ"]
    for base in primary_bases:
        base_name = [b[1] for b in base_consonants if b[0] == base][0][:-1]
        for vs, vs_trans, extra_s in vowel_signs:
            if cid >= 156:
                break
            compound_char = f"{base}{vs}"
            classes.append({
                "id": cid,
                "char": compound_char,
                "transliteration": f"{base_name}{vs_trans}",
                "category": "vowel_consonant",
                "unicode": " ".join([f"U+{ord(c):04X}" for c in compound_char]),
                "meaning": f"Compound '{base_name}{vs_trans}'",
                "stroke_count": 2 + extra_s
            })
            cid += 1
        if cid >= 156:
            break

    # If any remaining slots to reach exactly 156
    additional_bases = ["ண", "ந", "ள", "ன", "ழ"]
    for base in additional_bases:
        base_name = [b[1] for b in base_consonants if b[0] == base][0][:-1]
        for vs, vs_trans, extra_s in vowel_signs:
            if cid >= 156:
                break
            compound_char = f"{base}{vs}"
            classes.append({
                "id": cid,
                "char": compound_char,
                "transliteration": f"{base_name}{vs_trans}",
                "category": "vowel_consonant",
                "unicode": " ".join([f"U+{ord(c):04X}" for c in compound_char]),
                "meaning": f"Compound '{base_name}{vs_trans}'",
                "stroke_count": 2 + extra_s
            })
            cid += 1
        if cid >= 156:
            break

    return classes

if __name__ == "__main__":
    data = generate_tamil_unicode_map()
    output_path = os.path.join(os.path.dirname(__file__), "unicode_map.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Generated {len(data)} Tamil character classes in {output_path}")

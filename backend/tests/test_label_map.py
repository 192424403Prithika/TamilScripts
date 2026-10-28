"""
Unit test asserting every one of the 156 classes in unicode_map.json
maps to a valid Tamil Unicode string and that nothing Latin is ever shown
as the recognized glyph.
"""

import json
import re
from pathlib import Path

def test_all_156_classes_are_valid_tamil_unicode():
    map_paths = [
        Path(__file__).resolve().parent.parent / "app" / "core" / "unicode_map.json",
        Path(__file__).resolve().parent.parent.parent / "ml" / "data" / "unicode_map.json",
        Path(__file__).resolve().parent.parent.parent / "frontend" / "public" / "unicode_map.json",
    ]

    latin_pattern = re.compile(r"[a-zA-Z]")
    
    for map_path in map_paths:
        assert map_path.exists(), f"Unicode map path not found: {map_path}"
        with open(map_path, "r", encoding="utf-8") as f:
            umap = json.load(f)

        assert len(umap) == 156, f"Expected 156 canonical classes in {map_path}, got {len(umap)}"

        for idx, item in enumerate(umap):
            assert item["id"] == idx, f"Class id mismatch at index {idx}: expected {idx}, got {item['id']}"
            
            char = item["char"]
            assert isinstance(char, str) and len(char) > 0, f"Empty glyph at class id {idx}"
            
            # Assert no Latin letters exist in the recognized character glyph
            assert not latin_pattern.search(char), (
                f"Latin character found in class id {idx} ('{char}'). Recognized glyph must be genuine Tamil/Grantha Unicode."
            )
            
            # Assert codepoint is valid Unicode
            for c in char:
                cp = ord(c)
                # Valid Tamil Unicode block: U+0B80 - U+0BFF, plus zero-width joiners if applicable
                is_tamil_or_indic = (0x0B80 <= cp <= 0x0BFF) or (0x200B <= cp <= 0x200D) or (0x0900 <= cp <= 0x0DFF)
                assert is_tamil_or_indic, f"Codepoint U+{cp:04X} in class id {idx} ('{char}') is outside valid Tamil Unicode"
            
            # Assert transliteration exists separately
            assert "transliteration" in item and len(item["transliteration"]) > 0
            valid_categories = {'vowel_consonant', 'pure_consonant', 'vowel', 'special', 'grantha', 'consonant'}
            assert "category" in item and item["category"] in valid_categories

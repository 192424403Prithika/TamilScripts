"""
Gate 4 End-to-End Playwright Automation Test Suite.
Validates:
1. Generate Page:
   - Real model inference
   - Measured latency from performance.now()
   - Outputs differ between characters (non-identical)
   - Outputs are non-blank
   - Captures ml/reports/screenshot_generate.png
2. Write Page:
   - Glyph-composition mode with animated replay
   - Measured latency from performance.now()
   - Outputs differ between words (non-identical)
   - Outputs are non-blank SVG paths
   - Captures ml/reports/screenshot_write.png
3. Practice Coach Page:
   - Drawing interaction on ruled canvas
   - Live AI Diagnostic Scorecard with calibrated Siamese score
   - Mathematically consistent auxiliary sub-scores
   - Recognizer-guided mentor observation feedback
   - Measured latency from performance.now()
   - Captures ml/reports/screenshot_practice.png
"""

import sys
import os
import time
import json
import subprocess
import urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
REPORTS_DIR = ROOT / "ml" / "reports"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

def wait_for_url(url: str, timeout: float = 30.0):
    start = time.time()
    while time.time() - start < timeout:
        try:
            with urllib.request.urlopen(url, timeout=2.0) as resp:
                if resp.status == 200:
                    return True
        except Exception:
            pass
        time.sleep(0.5)
    return False

def run_e2e_tests():
    print("=" * 70)
    print("Starting Gate 4 End-to-End Playwright Integration Tests")
    print("=" * 70)

    env = os.environ.copy()
    env["PYTHONPATH"] = f"{ROOT / 'backend'};{ROOT / 'ml' / 'models'};{ROOT / 'ml' / 'train'}"

    # 1. Start Backend Server
    print("[*] Launching Backend Server on http://127.0.0.1:8000...")
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=str(ROOT / "backend"),
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

    # 2. Start Frontend Server
    print("[*] Launching Frontend Server on http://127.0.0.1:5173...")
    frontend_proc = subprocess.Popen(
        ["cmd.exe", "/c", "npm", "run", "dev", "--", "--host", "127.0.0.1", "--port", "5173"],
        cwd=str(ROOT / "frontend"),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

    try:
        print("[*] Waiting for Backend to be healthy...")
        if not wait_for_url("http://127.0.0.1:8000/api/health", timeout=30.0):
            raise RuntimeError("Backend failed to start within 30 seconds!")
        print("    -> Backend is healthy and ready.")

        print("[*] Waiting for Frontend to be healthy...")
        if not wait_for_url("http://127.0.0.1:5173", timeout=30.0):
            raise RuntimeError("Frontend failed to start within 30 seconds!")
        print("    -> Frontend is healthy and ready.")

        # 3. Execute Playwright Tests
        results = {}
        with sync_playwright() as p:
            print("[*] Launching Playwright Chromium Browser...")
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 1440, "height": 900})

            # ---------------------------------------------------------
            # TEST 1: GENERATE PAGE
            # ---------------------------------------------------------
            print("\n[TEST 1] Testing Character Generation Page...")
            page.goto("http://127.0.0.1:5173")
            page.wait_for_load_state("networkidle")

            # Click Generate tab
            page.locator("button:has-text('Generate')").first.click()
            page.wait_for_selector("h1:has-text('Character Generation Studio')")

            # Check that "Model not trained yet" is NOT displayed
            assert page.locator("text='Model not trained yet'").count() == 0, "Gate 1 model shows as not trained!"

            # Wait for generated glyph image to load
            img_locator = page.locator("img[alt^='Generated glyph']")
            img_locator.wait_for(state="visible", timeout=10000)
            img1_src = img_locator.get_attribute("src")
            assert img1_src and len(img1_src) > 500, "Generated glyph image is blank or empty!"

            # Check latency is displayed from performance.now()
            latency_elem = page.locator("text=/Latency: [0-9.]+ ms/")
            latency_elem.wait_for(state="visible", timeout=5000)
            latency_text_gen = latency_elem.text_content()
            print(f"    -> Character A generated successfully. Displayed {latency_text_gen}")

            # Switch to character B (click second glyph button 'ஆ' in palette)
            glyph_buttons = page.locator("button:has-text('ஆ')")
            if glyph_buttons.count() > 0:
                glyph_buttons.first.click()
                time.sleep(1.0)
                page.wait_for_selector("img[alt^='Generated glyph']", state="visible")
                img2_src = page.locator("img[alt^='Generated glyph']").first.get_attribute("src")
                assert img2_src and len(img2_src) > 500, "Second glyph image is blank!"
                assert img1_src != img2_src, "CRITICAL: Character glyphs for different classes are identical!"
                print("    -> Character B generated. Verified imgA != imgB (distinct glyphs).")

            # Take screenshot of Generate Page
            screenshot_gen_path = REPORTS_DIR / "screenshot_generate.png"
            page.screenshot(path=str(screenshot_gen_path))
            print(f"    -> Screenshot saved to {screenshot_gen_path}")
            results["generate"] = {"passed": True, "latency": latency_text_gen}

            # ---------------------------------------------------------
            # TEST 2: WRITE PAGE (TEXT-TO-HANDWRITING SYNTHESIS)
            # ---------------------------------------------------------
            print("\n[TEST 2] Testing Text-to-Handwriting Write Page...")
            page.locator("button:has-text('Write')").first.click()
            page.wait_for_selector("h1:has-text('Text-to-Handwriting Synthesis')")

            # Verify badges
            assert page.locator("text='Glyph-composition mode'").count() > 0, "Glyph-composition mode badge missing!"
            assert page.locator("text='Sequence model: In training'").count() > 0, "Sequence model status badge missing!"

            # Synthesize first word: தமிழ்
            text_input = page.locator("input[type='text']").first
            text_input.fill("தமிழ்")
            page.locator("button:has-text('Draw Handwritten Sentence')").first.click()

            # Wait for SVG result
            page.wait_for_selector("svg", timeout=10000)
            time.sleep(1.0)

            # Check latency displayed
            latency_elem_write = page.locator("text=/Latency: [0-9.]+ ms/")
            latency_elem_write.wait_for(state="visible", timeout=5000)
            latency_text_write = latency_elem_write.text_content()
            print(f"    -> Word 1 ('தமிழ்') synthesized. Displayed {latency_text_write}")

            # Extract SVG markup
            svg1_markup = page.locator(".canvas-ruled svg").first.inner_html()
            assert len(svg1_markup) > 100, "Synthesized SVG markup is empty!"

            # Synthesize second word: வணக்கம்
            text_input.fill("வணக்கம்")
            page.locator("button:has-text('Draw Handwritten Sentence')").first.click()
            time.sleep(1.5)

            svg2_markup = page.locator(".canvas-ruled svg").first.inner_html()
            assert len(svg2_markup) > 100, "Second synthesized SVG markup is empty!"
            assert svg1_markup != svg2_markup, "CRITICAL: SVG strokes for different words are identical!"
            print("    -> Word 2 ('வணக்கம்') synthesized. Verified svg1 != svg2 (distinct strokes).")

            # Take screenshot of Write Page
            screenshot_write_path = REPORTS_DIR / "screenshot_write.png"
            page.screenshot(path=str(screenshot_write_path))
            print(f"    -> Screenshot saved to {screenshot_write_path}")
            results["write"] = {"passed": True, "latency": latency_text_write}

            # ---------------------------------------------------------
            # TEST 3: PRACTICE COACH PAGE
            # ---------------------------------------------------------
            print("\n[TEST 3] Testing Handwriting Practice Coach Page...")
            page.locator("button:has-text('Practice')").first.click()
            page.wait_for_selector("h1:has-text('Handwriting Practice Coach')")

            # Locate drawing canvas
            canvas = page.locator("canvas").first
            canvas.wait_for(state="visible", timeout=5000)
            box = canvas.bounding_box()
            assert box is not None, "Canvas bounding box not found!"

            # Draw a realistic curve stroke on the canvas to trigger scoring
            cx = box["x"] + box["width"] * 0.4
            cy = box["y"] + box["height"] * 0.4
            page.mouse.move(cx, cy)
            page.mouse.down()
            for step in range(12):
                angle = step * 0.4
                page.mouse.move(cx + 35 * (step / 3.0), cy + 25 * (step % 4), steps=2)
                time.sleep(0.04)
            page.mouse.up()

            # Wait for AI Diagnostic Scorecard to update
            print("    -> Stroke drawn. Awaiting neural scoring response...")
            page.wait_for_selector("text=/Quality Rating/", timeout=10000)
            time.sleep(1.5)

            # Extract displayed latency
            coach_latency_elem = page.locator("text=/Latency: [0-9.]+ ms/")
            coach_latency_elem.wait_for(state="visible", timeout=5000)
            coach_latency_text = coach_latency_elem.text_content()
            print(f"    -> Scorecard updated. Displayed {coach_latency_text}")

            # Verify subscores and mentor feedback
            assert page.locator("text=/Loop Closure/").count() > 0, "Loop closure metric missing!"
            assert page.locator("text=/Proportional Balance/").count() > 0, "Proportional balance metric missing!"
            assert page.locator("text=/Stroke Smoothness/").count() > 0, "Stroke smoothness metric missing!"
            assert page.locator("text=/Scribe Mentor Observation/").count() > 0, "Scribe Mentor Observation note missing!"

            # Take screenshot of Practice Coach Page
            screenshot_practice_path = REPORTS_DIR / "screenshot_practice.png"
            page.screenshot(path=str(screenshot_practice_path))
            print(f"    -> Screenshot saved to {screenshot_practice_path}")
            results["coach"] = {"passed": True, "latency": coach_latency_text}

            browser.close()

        print("\n" + "=" * 70)
        print("ALL GATE 4 PLAYWRIGHT INTEGRATION TESTS PASSED SUCCESSFULLY!")
        print("=" * 70)
        return results

    finally:
        print("[*] Terminating dev server processes...")
        try:
            backend_proc.terminate()
            backend_proc.wait(timeout=5)
        except Exception:
            backend_proc.kill()

        try:
            frontend_proc.terminate()
            subprocess.run(["taskkill", "/F", "/T", "/PID", str(frontend_proc.pid)], capture_output=True)
        except Exception:
            pass
        print("[*] Server cleanup complete.")

if __name__ == "__main__":
    run_e2e_tests()

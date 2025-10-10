import os
import json
from playwright.sync_api import sync_playwright, expect

def run_verification():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Get the absolute path to the index.html file
        file_path = os.path.abspath('index.html')
        page.goto(f'file://{file_path}')

        # --- Inject Test Data ---
        # Add games with various durations to properly test the filter
        test_games = [
            {"id": 1001, "nom": "Game 50min", "proprietaire": "Test", "min_joueurs": 1, "max_joueurs": 2, "duree": 50, "age_min": 8, "description": ""},
            {"id": 1002, "nom": "Game 300min", "proprietaire": "Test", "min_joueurs": 2, "max_joueurs": 4, "duree": 300, "age_min": 12, "description": ""},
            {"id": 1003, "nom": "Game 360min", "proprietaire": "Test", "min_joueurs": 1, "max_joueurs": 1, "duree": 360, "age_min": 10, "description": ""},
            {"id": 1004, "nom": "Game 400min", "proprietaire": "Test", "min_joueurs": 3, "max_joueurs": 5, "duree": 400, "age_min": 14, "description": "This one should be hidden"},
        ]

        # This JS code sets up the test data in localStorage before the app loads
        page.evaluate(f"""() => {{
            const data = {{
                "produits": [],
                "membres": [],
                "transactions": [],
                "ludotheque": {json.dumps(test_games)},
                "adhesions": [],
                "evenements": [],
                "annonces": [],
                "settings": {{ "lastGameId": 1004 }}
            }};
            localStorage.setItem('gdjData', JSON.stringify(data));
        }}""")

        # Reload the page to ensure the app uses the injected data
        page.reload()

        # --- Register Admin User ---
        page.get_by_role("link", name="S'inscrire").click()
        expect(page.get_by_role("heading", name="Inscription")).to_be_visible()

        pseudo = "admin_verifier_1234"
        page.locator("#registerPseudo").fill(pseudo)
        page.locator("#registerNom").fill("Verifier")
        page.locator("#registerPrenom").fill("Admin")
        page.locator("#registerPassword").fill("password123")
        page.locator("#registerPasswordConfirm").fill("password123")
        page.get_by_role("button", name="S'inscrire").click()

        # Dismiss all dialogs
        page.wait_for_selector(".custom-dialog")
        page.evaluate("() => { document.querySelectorAll('.custom-dialog').forEach(d => d.remove()) }")

        # --- Login as Admin ---
        expect(page.get_by_role("heading", name="Connexion")).to_be_visible()
        page.locator("#loginPseudo").fill(pseudo)
        page.locator("#loginPassword").fill("password123")
        page.get_by_role("button", name="Se connecter").click()

        # --- Verify Filtering Logic ---
        expect(page.get_by_role("heading", name="Les Gardiens du Jeu - Administration")).to_be_visible()

        # Navigate to Ludothèque tab
        page.locator('#adminPage .tab-btn[data-tab="ludotheque"]').click()
        ludotheque_tab = page.locator("#ludothequeTab")
        expect(ludotheque_tab).to_be_visible()

        # Click the new filter
        filter_button = ludotheque_tab.get_by_role("button", name="≤ 360 min")
        expect(filter_button).to_be_visible()
        filter_button.click()

        # Assertions to verify the filter works correctly
        expect(ludotheque_tab.get_by_text("Game 50min")).to_be_visible()
        expect(ludotheque_tab.get_by_text("Game 300min")).to_be_visible()
        expect(ludotheque_tab.get_by_text("Game 360min")).to_be_visible()
        expect(ludotheque_tab.get_by_text("Game 400min")).not_to_be_visible()

        print("Filter functionality verified successfully.")

        screenshot_path = "jules-scratch/verification/verification.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    run_verification()
import asyncio
from playwright.sync_api import sync_playwright, expect
import os

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Get absolute path for index.html
    index_path = "file://" + os.path.abspath("index.html")
    page.goto(index_path)

    # --- 1. Register Admin User ---
    page.locator("#showRegister").click()
    page.locator("#registerPseudo").fill("admin")
    page.locator("#registerNom").fill("Admin")
    page.locator("#registerPrenom").fill("User")
    page.locator("#registerPassword").fill("password")
    page.locator("#registerPasswordConfirm").fill("password")
    page.locator("#registerForm button[type='submit']").click()

    # Handle multiple dialogs: network error is on top, handle it first.
    network_error_dialog = page.locator(".custom-dialog.active", has_text="Erreur réseau")
    expect(network_error_dialog).to_be_visible()
    network_error_dialog.get_by_role("button", name="OK").click()

    registration_dialog = page.locator(".custom-dialog.active", has_text="Inscription réussie")
    expect(registration_dialog).to_be_visible()
    registration_dialog.get_by_role("button", name="OK").click()

    # --- 2. Login as Admin ---
    expect(page.locator("#loginPage")).to_be_visible()
    page.locator("#loginPseudo").fill("admin")
    page.locator("#loginPassword").fill("password")
    page.locator("#loginForm button[type='submit']").click()

    # --- 3. Navigate to Ludothèque and add games ---
    expect(page.locator("#adminPage")).to_be_visible()
    page.locator(".tab-btn[data-tab='ludotheque']").click()

    def add_game(name, duration):
        page.locator("#addGameBtn").click()
        # Wait for the form to be visible before interacting with it
        expect(page.locator("#gameForm")).to_be_visible()

        page.locator("#gameNom").fill(name)
        page.locator("#gameProprietaire").fill("me")
        page.locator("#gameMinJoueurs").fill("2")
        page.locator("#gameMaxJoueurs").fill("4")
        page.locator("#gameDuree").fill(str(duration))
        page.locator("#gameAge").fill("10")
        page.locator("#gameFormElement button[type='submit']").click()

        # Handle dialogs after adding a game (network error is on top)
        net_error_dialog = page.locator(".custom-dialog.active", has_text="Erreur réseau")
        expect(net_error_dialog).to_be_visible()
        net_error_dialog.get_by_role("button", name="OK").click()

        # Now handle the success dialog
        game_saved_dialog = page.locator(".custom-dialog.active", has_text="Jeu enregistré avec succès")
        expect(game_saved_dialog).to_be_visible()
        game_saved_dialog.get_by_role("button", name="OK").click()

    add_game("Game B", 60)
    add_game("Game C", 30)
    add_game("Game A", 10)

    # --- 4. Filter and verify order ---
    # Click on the filter for <= 60 min
    page.locator("#ludothequeTab .duration-filters .tab-btn[data-duree='60']").click()

    # Wait for the list to be updated
    page.wait_for_timeout(500)

    # Verify the order
    game_cards = page.locator("#ludothequeList .game-card")
    expect(game_cards).to_have_count(3)

    # The list should be sorted by duration descending.
    # So order should be B (60), C (30), A (10)
    expect(game_cards.nth(0)).to_contain_text("Game B")
    expect(game_cards.nth(0)).to_contain_text("60 min")

    expect(game_cards.nth(1)).to_contain_text("Game C")
    expect(game_cards.nth(1)).to_contain_text("30 min")

    expect(game_cards.nth(2)).to_contain_text("Game A")
    expect(game_cards.nth(2)).to_contain_text("10 min")

    # --- 5. Take screenshot ---
    page.screenshot(path="jules-scratch/verification/verification.png")

    browser.close()

with sync_playwright() as p:
    run_verification(p)

print("Verification script executed successfully.")
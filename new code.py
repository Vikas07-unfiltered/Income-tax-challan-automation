import os
import time
import random
import pandas as pd
from datetime import datetime
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
import glob
import pickle

EXCEL_FILE = "IncomeTax_Challan_Template.xlsx"
DOWNLOAD_DIR = os.path.join(os.getcwd(), "Vikas Challan May")
PORTAL_URL = "https://www.incometax.gov.in/iec/foportal/"

os.makedirs(DOWNLOAD_DIR, exist_ok=True)

def random_sleep(a=1, b=3):
    time.sleep(random.uniform(a, b))

def hide_overlays(driver):
    try:
        driver.execute_script("""
            var overlays = document.querySelectorAll('div[class*="overlay"], div[class*="modal"], div[class*="header"]');
            overlays.forEach(el => {
                el.style.display = 'none';
                el.style.zIndex = '-1';
                el.style.position = 'static';
            });
        """)
        print("Overlays hidden")
    except Exception as e:
        print(f"Failed to hide overlays: {e}")

def simulate_human_interaction(driver, element):
    try:
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", element)
        random_sleep(0.5, 1)
        ActionChains(driver).move_to_element(element).perform()
        random_sleep(0.5, 1)
    except Exception as e:
        print(f"Human interaction simulation failed: {e}")

def wait_for_element(driver, xpath, timeout=15):
    try:
        element = WebDriverWait(driver, timeout).until(
            EC.element_to_be_clickable((By.XPATH, xpath))
        )
        print(f"Element found: {xpath}")
        return element
    except Exception as e:
        print(f"Element not found or not interactable: {e}")
        driver.save_screenshot(f"element_error_{xpath.replace('/', '_')}.png")
        return None

def debug_dropdown(driver, xpath):
    try:
        dropdown = driver.find_element(By.XPATH, xpath)
        options = dropdown.find_elements(By.TAG_NAME, "option")
        print(f"Dropdown options for {xpath}:")
        for opt in options:
            print(f"- {opt.text} (value: {opt.get_attribute('value')})")
    except Exception as e:
        print(f"Failed to debug dropdown: {e}")

def get_latest_pdf(download_dir):
    files = glob.glob(os.path.join(download_dir, "*.pdf"))
    if not files:
        return None
    return max(files, key=os.path.getctime)

def save_session(driver, filename="session.pkl"):
    try:
        with open(filename, "wb") as f:
            pickle.dump(driver.get_cookies(), f)
        print("Session cookies saved")
    except Exception as e:
        print(f"Failed to save session: {e}")

def load_session(driver, filename="session.pkl"):
    try:
        with open(filename, "rb") as f:
            cookies = pickle.load(f)
        for cookie in cookies:
            driver.add_cookie(cookie)
        print("Session cookies loaded")
        driver.refresh()
        random_sleep(2, 3)
    except Exception as e:
        print(f"Failed to load session: {e}")

def create_driver():
    options = uc.ChromeOptions()
    prefs = {
        "download.default_directory": DOWNLOAD_DIR,
        "profile.default_content_setting_values.notifications": 2,
        "profile.default_content_setting_values.popups": 2,
        "autofill.profile_enabled": False,
        "autofill.credit_card_enabled": False
    }
    options.add_experimental_option("prefs", prefs)
    options.add_argument("--start-maximized")
    options.add_argument("--disable-save-password-bubble")
    options.add_argument("--disable-autofill-keyboard-accessory-view")
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    driver = uc.Chrome(options=options)
    driver.maximize_window()
    return driver

def login(driver, user_id, password):
    driver.get(PORTAL_URL)
    random_sleep(3, 5)
    try:
        hide_overlays(driver)
        login_button = wait_for_element(driver, "//a[normalize-space()='Login']")
        if not login_button:
            return False
        driver.execute_script("arguments[0].click();", login_button)
        print("Clicked Login button")
        random_sleep(2, 4)

        # Handle optional number input popup
        try:
            num_input = WebDriverWait(driver, 3).until(
                EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Enter any number']"))
            )
            num_input.send_keys("1234")
            ok_btn = wait_for_element(driver, "//button[text()='OK']")
            if ok_btn:
                driver.execute_script("arguments[0].click();", ok_btn)
            print("Popup handled")
            random_sleep(1, 2)
        except:
            print("No popup")

        print("Entering PAN User ID...")
        pan_input = wait_for_element(driver, "//input[contains(@placeholder, 'User ID')]")
        if not pan_input:
            return False
        pan_input.clear()
        pan_input.send_keys(user_id)
        random_sleep(1, 2)

        hide_overlays(driver)
        continue_btn = wait_for_element(driver, "//button[normalize-space()='Continue']")
        if not continue_btn:
            return False
        driver.execute_script("arguments[0].click();", continue_btn)
        print("Continue clicked")
        random_sleep(4, 6)

        print("Waiting for checkbox...")
        checkbox = wait_for_element(driver, "//input[@type='checkbox']")
        if not checkbox:
            return False
        hide_overlays(driver)
        driver.execute_script("arguments[0].click();", checkbox)
        random_sleep(1, 2)
        if not checkbox.is_selected():
            print("Checkbox not ticked, retrying...")
            driver.execute_script("arguments[0].click();", checkbox)
            random_sleep(1, 2)
        if not checkbox.is_selected():
            print("Checkbox could not be ticked. Aborting login.")
            return False
        print("Checkbox is ticked and verified.")
        random_sleep(1, 2)

        print("Entering password...")
        pwd_input = wait_for_element(driver, "//input[@type='password']")
        if not pwd_input:
            return False
        pwd_input.send_keys(password)
        random_sleep(1, 2)

        hide_overlays(driver)
        continue_btn2 = wait_for_element(driver, "//button[normalize-space()='Continue']")
        if not continue_btn2:
            return False
        driver.execute_script("arguments[0].click();", continue_btn2)
        print("Final continue clicked")
        random_sleep(3, 5)

        # Handle Dual Login Detected popup
        try:
            dual_login_btn = wait_for_element(driver, "//button[normalize-space()='Login Here']", timeout=5)
            if dual_login_btn:
                driver.execute_script("arguments[0].click();", dual_login_btn)
                print("Dual Login Detected popup handled")
                random_sleep(2, 3)
        except:
            pass

        # Save and reload session to mimic manual login
        save_session(driver)
        load_session(driver)
        return True

    except Exception as e:
        print(f"Login failed: {str(e)}")
        driver.save_screenshot("login_error.png")
        with open("login_error.html", "w", encoding="utf-8") as f:
            f.write(driver.page_source)
        return False

def go_to_challan_page(driver):
    try:
        print("\n=== Debug Information ===")
        print("Starting navigation process...")
        WebDriverWait(driver, 30).until(
            lambda d: d.execute_script("return document.readyState") == "complete"
        )
        print("Page load complete")
        random_sleep(4, 6)

        hide_overlays(driver)
        print("🍔 Clicking hamburger menu...")
        menu_btn = wait_for_element(driver, "//button[contains(@class, 'menuIconForSidenav') or @aria-label='Menu']")
        if not menu_btn:
            print("No hamburger menu found!")
            driver.save_screenshot("hamburger_not_found.png")
            return False
        simulate_human_interaction(driver, menu_btn)
        driver.execute_script("arguments[0].click();", menu_btn)
        print("✅ Hamburger menu clicked")
        random_sleep(2, 4)

        print("🕗 Waiting for sidebar...")
        sidebar = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//div[contains(@class,'menuIconForSidenav') or contains(@class,'sideNav')]"))
        )
        print("✅ Sidebar detected!")

        print("🔍 Clicking e-File menu...")
        efile_menu = wait_for_element(driver, "//*[contains(text(), 'e-File') or contains(text(), 'E-File') or contains(text(), 'E-file')]")
        if not efile_menu:
            driver.save_screenshot("efile_click_failed.png")
            return False
        simulate_human_interaction(driver, efile_menu)
        driver.execute_script("arguments[0].click();", efile_menu)
        print("✅ e-File menu clicked")
        random_sleep(3, 5)

        print("🔍 Verifying E-Pay Tax page...")
        new_payment_btn = wait_for_element(driver, "//button[contains(text(), 'New Payment')]")
        if not new_payment_btn:
            return False
        print("✅ Successfully loaded E-Pay Tax page")
        return True

    except Exception as e:
        print(f"❌ Navigation failed: {str(e)}")
        driver.save_screenshot("navigation_error.png")
        with open("navigation_error.html", "w", encoding="utf-8") as f:
            f.write(driver.page_source)
        return False

def create_challan(driver, row):
    try:
        new_payment_btn = wait_for_element(driver, "//span[contains(text(),'New Payment')]")
        if not new_payment_btn:
            return None, "New Payment button not found", None
        driver.execute_script("arguments[0].click();", new_payment_btn)
        random_sleep(1, 2)

        income_tax_btn = wait_for_element(driver, "//h3[contains(text(),'Income Tax')]")
        if not income_tax_btn:
            return None, "Income Tax button not found", None
        driver.execute_script("arguments[0].click();", income_tax_btn)
        random_sleep(1, 2)

        hide_overlays(driver)
        assessment_dropdown = wait_for_element(
            driver, 
            "//label[contains(text(),'Assessment Year')]/following-sibling::div//select"
        )
        if not assessment_dropdown:
            print("Assessment Year dropdown not found. Pausing for manual inspection...")
            driver.save_screenshot("dropdown_missing.png")
            with open("dropdown_missing.html", "w", encoding="utf-8") as f:
                f.write(driver.page_source)  # Corrected indentation
            time.sleep(30)
            return None, "Assessment Year dropdown not found", None
        
        debug_dropdown(driver, "//label[contains(text(),'Assessment Year')]/following-sibling::div//select")
        simulate_human_interaction(driver, assessment_dropdown)
        driver.execute_script(
            "arguments[0].value = arguments[1]; arguments[0].dispatchEvent(new Event('change'));",
            assessment_dropdown,
            row['Assessment Year']
        )
        random_sleep(0.5, 1)

        payment_dropdown = wait_for_element(
            driver, 
            "//label[contains(text(),'Type of Payment')]/following-sibling::div//select"
        )
        if not payment_dropdown:
            return None, "Type of Payment dropdown not found", None
        
        debug_dropdown(driver, "//label[contains(text(),'Type of Payment')]/following-sibling::div//select")
        simulate_human_interaction(driver, payment_dropdown)
        driver.execute_script(
            "arguments[0].value = '300'; arguments[0].dispatchEvent(new Event('change'));",
            payment_dropdown
        )
        random_sleep(0.5, 1)

        continue_btn = wait_for_element(driver, "//button[contains(text(), 'Continue')]")
        if not continue_btn:
            return None, "Continue button not found", None
        driver.execute_script("arguments[0].click();", continue_btn)
        random_sleep(2, 3)

        def fill(label, value):
            if pd.notnull(value) and value != 0:
                fld = wait_for_element(driver, f"//label[contains(text(),'{label}')]/following-sibling::div//input")
                if fld:
                    simulate_human_interaction(driver, fld)
                    fld.clear()
                    fld.send_keys(str(int(value)))
                    random_sleep(0.5, 1)

        for col in ["Tax", "Surcharge", "Cess", "Interest", "Fee", "Penalty", "Others"]:
            fill(col if col != "Cess" else "Health & Education Cess", row.get(col, 0))

        continue_btn = wait_for_element(driver, "//button[contains(text(), 'Continue')]")
        if not continue_btn:
            return None, "Continue button not found", None
        driver.execute_script("arguments[0].click();", continue_btn)
        random_sleep(2, 3)

        rtgs_btn = wait_for_element(driver, "//label[contains(text(), 'RTGS/NEFT')]")
        if not rtgs_btn:
            return None, "RTGS/NEFT option not found", None
        driver.execute_script("arguments[0].click();", rtgs_btn)
        random_sleep(1, 2)

        continue_btn = wait_for_element(driver, "//button[contains(text(), 'Continue')]")
        if not continue_btn:
            return None, "Continue button not found", None
        driver.execute_script("arguments[0].click();", continue_btn)
        random_sleep(3, 5)

        download_btn = wait_for_element(driver, "//button[contains(text(), 'Download')]")
        if not download_btn:
            return None, "Download button not found", None
        driver.execute_script("arguments[0].click();", download_btn)
        random_sleep(3, 5)

        pdf_path = get_latest_pdf(DOWNLOAD_DIR)
        crn = "CRN" + str(int(time.time()))
        return crn, "Challan created successfully", pdf_path

    except Exception as e:
        driver.save_screenshot("challan_error.png")
        with open("challan_error.html", "w", encoding="utf-8") as f:
            f.write(driver.page_source)
        return None, f"Challan failed: {e}", None

def main():
    df = pd.read_excel(EXCEL_FILE)
    driver = create_driver()

    try:
        for idx, row in df.iterrows():
            if str(row.get("Status","")).lower().startswith("challan created"):
                print(f"✅ Skipping {row['Company Name']}")
                continue

            print(f"\n🚀 Processing: {row['Company Name']}")
            if not login(driver, row["Login User ID"], row["Login Password"]):
                df.at[idx, "Status"] = "Login failed"
                df.to_excel(EXCEL_FILE, index=False)  # Save progress
                continue

            if not go_to_challan_page(driver):
                df.at[idx, "Status"] = "Navigation failed"
                df.to_excel(EXCEL_FILE, index=False)  # Save progress
                continue

            crn, status, pdf_path = create_challan(driver, row)
            if crn:
                df.at[idx, "CRN"] = crn
                df.at[idx, "Status"] = status
                df.at[idx, "PDF Path"] = pdf_path if pdf_path else "Download failed"
                df.at[idx, "Date Created"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            else:
                df.at[idx, "Status"] = status

            df.to_excel(EXCEL_FILE, index=False)  # Save progress after each row

    finally:
        try:
            driver.quit()
        except Exception as e:
            print(f"⚠️ Error during browser cleanup: {e}")

    print("\n🎯 Completed. Excel file updated.")

if __name__ == "__main__":
    main()
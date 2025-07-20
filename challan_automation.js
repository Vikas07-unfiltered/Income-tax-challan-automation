const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

puppeteer.use(StealthPlugin());

// Cloud platform detection
const isCloudPlatform = process.env.RAILWAY_ENVIRONMENT || process.env.RENDER || process.env.HEROKU_APP_NAME || process.env.NODE_ENV === 'production' || process.env.PORT;
console.log('🌐 Environment Detection:');
console.log(`  - RAILWAY_ENVIRONMENT: ${process.env.RAILWAY_ENVIRONMENT || 'Not set'}`);
console.log(`  - NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);
console.log(`  - PORT: ${process.env.PORT || 'Not set'}`);
console.log(`  - Is Cloud Platform: ${isCloudPlatform ? 'Yes' : 'No'}`);
console.log('');

const EXCEL_FILE = 'IncomeTax_Challan_Template.xlsx';
// Create date-based folder name (DD-MM-YYYY format)
const today = new Date();
const dateFolder = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
const DOWNLOAD_DIR = path.join(__dirname, 'Challan_PDFs', dateFolder);
const PORTAL_URL = 'https://www.incometax.gov.in/iec/foportal/';

// Create the date-based directory if it doesn't exist
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  console.log(`Created PDF folder: ${DOWNLOAD_DIR}`);
}

async function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

// Human-like random delay function
async function humanDelay(baseMs = 1000, variationMs = 500) {
  const randomDelay = baseMs + (Math.random() * variationMs);
  return new Promise((res) => setTimeout(res, randomDelay));
}

// Human-like typing function
async function humanType(page, selector, text, options = {}) {
  const element = await page.$(selector);
  if (element) {
    await element.click();
    await humanDelay(200, 300);
    
    // Clear existing text first
    await element.evaluate(el => el.value = '');
    await humanDelay(100, 200);
    
    // Type with human-like delays between characters
    for (const char of text) {
      await element.type(char, { delay: 50 + Math.random() * 100 });
      if (Math.random() < 0.1) { // 10% chance of longer pause (like thinking)
        await humanDelay(200, 400);
      }
    }
    
    await humanDelay(300, 500);
  }
}

// Helper function to reliably open Angular Material dropdowns
async function openMatSelectDropdown(page, identifier, timeout = 10000) {
  console.log(`Attempting to open dropdown: ${identifier}`);
  
  const methods = [
    // Method 1: Click mat-select by text content
    async () => {
      const selects = await page.$$('mat-select');
      for (const select of selects) {
        const text = await page.evaluate(el => el.textContent, select);
        const ariaLabel = await page.evaluate(el => el.getAttribute('aria-label'), select);
        if (text.includes(identifier) || ariaLabel?.includes(identifier)) {
          await select.click();
          return true;
        }
      }
      return false;
    },
    
    // Method 2: Click by label association
    async () => {
      const xpath = `//label[contains(text(), '${identifier}')]/following-sibling::*//mat-select`;
      const [select] = await page.$x(xpath);
      if (select) {
        await select.click();
        return true;
      }
      return false;
    },
    
    // Method 3: Click trigger elements
    async () => {
      const triggers = await page.$$('.mat-select-trigger, .mat-select-value');
      for (const trigger of triggers) {
        const text = await page.evaluate(el => el.textContent, trigger);
        if (text.includes(identifier) || text.includes('Select')) {
          await trigger.click();
          return true;
        }
      }
      return false;
    },
    
    // Method 4: Force click with JavaScript
    async () => {
      return await page.evaluate((id) => {
        const selects = document.querySelectorAll('mat-select');
        for (const select of selects) {
          const text = select.textContent;
          const label = select.getAttribute('aria-label');
          if (text.includes(id) || label?.includes(id)) {
            select.click();
            return true;
          }
        }
        return false;
      }, identifier);
    }
  ];
  
  for (let attempt = 1; attempt <= 3; attempt++) {
    console.log(`Dropdown opening attempt ${attempt}/3`);
    
    for (const method of methods) {
      try {
        const clicked = await method();
        if (clicked) {
          await delay(1500);
          const panelExists = await page.$('.mat-select-panel') !== null;
          if (panelExists) {
            console.log(`✓ Dropdown opened successfully on attempt ${attempt}`);
            return true;
          }
        }
      } catch (error) {
        console.log(`Method failed:`, error.message);
      }
    }
    
    if (attempt < 3) {
      await delay(2000); // Wait before retry
    }
  }
  
  await page.screenshot({ path: `dropdown_failed_${identifier.replace(/\s+/g, '_')}.png` });
  return false;
}

async function login(page, userId, password, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Ensure userId and password are strings
      const safeUserId = userId ? String(userId).trim() : '';
      const safePassword = password ? String(password).trim() : '';
      
      console.log(`=== LOGIN PROCESS STARTED (Attempt ${attempt}/${maxRetries}) ===`);
      console.log(`User ID: ${safeUserId}`);
      console.log(`Password: ${safePassword ? '[PROVIDED]' : '[MISSING]'}`);
      console.log(`User ID type: ${typeof safeUserId}, Password type: ${typeof safePassword}`);
      
      // Check if page is still valid before navigation
      if (page.isClosed()) {
        throw new Error('Page is closed, cannot proceed with login');
      }
      
      console.log('Navigating to portal...');
      try {
        // Use different wait strategies for cloud vs local
        const waitUntil = isCloudPlatform ? 'domcontentloaded' : 'networkidle2';
        const timeout = isCloudPlatform ? 60000 : 30000;
        
        await page.goto(PORTAL_URL, { 
          waitUntil: waitUntil, 
          timeout: timeout 
        });
        
        // Additional wait for cloud platforms
        const delayTime = isCloudPlatform ? 5000 : 3000;
        await delay(delayTime);
        
        // Verify page loaded properly
        await page.waitForSelector('body', { timeout: 15000 });
        
      } catch (navError) {
        if (navError.message.includes('detached') || navError.message.includes('closed') || navError.message.includes('frame')) {
          console.log(`Navigation error on attempt ${attempt}: ${navError.message}`);
          if (attempt < maxRetries) {
            const retryDelay = isCloudPlatform ? 5000 : 2000;
            console.log(`⏳ Waiting ${retryDelay}ms before navigation retry...`);
            await delay(retryDelay);
            continue;
          }
        }
        throw navError;
      }

      // Validate page state before proceeding
      try {
        await page.waitForSelector('body', { timeout: 10000 });
      } catch (bodyError) {
        console.log(`Page body not ready on attempt ${attempt}: ${bodyError.message}`);
        if (attempt < maxRetries) {
          await delay(2000);
          continue;
        }
        throw bodyError;
      }
      
      console.log('Clicking login button...');
      try {
        const loginButton = await page.$("a.login[aria-label='Login button']");
        if (!loginButton) throw new Error("Login button not found");
        await loginButton.click();
        await delay(3000);
      } catch (loginBtnError) {
        if (loginBtnError.message.includes('detached') || loginBtnError.message.includes('closed')) {
          console.log(`Login button click error on attempt ${attempt}: ${loginBtnError.message}`);
          if (attempt < maxRetries) {
            await delay(2000);
            continue;
          }
        }
        throw loginBtnError;
      }

      console.log('Entering User ID...');
      try {
        await page.waitForSelector("input[placeholder*='User ID']", { timeout: 15000 });
        
        // Check if page is still valid before typing
        if (page.isClosed()) {
          throw new Error('Page closed during User ID entry');
        }
        
        await page.type("input[placeholder*='User ID']", safeUserId);
        await delay(1000);
        console.log('✓ User ID entered successfully');
      } catch (err) {
        console.log('✗ Error entering User ID:', err.message);
        if (err.message.includes('detached') || err.message.includes('closed')) {
          console.log(`User ID entry error on attempt ${attempt}: ${err.message}`);
          if (attempt < maxRetries) {
            await delay(2000);
            continue;
          }
        }
        throw err;
      }

      console.log('Clicking Continue after User ID...');
      try {
        // Check if page is still valid
        if (page.isClosed()) {
          throw new Error('Page closed during Continue button click');
        }
        
        const continueButtons = await page.$$('button span');
        let continueBtnFound = false;
        for (const span of continueButtons) {
          try {
            const text = await page.evaluate(el => {
              if (el && el.textContent !== null && el.textContent !== undefined) {
                const content = String(el.textContent).trim();
                return content;
              }
              return '';
            }, span);
            if (text === 'Continue') {
              await span.click();
              continueBtnFound = true;
              break;
            }
          } catch (evalError) {
            // Skip this button if evaluation fails
            continue;
          }
        }
        if (!continueBtnFound) throw new Error("Continue button not found after User ID");
        await delay(4000);
        console.log('✓ Continue button clicked successfully');
      } catch (err) {
        console.log('✗ Error clicking Continue button:', err.message);
        if (err.message.includes('detached') || err.message.includes('closed')) {
          console.log(`Continue button error on attempt ${attempt}: ${err.message}`);
          if (attempt < maxRetries) {
            await delay(2000);
            continue;
          }
        }
        throw err;
      }

      console.log('Checking for errors...');
      const errorBox = await page.$("mat-error");
      if (errorBox) {
        const errorText = await page.evaluate(el => {
          if (el && el.textContent) {
            return typeof el.textContent === 'string' ? el.textContent.trim() : String(el.textContent).trim();
          }
          return '';
        }, errorBox);
        if (errorText && typeof errorText === 'string' && errorText.toLowerCase().includes("does not exist")) {
          throw new Error("PAN/User ID does not exist");
        }
      }

      console.log('Clicking checkbox...');
      const checkbox = await page.$("input[type='checkbox']");
      if (checkbox) await checkbox.click();
      else throw new Error("Secure message checkbox not found");
      await delay(1000);

      console.log('Entering password...');
      try {
        await page.waitForSelector("input[type='password']", { timeout: 15000 });
        
        // Check if page is still valid
        if (page.isClosed()) {
          throw new Error('Page closed during password entry');
        }
        
        await delay(2000); // Wait for field to be ready
        await page.click("input[type='password']"); // Click to focus
        await delay(500);
        await page.type("input[type='password']", safePassword);
        await delay(3000); // Wait after typing password
        console.log('✓ Password entered successfully');
      } catch (err) {
        console.log('✗ Error entering password:', err.message || err);
        if (err.message.includes('detached') || err.message.includes('closed')) {
          console.log(`Password entry error on attempt ${attempt}: ${err.message}`);
          if (attempt < maxRetries) {
            await delay(2000);
            continue;
          }
        }
        throw err;
      }

      // Click final continue button after password entry
      console.log('Clicking final Continue button...');
      try {
        // Check if page is still valid
        if (page.isClosed()) {
          throw new Error('Page closed during final Continue button click');
        }
        
        await delay(1000); // Extra wait before looking for continue button
        const finalContinueButtons = await page.$$('button span');
        let finalContinueFound = false;
        
        for (let i = 0; i < finalContinueButtons.length; i++) {
          try {
            const span = finalContinueButtons[i];
            const text = await page.evaluate(el => {
              try {
                if (el && el.textContent !== null && el.textContent !== undefined) {
                  return String(el.textContent).trim();
                }
                return '';
              } catch (evalErr) {
                console.log('Text evaluation error:', evalErr.message);
                return '';
              }
            }, span);
            
            if (text === 'Continue') {
              console.log('Found final Continue button, clicking...');
              await span.click();
              finalContinueFound = true;
              break;
            }
          } catch (spanErr) {
            console.log(`Error processing span ${i}:`, spanErr.message);
            continue;
          }
        }
        
        if (!finalContinueFound) throw new Error("Final Continue button not found");
        console.log('✓ Final Continue button clicked successfully');
        // Wait longer for the dual login popup to appear
        await delay(7000);
      } catch (continueErr) {
        console.log('✗ Error clicking final Continue button:', continueErr.message);
        if (continueErr.message.includes('detached') || continueErr.message.includes('closed')) {
          console.log(`Final continue error on attempt ${attempt}: ${continueErr.message}`);
          if (attempt < maxRetries) {
            await delay(2000);
            continue;
          }
        }
        throw continueErr;
      }
      
      // Robust error extraction and logging after password entry
      try {
        console.log('Checking for login error messages after password...');
        const errorBox = await page.$("mat-error, .mat-error, .error-message, .alert-danger");
        if (errorBox) {
          const errorText = await page.evaluate(el => {
            if (el && el.textContent) {
              return typeof el.textContent === 'string' ? el.textContent.trim() : String(el.textContent).trim();
            }
            return '';
          }, errorBox);
          if (errorText && typeof errorText === 'string' && errorText.trim() !== '') {
            console.log(`Login error detected: ${errorText}`);
            throw new Error(`Login failed: ${errorText}`);
          }
        }
      } catch (err) {
        console.log('Error during errorBox extraction:', err.message || err);
      }

      // Only click 'Login Here' if it is present, otherwise proceed immediately
      console.log('Checking for Dual Login popup in modal-footer...');
      let dualLoginHandled = false;
      try {
        // Check if page is still valid
        if (page.isClosed()) {
          throw new Error('Page closed during dual login check');
        }
        
        // Try to get all primary buttons inside the modal footer (do not wait if not present)
        const buttons = await page.$$('div.modal-footer button.primaryButton');
        console.log(`Found ${buttons.length} primaryButton(s) in .modal-footer`);
        for (const button of buttons) {
          try {
            const text = await page.evaluate(el => {
              if (el && el.textContent !== null && el.textContent !== undefined) {
                const content = String(el.textContent).trim();
                return content;
              }
              return '';
            }, button);
            console.log(`Button text: '${text}'`);
            if (text === "Login Here") {
              console.log(`Dual Login Detected popup found. Clicking Login Here.`);
              await button.click();
              await delay(4000); // Wait for login to complete
              dualLoginHandled = true;
              break;
            }
          } catch (btnError) {
            console.log('Error processing dual login button:', btnError.message);
            continue;
          }
        }
        if (!dualLoginHandled) {
          console.log('Login Here button not found, proceeding to next steps.');
        }
      } catch (error) {
        console.log('Error checking/clicking Login Here:', error.message);
        if (error.message.includes('detached') || error.message.includes('closed')) {
          console.log(`Dual login error on attempt ${attempt}: ${error.message}`);
          if (attempt < maxRetries) {
            await delay(2000);
            continue;
          }
        }
      }

      // Relaxed login validation: always proceed to next steps after attempting login
      await delay(6000); // Wait for dashboard/menu to load
      console.log('Proceeding to post-login steps...');
      console.log(`✅ Login completed successfully on attempt ${attempt}`);
      return true;
      
    } catch (error) {
      const errorMsg = error && error.message ? error.message : (error ? String(error) : 'Unknown error');
      console.log(`❌ Login attempt ${attempt} failed: ${errorMsg}`);
      
      // If this is not the last attempt and it's a detachment error, continue to retry
      if (attempt < maxRetries && (errorMsg.includes('detached') || errorMsg.includes('closed') || errorMsg.includes('Protocol error'))) {
        console.log(`Retrying login in 3 seconds... (${maxRetries - attempt} attempts remaining)`);
        await delay(3000);
        continue;
      }
      
      // If it's the last attempt or a non-retryable error, return false
      if (attempt === maxRetries) {
        console.error(`❌ All ${maxRetries} login attempts failed. Final error: ${errorMsg}`);
      }
      return false;
    }
  }
  
  // If we get here, all attempts failed
  console.error(`❌ Login failed after ${maxRetries} attempts`);
  return false;
}

// Function to click e-File button on ITR page
async function clickEFileButton(page) {
  console.log('Clicking e-File button on ITR page...');
  
  try {
    // Wait for the e-File button to be visible
    await page.waitForSelector('#e-File', { visible: true, timeout: 10000 });
    
    // Try the specific selector provided by user
    const eFileSelector = '#e-File > .mat-mdc-button-touch-target';
    const eFileButton = await page.$(eFileSelector);
    
    if (eFileButton) {
      console.log('Found e-File button with specific selector');
      await eFileButton.click();
      console.log('✓ Clicked e-File button');
      await delay(3000);
      return true;
    }
    
    // Fallback: try clicking the parent e-File element
    const eFileParent = await page.$('#e-File');
    if (eFileParent) {
      console.log('Found e-File parent element, clicking...');
      await eFileParent.click();
      console.log('✓ Clicked e-File parent element');
      await delay(3000);
      return true;
    }
    
    // Additional fallback: find by text content
    const allButtons = await page.$$('button, a, [role="button"]');
    for (const btn of allButtons) {
      const text = await page.evaluate(el => el.textContent?.trim() || '', btn);
      if (text === 'e-File' || text.includes('e-File')) {
        console.log('Found e-File button by text content');
        await btn.click();
        console.log('✓ Clicked e-File button');
        await delay(3000);
        return true;
      }
    }
    
    console.log('✗ Could not find e-File button');
    return false;
    
  } catch (error) {
    console.log('Error clicking e-File button:', error.message);
    return false;
  }
}

async function gotoEPayTax(page) {
  console.log('Looking for E-Pay Tax in dropdown menu...');
  await delay(2000); // Allow dropdown to be fully visible

  try {
    // Try the specific selector provided by user first
    const specificSelector = '.ng-tns-c1923052698-40:nth-child(3) .mat-mdc-menu-item';
    console.log('Trying specific E-Pay Tax selector...');
    
    const ePayTaxElement = await page.$(specificSelector);
    if (ePayTaxElement) {
      const text = await page.evaluate(el => el.textContent?.trim() || '', ePayTaxElement);
      console.log(`Found E-Pay Tax with specific selector: "${text}"`);
      await ePayTaxElement.click();
      console.log('✓ Clicked E-Pay Tax with specific selector');
      await delay(4000);
      return;
    }
    
    // Fallback: Wait for any visible menuitem button
    console.log('Specific selector not found, trying fallback methods...');
    await page.waitForSelector('button[role="menuitem"], .mat-mdc-menu-item', { visible: true, timeout: 15000 });

    // Get all menu items
    const menuItems = await page.$$('button[role="menuitem"], .mat-mdc-menu-item, [class*="menu-item"]');
    console.log(`Found ${menuItems.length} menu items`);
    
    let found = false;
    for (let i = 0; i < menuItems.length; i++) {
      const item = menuItems[i];
      const text = await page.evaluate(el => el.textContent?.trim() || '', item);
      const className = await page.evaluate(el => el.className || '', item);
      console.log(`  ${i + 1}. Menu item: "${text}" | Class: "${className}"`);
      
      if (/E[- ]?Pay Tax/i.test(text) || text.toLowerCase().includes('e-pay tax')) {
        console.log(`Found E-Pay Tax menu item: "${text}"`);
        await item.click();
        console.log('✓ Clicked E-Pay Tax');
        await delay(4000);
        found = true;
        break;
      }
    }
    
    if (!found) {
      console.log('✗ E-Pay Tax menu item not found');
      await page.screenshot({ path: 'epay_tax_not_found.png' });
      throw new Error('E-Pay Tax menu item not found');
    }
    
  } catch (error) {
    console.log('Error in gotoEPayTax:', error.message);
    await page.screenshot({ path: 'epay_tax_error.png' });
    throw error;
  }
}

async function clickNewPaymentButton(page) {
  console.log('Looking for New Payment button...');
  
  // Wait for the page to load after clicking E-Pay Tax
  await delay(5000);
  
  try {
    // Try the specific selector provided by user first
    const specificSelector = 'button.large-button-secondary';
    console.log('Trying specific New Payment selector: button.large-button-secondary');
    
    try {
      await page.waitForSelector(specificSelector, { visible: true, timeout: 10000 });
      const newPaymentButton = await page.$(specificSelector);
      
      if (newPaymentButton) {
        const text = await page.evaluate(el => el.textContent?.trim() || '', newPaymentButton);
        console.log(`Found New Payment button with specific selector: "${text}"`);
        
        // Scroll into view and click
        await page.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), newPaymentButton);
        await delay(500);
        
        await newPaymentButton.click();
        console.log('✓ Clicked New Payment button with specific selector');
        await delay(3000);
        return;
      }
    } catch (specificError) {
      console.log('Specific selector failed, trying fallback methods...');
    }
    
    // Fallback: Wait for buttons to appear
    await page.waitForSelector('button, a, [role="button"]', { visible: true, timeout: 15000 });
    
    // Get all clickable elements
    const buttons = await page.$$('button, a, [role="button"], .btn, .button');
    console.log(`Found ${buttons.length} clickable elements`);
    
    let found = false;
    
    // Log all button texts for debugging
    console.log('Available buttons:');
    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i];
      const text = await page.evaluate(el => el.textContent?.trim() || '', btn);
      const className = await page.evaluate(el => el.className || '', btn);
      const id = await page.evaluate(el => el.id || '', btn);
      console.log(`  ${i + 1}. Text: "${text}" | Class: "${className}" | ID: "${id}"`);
      
      // More flexible matching for New Payment button
      if (
        /new\s*payment/i.test(text) ||
        /\+\s*new/i.test(text) ||
        text.toLowerCase().includes('new payment') ||
        text.toLowerCase().includes('+ new') ||
        className.toLowerCase().includes('new') ||
        id.toLowerCase().includes('new')
      ) {
        console.log(`Found potential New Payment button: "${text}"`);
        await btn.click();
        console.log('✓ Clicked New Payment button');
        await delay(3000);
        found = true;
        break;
      }
    }
    
    // If not found with flexible matching, try specific selectors
    if (!found) {
      console.log('Trying specific selectors for New Payment button...');
      
      const specificSelectors = [
        'button[class*="new"]',
        'a[class*="new"]',
        'button[id*="new"]',
        'a[id*="new"]',
        '.new-payment',
        '#new-payment',
        'button:contains("New")',
        'a:contains("New")',
        'button:contains("+")',
        'a:contains("+")'
      ];
      
      for (const selector of specificSelectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            const text = await page.evaluate(el => el.textContent?.trim() || '', element);
            console.log(`Found element with selector ${selector}: "${text}"`);
            await element.click();
            console.log('✓ Clicked New Payment button with specific selector');
            await delay(3000);
            found = true;
            break;
          }
        } catch (selectorError) {
          // Continue to next selector
        }
      }
    }
    
    if (!found) {
      console.log('✗ Could not find New Payment button');
      await page.screenshot({ path: 'new_payment_not_found.png' });
      throw new Error('New Payment button not found');
    }
    
  } catch (error) {
    console.log('Error in clickNewPaymentButton:', error.message);
    await page.screenshot({ path: 'new_payment_error.png' });
    throw error;
  }
}

async function clickIncomeTaxProceed(page) {
  // Wait for any Proceed button to appear
  await page.waitForSelector('button.proceed', { visible: true, timeout: 15000 });
  const proceedButtons = await page.$$('button.proceed');
  for (const btn of proceedButtons) {
    // Traverse up to the card/container and check for "Income Tax"
    const card = await btn.evaluateHandle(el => {
      let node = el.parentElement;
      while (node && node !== document.body) {
        if (node.textContent && /Income Tax/i.test(node.textContent)) return node;
        node = node.parentElement;
      }
      return null;
    });
    // If a card/container with 'Income Tax' is found, click the button
    const isValid = await page.evaluate(cardEl => !!cardEl, card);
    if (isValid) {
      await btn.evaluate(el => el.scrollIntoView({block: 'center'}));
      await delay(500);
      await btn.click();
      console.log('Clicked Proceed on Income Tax');
      await delay(2000);
      return;
    }
  }
  throw new Error('Proceed button for Income Tax not found');
}

async function selectAssessmentYearAndMinorHead(page, assessmentYear, minorHeadCode = '300') {
  console.log(`Starting year selection for: ${assessmentYear}`);
  
  // Wait for page to load
  await delay(3000);
  await page.screenshot({ path: 'before_year_selection.png' });
  
  // First, try to open the dropdown by clicking on the assessment year field
  console.log('Looking for Assessment Year dropdown...');
  
  // Multiple strategies to open the dropdown
  let dropdownOpened = false;
  const openStrategies = [
    // Strategy 1: Click on select element with "Select" text
    async () => {
      const elements = await page.$$('*');
      for (const el of elements) {
        try {
          const text = await page.evaluate(e => e.textContent?.trim(), el);
          const tagName = await page.evaluate(e => e.tagName?.toLowerCase(), el);
          if (text === 'Select' && (tagName === 'div' || tagName === 'span')) {
            console.log('Found "Select" element, clicking...');
            await el.click();
            return true;
          }
        } catch (e) {}
      }
      return false;
    },
    
    // Strategy 2: Click on elements that look like dropdowns
    async () => {
      const dropdownSelectors = [
        '[class*="select"]',
        '[class*="dropdown"]',
        'select',
        'mat-select'
      ];
      
      for (const selector of dropdownSelectors) {
        try {
          const elements = await page.$$(selector);
          for (const el of elements) {
            const text = await page.evaluate(e => e.textContent?.trim(), el);
            if (text?.includes('Select') || text?.includes('Assessment')) {
              console.log(`Clicking dropdown with selector: ${selector}`);
              await el.click();
              return true;
            }
          }
        } catch (e) {}
      }
      return false;
    },
    
    // Strategy 3: JavaScript click on first select-like element
    async () => {
      return await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        for (const el of elements) {
          if (el.textContent?.trim() === 'Select' && 
              (el.tagName === 'DIV' || el.tagName === 'SPAN')) {
            el.click();
            return true;
          }
        }
        return false;
      });
    }
  ];
  
  // Try each strategy
  for (let i = 0; i < openStrategies.length; i++) {
    console.log(`Trying dropdown opening strategy ${i + 1}/${openStrategies.length}`);
    try {
      const success = await openStrategies[i]();
      if (success) {
        await delay(2000);
        // Check if dropdown opened by looking for year options
        const yearElements = await page.$$('*');
        let foundYearOptions = false;
        for (const el of yearElements) {
          try {
            const text = await page.evaluate(e => e.textContent?.trim(), el);
            if (text && /20\d{2}-\d{2}/.test(text)) {
              foundYearOptions = true;
              break;
            }
          } catch (e) {}
        }
        if (foundYearOptions) {
          console.log('✓ Dropdown opened - year options visible');
          dropdownOpened = true;
          break;
        }
      }
    } catch (error) {
      console.log(`Strategy ${i + 1} failed:`, error.message);
    }
  }
  
  if (!dropdownOpened) {
    await page.screenshot({ path: 'dropdown_open_failed.png' });
    throw new Error('Could not open Assessment Year dropdown');
  }

  // Now find and click the target year from the visible dropdown
  await delay(2000);
  await page.screenshot({ path: 'dropdown_opened.png' });
  
  console.log(`Looking for year: ${assessmentYear}`);
  const targetYear = assessmentYear.toString().trim();
  
  // Simple approach: find all elements and look for the target year
  const success = await page.evaluate((target) => {
    console.log('Searching for year:', target);
    
    // Get all elements on the page
    const allElements = document.querySelectorAll('*');
    const yearElements = [];
    
    // Find elements that contain year-like text
    for (const el of allElements) {
      const text = el.textContent?.trim();
      if (text && /^20\d{2}-\d{2}$/.test(text)) {
        yearElements.push({ element: el, text });
        console.log('Found year element:', text);
      }
    }
    
    console.log(`Found ${yearElements.length} year elements`);
    
    // Try to find and click the target year
    for (const { element, text } of yearElements) {
      if (text === target) {
        console.log(`Found target year: ${text}`);
        
        // Try different click methods
        try {
          element.click();
          console.log('Clicked with element.click()');
          return true;
        } catch (e1) {
          try {
            element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            console.log('Clicked with dispatchEvent');
            return true;
          } catch (e2) {
            try {
              // Try clicking parent elements
              if (element.parentElement) {
                element.parentElement.click();
                console.log('Clicked parent element');
                return true;
              }
            } catch (e3) {
              console.log('All click methods failed for:', text);
            }
          }
        }
      }
    }
    
    return false;
  }, targetYear);
  
  if (success) {
    console.log('✓ Year selected successfully!');
    await delay(2000);
    await page.screenshot({ path: 'after_year_selection.png' });
  } else {
    // If direct approach failed, try a more targeted search
    console.log('Direct approach failed, trying alternative method...');
    
    // Look for clickable year elements more specifically
    const yearFound = await page.evaluate((target) => {
      // Look for elements that are likely clickable (have click handlers or are in lists)
      const clickableSelectors = ['li', 'div', 'span', 'a', 'button'];
      
      for (const selector of clickableSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          const text = el.textContent?.trim();
          if (text === target) {
            console.log(`Found ${target} in ${selector} element`);
            try {
              el.click();
              return true;
            } catch (e) {
              console.log(`Failed to click ${selector} element:`, e.message);
            }
          }
        }
      }
      return false;
    }, targetYear);
    
    if (!yearFound) {
      await page.screenshot({ path: 'year_selection_failed.png' });
      
      // Show all available year options for debugging
      const availableYears = await page.evaluate(() => {
        const allElements = document.querySelectorAll('*');
        const years = [];
        for (const el of allElements) {
          const text = el.textContent?.trim();
          if (text && /^20\d{2}-\d{2}$/.test(text)) {
            years.push(text);
          }
        }
        return [...new Set(years)]; // Remove duplicates
      });
      
      console.log('Available years found:', availableYears);
      throw new Error(`Could not select year "${targetYear}". Available years: ${availableYears.join(', ')}`);
    } else {
      console.log('✓ Year selected with alternative method!');
      await delay(2000);
      await page.screenshot({ path: 'after_year_selection_alt.png' });
    }
  }
  await delay(800);

  // Now handle the Type of Payment (Minor Head) dropdown
  console.log('\n=== Selecting Type of Payment (Minor Head) ===');
  await delay(2000);
  
  // First, open the Type of Payment dropdown
  console.log('Looking for Type of Payment dropdown...');
  
  // Strategies to open the Type of Payment dropdown
  let paymentDropdownOpened = false;
  const paymentOpenStrategies = [
    // Strategy 1: Click on the second "Select" element (Type of Payment)
    async () => {
      const selectElements = await page.$$('*');
      let selectCount = 0;
      for (const el of selectElements) {
        try {
          const text = await page.evaluate(e => e.textContent?.trim(), el);
          const tagName = await page.evaluate(e => e.tagName?.toLowerCase(), el);
          if (text === 'Select' && (tagName === 'div' || tagName === 'span')) {
            selectCount++;
            if (selectCount === 2) { // Second "Select" should be Type of Payment
              console.log('Found second "Select" element (Type of Payment), clicking...');
              await el.click();
              return true;
            }
          }
        } catch (e) {}
      }
      return false;
    },
    
    // Strategy 2: Look for elements near "Type of Payment" label
    async () => {
      return await page.evaluate(() => {
        // Find the "Type of Payment" label
        const labels = document.querySelectorAll('*');
        for (const label of labels) {
          if (label.textContent?.includes('Type of Payment')) {
            // Look for clickable elements near this label
            const parent = label.closest('div');
            if (parent) {
              const selectElements = parent.querySelectorAll('*');
              for (const sel of selectElements) {
                if (sel.textContent?.trim() === 'Select') {
                  sel.click();
                  return true;
                }
              }
            }
          }
        }
        return false;
      });
    },
    
    // Strategy 3: Click on any remaining "Select" elements
    async () => {
      return await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        for (const el of elements) {
          const text = el.textContent?.trim();
          if (text === 'Select' && el.offsetHeight > 0 && el.offsetWidth > 0) {
            // Check if this select is visible and not the assessment year one
            const rect = el.getBoundingClientRect();
            if (rect.top > 200) { // Likely the second dropdown
              el.click();
              return true;
            }
          }
        }
        return false;
      });
    }
  ];
  
  // Try each strategy to open the payment dropdown
  for (let i = 0; i < paymentOpenStrategies.length; i++) {
    console.log(`Trying payment dropdown opening strategy ${i + 1}/${paymentOpenStrategies.length}`);
    try {
      const success = await paymentOpenStrategies[i]();
      if (success) {
        await delay(2000);
        // Check if payment dropdown opened by looking for payment options
        const paymentElements = await page.$$('*');
        let foundPaymentOptions = false;
        for (const el of paymentElements) {
          try {
            const text = await page.evaluate(e => e.textContent?.trim(), el);
            if (text && text.includes('Self-Assessment Tax')) {
              foundPaymentOptions = true;
              break;
            }
          } catch (e) {}
        }
        if (foundPaymentOptions) {
          console.log('✓ Type of Payment dropdown opened - payment options visible');
          paymentDropdownOpened = true;
          break;
        }
      }
    } catch (error) {
      console.log(`Payment strategy ${i + 1} failed:`, error.message);
    }
  }
  
  if (!paymentDropdownOpened) {
    await page.screenshot({ path: 'payment_dropdown_open_failed.png' });
    throw new Error('Could not open Type of Payment dropdown');
  }
  
  // Now find and click "Self-Assessment Tax (300)"
  await delay(2000);
  await page.screenshot({ path: 'payment_dropdown_opened.png' });
  
  console.log('Looking for "Self-Assessment Tax (300)"...');
  
  // Find and click Self-Assessment Tax (300) using specific element ID
  const paymentSuccess = await page.evaluate(() => {
    console.log('Searching for Self-Assessment Tax (300)...');
    
    // Method 1: Try to click using the specific mat-option ID
    const specificOption = document.querySelector('#mat-option-103');
    if (specificOption) {
      console.log('Found Self-Assessment Tax using specific ID: mat-option-103');
      try {
        specificOption.click();
        console.log('Clicked Self-Assessment Tax using specific ID');
        return true;
      } catch (e) {
        console.log('Failed to click specific ID, trying dispatchEvent...');
        try {
          specificOption.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          console.log('Clicked Self-Assessment Tax using dispatchEvent on specific ID');
          return true;
        } catch (e2) {
          console.log('Specific ID click failed, falling back to text search...');
        }
      }
    } else {
      console.log('mat-option-103 not found, trying alternative selectors...');
    }
    
    // Method 2: Try mat-option elements with Self-Assessment Tax text
    const matOptions = document.querySelectorAll('mat-option, [id*="mat-option"]');
    console.log(`Found ${matOptions.length} mat-option elements`);
    
    for (const option of matOptions) {
      const text = option.textContent?.trim();
      console.log('Checking mat-option:', text);
      if (text && text.includes('Self-Assessment Tax') && text.includes('(300)')) {
        console.log(`Found Self-Assessment Tax in mat-option: ${text}`);
        try {
          option.click();
          console.log('Clicked Self-Assessment Tax mat-option');
          return true;
        } catch (e) {
          try {
            option.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            console.log('Clicked Self-Assessment Tax mat-option with dispatchEvent');
            return true;
          } catch (e2) {
            console.log('mat-option click failed');
          }
        }
      }
    }
    
    // Method 3: Fallback to general element search
    console.log('mat-option approach failed, trying general search...');
    const allElements = document.querySelectorAll('*');
    const paymentElements = [];
    
    for (const el of allElements) {
      const text = el.textContent?.trim();
      if (text && text.includes('Self-Assessment Tax') && text.includes('(300)')) {
        paymentElements.push({ element: el, text });
        console.log('Found payment element:', text);
      }
    }
    
    console.log(`Found ${paymentElements.length} payment elements`);
    
    for (const { element, text } of paymentElements) {
      if (text.includes('Self-Assessment Tax (300)') || 
          (text.includes('Self-Assessment Tax') && text.includes('300'))) {
        console.log(`Found target payment option: ${text}`);
        
        try {
          element.click();
          console.log('Clicked with element.click()');
          return true;
        } catch (e1) {
          try {
            element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            console.log('Clicked with dispatchEvent');
            return true;
          } catch (e2) {
            try {
              if (element.parentElement) {
                element.parentElement.click();
                console.log('Clicked parent element');
                return true;
              }
            } catch (e3) {
              console.log('All click methods failed for:', text);
            }
          }
        }
      }
    }
    
    return false;
  });
  
  if (paymentSuccess) {
    console.log('✓ Self-Assessment Tax (300) selected successfully!');
    await delay(2000);
    await page.screenshot({ path: 'after_payment_selection.png' });
    
    // Verify the selection was actually made
    const verifySelection = await page.evaluate(() => {
      // Look for evidence that Self-Assessment Tax (300) is selected
      const elements = document.querySelectorAll('*');
      for (const el of elements) {
        const text = el.textContent?.trim();
        // Look for selected value or display
        if (text && text.includes('Self-Assessment Tax') && text.includes('300')) {
          const computedStyle = window.getComputedStyle(el);
          // Check if element appears selected (different background, etc.)
          if (computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' || 
              el.classList.contains('selected') || 
              el.classList.contains('active')) {
            console.log('Verified: Self-Assessment Tax (300) appears to be selected');
            return true;
          }
        }
      }
      return false;
    });
    
    if (!verifySelection) {
      console.log('Warning: Could not verify payment selection, but proceeding...');
    }
  } else {
    // If direct approach failed, try alternative method (same as year selection)
    console.log('Direct approach failed, trying alternative method...');
    
    const paymentFound = await page.evaluate(() => {
      // Look for elements that are likely clickable (same approach as year selection)
      const clickableSelectors = ['li', 'div', 'span', 'a', 'button'];
      
      for (const selector of clickableSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          const text = el.textContent?.trim();
          // More precise matching
          if (text === 'Self-Assessment Tax (300)' || 
              (text && text.includes('Self-Assessment Tax') && text.includes('(300)'))) {
            console.log(`Found Self-Assessment Tax (300) in ${selector} element: "${text}"`);
            try {
              el.click();
              console.log('Successfully clicked with alternative method');
              return true;
            } catch (e) {
              console.log(`Failed to click ${selector} element:`, e.message);
            }
          }
        }
      }
      return false;
    });
    
    if (!paymentFound) {
      await page.screenshot({ path: 'payment_selection_failed.png' });
      
      // Show all available payment options for debugging
      const availablePayments = await page.evaluate(() => {
        const allElements = document.querySelectorAll('*');
        const payments = [];
        for (const el of allElements) {
          const text = el.textContent?.trim();
          if (text && (text.includes('Tax') || text.includes('Payment')) && text.length < 100) {
            payments.push(text);
          }
        }
        return [...new Set(payments)]; // Remove duplicates
      });
      
      console.log('Available payment options found:', availablePayments);
      throw new Error(`Could not select "Self-Assessment Tax (300)". Available options: ${availablePayments.join(', ')}`);
    } else {
      console.log('✓ Self-Assessment Tax (300) selected with alternative method!');
      await delay(2000);
      await page.screenshot({ path: 'after_payment_selection_alt.png' });
    }
  }
}

// Wait for and click the Continue button on New Payment
async function clickContinueOnNewPayment(page) {
  console.log('\n=== Clicking Continue Button ===');
  await delay(2000);
  await page.screenshot({ path: 'before_continue_click.png' });
  
  console.log('Looking for Continue button...');
  
  // Multiple strategies to find and click Continue button
  const continueStrategies = [
    // Strategy 1: Use the specific CSS selector provided by user
    async () => {
      try {
        const specificButton = await page.$('.d-inline > .large-button-primary');
        if (specificButton) {
          console.log('Found Continue button using specific selector: .d-inline > .large-button-primary');
          await specificButton.click();
          console.log('Clicked Continue button using specific selector');
          return true;
        } else {
          console.log('Specific selector .d-inline > .large-button-primary not found');
          return false;
        }
      } catch (error) {
        console.log('Specific selector failed:', error.message);
        return false;
      }
    },
    
    // Strategy 2: Find Continue button using page.evaluate (fallback)
    async () => {
      return await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        for (const el of elements) {
          const text = el.textContent?.trim();
          if (text === 'Continue' && el.offsetHeight > 0 && el.offsetWidth > 0) {
            console.log('Found Continue button, clicking...');
            try {
              el.click();
              return true;
            } catch (e) {
              console.log('Direct click failed, trying dispatchEvent...');
              try {
                el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                return true;
              } catch (e2) {
                console.log('DispatchEvent failed too');
              }
            }
          }
        }
        return false;
      });
    },
    
    // Strategy 2: Look for button elements specifically
    async () => {
      return await page.evaluate(() => {
        const buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"]');
        for (const btn of buttons) {
          const text = btn.textContent?.trim() || btn.value?.trim();
          if (text === 'Continue') {
            console.log('Found Continue in button element');
            try {
              btn.click();
              return true;
            } catch (e) {
              try {
                btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                return true;
              } catch (e2) {
                console.log('Button click failed');
              }
            }
          }
        }
        return false;
      });
    },
    
    // Strategy 3: Look for clickable elements with Continue text
    async () => {
      return await page.evaluate(() => {
        const clickableSelectors = ['a', 'div', 'span', 'button'];
        for (const selector of clickableSelectors) {
          const elements = document.querySelectorAll(selector);
          for (const el of elements) {
            const text = el.textContent?.trim();
            if (text === 'Continue') {
              // Check if element is visible and clickable
              const rect = el.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                console.log(`Found Continue in ${selector} element`);
                try {
                  el.click();
                  return true;
                } catch (e) {
                  console.log(`${selector} click failed`);
                }
              }
            }
          }
        }
        return false;
      });
    }
  ];
  
  // Try each strategy
  let continueClicked = false;
  for (let i = 0; i < continueStrategies.length; i++) {
    console.log(`Trying continue strategy ${i + 1}/${continueStrategies.length}`);
    try {
      const success = await continueStrategies[i]();
      if (success) {
        console.log('\u2713 Continue button clicked successfully!');
        continueClicked = true;
        await delay(3000);
        await page.screenshot({ path: 'after_continue_click.png' });
        break;
      }
    } catch (error) {
      console.log(`Continue strategy ${i + 1} failed:`, error.message);
    }
  }
  
  if (!continueClicked) {
    await page.screenshot({ path: 'continue_click_failed.png' });
    
    // Show all available button-like elements for debugging
    const availableButtons = await page.evaluate(() => {
      const elements = document.querySelectorAll('button, a, div, span');
      const buttons = [];
      for (const el of elements) {
        const text = el.textContent?.trim();
        if (text && text.length < 50 && (text.includes('Continue') || text.includes('Next') || text.includes('Submit'))) {
          buttons.push(text);
        }
      }
      return [...new Set(buttons)];
    });
    
    console.log('Available button-like elements:', availableButtons);
    throw new Error(`Continue button could not be clicked. Available buttons: ${availableButtons.join(', ')}`);
  }
  
  console.log('Continue button clicked successfully!');
}

// Fill tax details from Excel data
async function fillTaxDetails(page, rowData) {
  console.log('\n=== Filling Tax Details ===');
  await delay(3000);
  await page.screenshot({ path: 'tax_details_form.png' });
  
  // Extract values from Excel row
  const taxDetails = {
    tax: rowData.getCell('G').value || 0,
    surcharge: rowData.getCell('H').value || 0,
    cess: rowData.getCell('I').value || 0,
    interest: rowData.getCell('J').value || 0,
    penalty: rowData.getCell('L').value || 0,
    others: rowData.getCell('M').value || 0
  };
  
  console.log('Tax details from Excel:', taxDetails);
  
  // Function to fill a specific input field
  const fillField = async (fieldLabel, value) => {
    console.log(`Filling ${fieldLabel} with value: ${value}`);
    
    if (!value || value === 0) {
      console.log(`Skipping ${fieldLabel} - value is 0 or empty`);
      return true;
    }
    
    // Find and fill the input field
    const success = await page.evaluate((label, val) => {
      // Look for input fields and fill by position
      const inputs = document.querySelectorAll('input[type="text"], input[type="number"], input:not([type])');
      const visibleInputs = Array.from(inputs).filter(input => 
        input.offsetHeight > 0 && input.offsetWidth > 0 && !input.disabled
      );
      
      const fieldMap = {
        'Tax': 0,
        'Surcharge': 1,
        'Cess': 2,
        'Interest': 3,
        'Penalty': 4,
        'Others': 5
      };
      
      const fieldIndex = fieldMap[label];
      if (fieldIndex !== undefined && visibleInputs[fieldIndex]) {
        console.log(`Filling ${label} at index ${fieldIndex}`);
        visibleInputs[fieldIndex].value = val.toString();
        visibleInputs[fieldIndex].dispatchEvent(new Event('input', { bubbles: true }));
        visibleInputs[fieldIndex].dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    }, fieldLabel, value);
    
    if (success) {
      console.log(`✓ Successfully filled ${fieldLabel}`);
    } else {
      console.log(`✗ Failed to fill ${fieldLabel}`);
    }
    
    await delay(500);
    return success;
  };
  
  // Fill each field
  await fillField('Tax', taxDetails.tax);
  await fillField('Surcharge', taxDetails.surcharge);
  await fillField('Cess', taxDetails.cess);
  await fillField('Interest', taxDetails.interest);
  await fillField('Penalty', taxDetails.penalty);
  await fillField('Others', taxDetails.others);
  
  // Take screenshot after filling
  await delay(2000);
  await page.screenshot({ path: 'after_filling_tax_details.png' });
  
  // Click Continue button with human-like behavior
  console.log('\n=== Clicking Continue After Tax Details (Human-like) ===');
  
  // First, wait a bit like a human would before clicking
  await delay(2000);
  
  // Try to find and click Continue button using Puppeteer's click (more human-like)
  let continueClicked = false;
  
  try {
    // Method 1: Use Puppeteer's native click which is more human-like
    const continueButtons = await page.$$('button, a, input[type="submit"], input[type="button"]');
    
    for (const btn of continueButtons) {
      const text = await page.evaluate(el => el.textContent?.trim() || el.value?.trim(), btn);
      if (text === 'Continue') {
        console.log('Found Continue button, clicking with human-like behavior...');
        
        try {
          // Scroll to button if needed (human-like) - using page.evaluate for safety
          await page.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), btn);
          await delay(1000); // Wait for smooth scroll
          
          // Move mouse to button (human-like)
          const box = await btn.boundingBox();
          if (box) {
            // Add some randomness to make it more human-like
            const offsetX = Math.random() * 10 - 5; // Random offset between -5 and 5
            const offsetY = Math.random() * 10 - 5;
            const targetX = box.x + box.width / 2 + offsetX;
            const targetY = box.y + box.height / 2 + offsetY;
            
            await page.mouse.move(targetX, targetY, { steps: 10 }); // Smooth mouse movement
            await delay(500); // Human-like pause
            
            // Click with mouse (most human-like)
            await page.mouse.click(targetX, targetY);
            console.log('Clicked Continue button with mouse (human-like)');
            continueClicked = true;
            break;
          } else {
            // Fallback to element click
            await btn.click();
            console.log('Clicked Continue button with element click');
            continueClicked = true;
            break;
          }
        } catch (elementError) {
          console.log('Element interaction failed, trying direct click:', elementError.message);
          // Try direct element click as fallback
          try {
            await btn.click();
            console.log('Clicked Continue button with direct element click');
            continueClicked = true;
            break;
          } catch (directClickError) {
            console.log('Direct element click also failed:', directClickError.message);
          }
        }
      }
    }
    
    // If still not clicked, try JavaScript click as last resort
    if (!continueClicked) {
      continueClicked = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button, a, input[type="submit"], input[type="button"]');
        for (const btn of buttons) {
          const text = btn.textContent?.trim() || btn.value?.trim();
          if (text === 'Continue') {
            console.log('Using JavaScript click as fallback');
            btn.click();
            return true;
          }
        }
        return false;
      });
    }
    
  } catch (error) {
    console.log('Error clicking Continue button:', error.message);
    continueClicked = false;
  }
  
  if (continueClicked) {
    console.log('✓ Continue button clicked after filling tax details!');
    console.log('Waiting 5 seconds for payment method page to load...');
    await delay(5000);
    await page.screenshot({ path: 'after_continue_tax_details.png' });
    
    // Select RTGS/NEFT payment method
    console.log('\n=== Selecting RTGS/NEFT Payment Method ===');
    
    // Human-like RTGS/NEFT selection using specific selector
    let rtgsSelected = false;
    
    try {
      console.log('Looking for RTGS/NEFT tab using specific selector...');
      
      // Try the specific selectors provided by user
      const selectors = [
        'div#mat-tab-label-1-3',
        '#mat-tab-label-1-3 .mdc-tab__text-label',
        '#mat-tab-label-1-3'
      ];
      
      for (const selector of selectors) {
        try {
          const rtgsElement = await page.$(selector);
          if (rtgsElement) {
            console.log(`Found RTGS/NEFT element using selector: ${selector}`);
            
            // Human-like interaction: scroll, move mouse, pause, click
            await page.evaluate(elem => elem.scrollIntoView({ behavior: 'smooth', block: 'center' }), rtgsElement);
            await delay(800 + Math.random() * 400); // Random delay 800-1200ms
            
            const box = await rtgsElement.boundingBox();
            if (box) {
              // Random mouse movement to make it more human-like
              const offsetX = Math.random() * 20 - 10; // -10 to +10 pixels
              const offsetY = Math.random() * 20 - 10;
              const targetX = box.x + box.width / 2 + offsetX;
              const targetY = box.y + box.height / 2 + offsetY;
              
              // Move mouse with curved path (more human-like)
              await page.mouse.move(targetX - 50, targetY - 30, { steps: 5 });
              await delay(100 + Math.random() * 200);
              await page.mouse.move(targetX, targetY, { steps: 8 });
              await delay(200 + Math.random() * 300);
              
              // Human-like click with slight delay
              await page.mouse.click(targetX, targetY, { delay: 50 + Math.random() * 100 });
              console.log('Clicked RTGS/NEFT tab with human-like mouse movement');
              rtgsSelected = true;
              break;
            } else {
              // Fallback to element click
              await rtgsElement.click();
              console.log('Clicked RTGS/NEFT tab with element click');
              rtgsSelected = true;
              break;
            }
          }
        } catch (selectorError) {
          console.log(`Selector ${selector} failed:`, selectorError.message);
        }
      }
    } catch (error) {
      console.log('Error selecting RTGS/NEFT:', error.message);
    }
    
    if (rtgsSelected) {
      console.log('✓ RTGS/NEFT payment method selected successfully!');
      await delay(2000);
      
      // Click Continue button after selecting RTGS/NEFT
      console.log('\n=== Clicking Continue After RTGS/NEFT Selection ===');
      
      // Human-like final Continue button click using specific selector
      let finalContinueClicked = false;
      
      try {
        console.log('Looking for Continue button using specific selector...');
        
        // Try the specific selector provided by user
        const continueElement = await page.$('button.large-button-primary:nth-child(2)');
        
        if (continueElement) {
          console.log('Found Continue button using specific selector: button.large-button-primary:nth-child(2)');
          
          try {
            // Human-like reading pause before clicking
            await delay(1000 + Math.random() * 1000); // 1-2 second pause
            
            // Scroll to button smoothly
            await page.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), continueElement);
            await delay(600 + Math.random() * 400);
            
            const box = await continueElement.boundingBox();
            if (box) {
              // Human-like mouse movement with randomness
              const offsetX = Math.random() * 15 - 7.5; // -7.5 to +7.5 pixels
              const offsetY = Math.random() * 15 - 7.5;
              const targetX = box.x + box.width / 2 + offsetX;
              const targetY = box.y + box.height / 2 + offsetY;
              
              // Curved mouse movement (very human-like)
              await page.mouse.move(targetX - 40, targetY - 25, { steps: 6 });
              await delay(150 + Math.random() * 200);
              await page.mouse.move(targetX + 10, targetY - 5, { steps: 4 });
              await delay(100 + Math.random() * 150);
              await page.mouse.move(targetX, targetY, { steps: 3 });
              await delay(300 + Math.random() * 200);
              
              // Human-like click with variable delay
              await page.mouse.click(targetX, targetY, { delay: 80 + Math.random() * 120 });
              console.log('Clicked Continue button with human-like behavior using specific selector');
              finalContinueClicked = true;
            } else {
              // Fallback to element click
              await continueElement.click();
              console.log('Clicked Continue button with element click using specific selector');
              finalContinueClicked = true;
            }
          } catch (error) {
            console.log('Continue button click failed:', error.message);
          }
        } else {
          console.log('Continue button not found with specific selector, trying fallback...');
          
          // Fallback to general search
          const continueButtons = await page.$$('button, a, input[type="submit"], input[type="button"]');
          
          for (const btn of continueButtons) {
            const text = await page.evaluate(el => el.textContent?.trim() || el.value?.trim(), btn);
            if (text === 'Continue') {
              console.log('Found Continue button with fallback method');
              await btn.click();
              console.log('Clicked Continue button with fallback method');
              finalContinueClicked = true;
              break;
            }
          }
        }
      } catch (error) {
        console.log('Error clicking final Continue button:', error.message);
      }
      
      if (finalContinueClicked) {
        console.log('✓ Final Continue button clicked successfully!');
        await delay(5000);
        await page.screenshot({ path: 'after_final_continue.png' });
        
        // Handle Preview page Continue button
        console.log('\n=== Clicking Continue on Preview Page ===');
        
        const previewContinueClicked = await clickPreviewContinue(page);
        
        if (previewContinueClicked) {
          console.log('✓ Preview page Continue button clicked successfully!');
          
          // Wait for the final summary page to load
          await delay(3000);
          await page.screenshot({ path: 'final_summary_page.png' });
          
          // Extract comprehensive challan summary and download PDF
          console.log('\n=== Extracting Challan Summary and Downloading PDF ===');
          const summaryResult = await extractChallanSummaryAndDownloadPDF(page);
          
          if (summaryResult.success) {
            console.log('✓ Successfully extracted challan summary and downloaded PDF');
            return summaryResult;
          } else {
            console.log('✗ Failed to extract complete challan summary or download PDF');
            // Still return partial data if available
            return {
              success: false,
              ...summaryResult
            };
          }
        } else {
          console.log('✗ Could not click Preview page Continue button');
          return { success: false };
        }
      } else {
        console.log('✗ Could not click final Continue button');
        await page.screenshot({ path: 'final_continue_failed.png' });
        return { success: false };
      }
    } else {
      console.log('✗ Could not find or select RTGS/NEFT payment method');
      await page.screenshot({ path: 'rtgs_selection_failed.png' });
      return { success: false };
    }
  } else {
    console.log('✗ Could not click Continue button after tax details');
    await page.screenshot({ path: 'continue_failed_tax_details.png' });
    return { success: false };
  }
}

// Function to click Continue button on Preview page with human-like behavior
async function clickPreviewContinue(page) {
  console.log('Looking for Continue button on Preview page...');
  
  // Wait for preview page to load completely
  await delay(3000 + Math.random() * 2000); // 3-5 second wait
  await page.screenshot({ path: 'preview_page_loaded.png' });
  
  let previewContinueClicked = false;
  
  try {
    // Try the specific selector provided by user
    const continueElement = await page.$('.float-right > .largeButton');
    
    if (continueElement) {
      console.log('Found Preview Continue button using specific selector: .float-right > .largeButton');
      
      try {
        // Human-like behavior: read the preview page before clicking
        console.log('Reading preview page content (human-like pause)...');
        await delay(2000 + Math.random() * 2000); // 2-4 second reading pause
        
        // Scroll to button smoothly (human-like)
        await page.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), continueElement);
        await delay(800 + Math.random() * 600); // Wait for smooth scroll
        
        const box = await continueElement.boundingBox();
        if (box) {
          // Human-like mouse movement with extra randomness for preview page
          const offsetX = Math.random() * 25 - 12.5; // -12.5 to +12.5 pixels
          const offsetY = Math.random() * 25 - 12.5;
          const targetX = box.x + box.width / 2 + offsetX;
          const targetY = box.y + box.height / 2 + offsetY;
          
          // Extra curved mouse movement (very human-like for important action)
          await page.mouse.move(targetX - 60, targetY - 40, { steps: 8 });
          await delay(200 + Math.random() * 300);
          await page.mouse.move(targetX - 20, targetY - 10, { steps: 6 });
          await delay(150 + Math.random() * 250);
          await page.mouse.move(targetX + 5, targetY + 3, { steps: 4 });
          await delay(100 + Math.random() * 200);
          await page.mouse.move(targetX, targetY, { steps: 3 });
          
          // Human-like hesitation before final click
          await delay(500 + Math.random() * 500);
          
          // Human-like click with longer delay (important action)
          await page.mouse.click(targetX, targetY, { delay: 100 + Math.random() * 150 });
          console.log('Clicked Preview Continue button with human-like behavior');
          previewContinueClicked = true;
        } else {
          // Fallback to element click
          await continueElement.click();
          console.log('Clicked Preview Continue button with element click');
          previewContinueClicked = true;
        }
      } catch (error) {
        console.log('Preview Continue button click failed:', error.message);
      }
    } else {
      console.log('Preview Continue button not found with specific selector, trying fallback...');
      
      // Fallback to general search
      const continueButtons = await page.$$('button, a, input[type="submit"], input[type="button"]');
      
      for (const btn of continueButtons) {
        const text = await page.evaluate(el => el.textContent?.trim() || el.value?.trim(), btn);
        if (text === 'Continue') {
          console.log('Found Preview Continue button with fallback method');
          await delay(1000 + Math.random() * 1000); // Human-like pause
          await btn.click();
          console.log('Clicked Preview Continue button with fallback method');
          previewContinueClicked = true;
          break;
        }
      }
    }
    
    if (previewContinueClicked) {
      // Wait for next page to load after clicking Continue
      await delay(5000 + Math.random() * 2000); // 5-7 second wait
      await page.screenshot({ path: 'after_preview_continue.png' });
      
      // Extract CRN number and download PDF
      console.log('\n=== Extracting CRN and Downloading PDF ===');
      
      const finalResult = await extractCRNAndDownloadPDF(page);
      
      if (finalResult.success) {
        console.log('✓ CRN extracted and PDF downloaded successfully!');
        return { success: true, crn: finalResult.crn };
      } else {
        console.log('✗ Failed to extract CRN or download PDF');
        return { success: false, crn: null };
      }
    }
    
  } catch (error) {
    console.log('Error clicking Preview Continue button:', error.message);
    await page.screenshot({ path: 'preview_continue_error.png' });
  }
  
  return previewContinueClicked;
}

// Function to extract comprehensive challan summary and download PDF
async function extractChallanSummaryAndDownloadPDF(page) {
  console.log('Extracting comprehensive challan summary...');
  
  let downloadSuccess = false;
  let summaryData = {};
  
  try {
    // Extract all challan summary data
    summaryData = await page.evaluate(() => {
      const data = {};
      
      // Helper function to get text content safely
      const getTextContent = (selector) => {
        const element = document.querySelector(selector);
        return element ? element.textContent.trim() : '';
      };
      
      // Helper function to get text by label
      const getValueByLabel = (labelText) => {
        const labels = Array.from(document.querySelectorAll('*'));
        const label = labels.find(el => el.textContent && el.textContent.trim() === labelText);
        if (label) {
          // Try to find the value in the next sibling or nearby elements
          let valueElement = label.nextElementSibling;
          if (!valueElement || !valueElement.textContent.trim()) {
            valueElement = label.parentElement?.nextElementSibling;
          }
          if (!valueElement || !valueElement.textContent.trim()) {
            // Try to find in the same row
            const row = label.closest('.row, tr, .form-group');
            if (row) {
              const valueElements = row.querySelectorAll('.valueCss, .value, .col-md-3:not(:first-child)');
              valueElement = valueElements[valueElements.length - 1];
            }
          }
          return valueElement ? valueElement.textContent.trim() : '';
        }
        return '';
      };
      
      // Extract Challan Details
      data.crn = getTextContent('.row:nth-child(3) .col-md-3:nth-child(1) .valueCss') || 
                 getValueByLabel('CRN') || 
                 getTextContent('[class*="crn"], [id*="crn"]');
      
      data.createdOn = getValueByLabel('Created On') || 
                       getTextContent('.row:nth-child(3) .col-md-3:nth-child(2) .valueCss');
      
      data.validTill = getValueByLabel('Valid Till') || 
                       getTextContent('.row:nth-child(3) .col-md-3:nth-child(3) .valueCss');
      
      data.paymentMode = getValueByLabel('Payment Mode') || 
                         getTextContent('.row:nth-child(3) .col-md-3:nth-child(4) .valueCss');
      
      // Extract Taxpayer Details
      data.pan = getValueByLabel('PAN') || 
                 getTextContent('[class*="pan"], [id*="pan"]');
      
      data.name = getValueByLabel('Name') || 
                  getTextContent('[class*="name"], [id*="name"]:not([id*="pan"])');
      
      data.taxApplicable = getValueByLabel('Tax Applicable (Major Head)') || 
                           getValueByLabel('Tax Applicable');
      
      data.typeOfPayment = getValueByLabel('Type of Payment (Minor Head)') || 
                           getValueByLabel('Type of Payment');
      
      data.assessmentYear = getValueByLabel('Assessment Year') || 
                            getValueByLabel('AY');
      
      data.financialYear = getValueByLabel('Financial Year') || 
                           getValueByLabel('FY');
      
      // Try alternative selectors for common fields
      const allText = document.body.textContent;
      
      // Extract CRN if not found
      if (!data.crn) {
        const crnMatch = allText.match(/CRN[:\s]*([A-Z0-9]{12})/i);
        if (crnMatch) data.crn = crnMatch[1];
      }
      
      // Extract PAN if not found
      if (!data.pan) {
        const panMatch = allText.match(/PAN[:\s]*([A-Z]{5}[0-9]{4}[A-Z]{1})/i);
        if (panMatch) data.pan = panMatch[1];
      }
      
      // Extract dates if not found
      if (!data.createdOn) {
        const dateMatch = allText.match(/(\d{2}-\w{3}-\d{4})/g);
        if (dateMatch && dateMatch.length > 0) data.createdOn = dateMatch[0];
      }
      
      if (!data.validTill) {
        const dateMatch = allText.match(/(\d{2}-\w{3}-\d{4})/g);
        if (dateMatch && dateMatch.length > 1) data.validTill = dateMatch[1];
      }
      
      // Extract assessment year pattern
      if (!data.assessmentYear) {
        const ayMatch = allText.match(/(20\d{2}-\d{2})/g);
        if (ayMatch) {
          data.assessmentYear = ayMatch.find(year => year.includes('25-26') || year.includes('24-25')) || ayMatch[0];
        }
      }
      
      // Extract payment mode
      if (!data.paymentMode) {
        if (allText.includes('RTGS') || allText.includes('NEFT')) {
          data.paymentMode = 'RTGS/NEFT';
        }
      }
      
      return data;
    });
    
    console.log('✓ Extracted challan summary:', summaryData);
    
    // Human-like pause before downloading (reading the page)
    console.log('Reading challan details before downloading (human-like pause)...');
    await delay(2000 + Math.random() * 2000); // 2-4 second reading pause
    
    // Download PDF with human-like behavior
    console.log('Downloading PDF with human-like behavior...');
    
    const downloadSelectors = [
      '.col-md-3 > .defaultButton',
      '.defaultButton > .verticalMiddle',
      '.defaultButton',
      'button[class*="download"]',
      'a[class*="download"]',
      '[class*="mandate"] button',
      'button:contains("Download")',
      'a:contains("Download")'
    ];
    
    for (const selector of downloadSelectors) {
      try {
        const downloadElement = await page.$(selector);
        if (downloadElement) {
          console.log(`Found download button using selector: ${selector}`);
          
          // Human-like interaction before clicking download
          await page.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), downloadElement);
          await delay(800 + Math.random() * 600);
          
          const box = await downloadElement.boundingBox();
          if (box) {
            // Human-like mouse movement for download action
            const offsetX = Math.random() * 20 - 10;
            const offsetY = Math.random() * 20 - 10;
            const targetX = box.x + box.width / 2 + offsetX;
            const targetY = box.y + box.height / 2 + offsetY;
            
            // Curved mouse movement to download button
            await page.mouse.move(targetX - 40, targetY - 30, { steps: 6 });
            await delay(150 + Math.random() * 200);
            await page.mouse.move(targetX + 5, targetY - 5, { steps: 4 });
            await delay(100 + Math.random() * 150);
            await page.mouse.move(targetX, targetY, { steps: 3 });
            
            // Human-like hesitation before download
            await delay(500 + Math.random() * 500);
            
            // Click download button
            await page.mouse.click(targetX, targetY, { delay: 100 + Math.random() * 150 });
            console.log('Clicked download button with human-like behavior');
            downloadSuccess = true;
            break;
          } else {
            // Fallback to element click
            await downloadElement.click();
            console.log('Clicked download button with element click');
            downloadSuccess = true;
            break;
          }
        }
      } catch (selectorError) {
        console.log(`Download selector ${selector} failed:`, selectorError.message);
      }
    }
    
    if (downloadSuccess) {
      // Wait for download to complete using the new PDF management function
      console.log('Waiting for PDF download to complete...');
      const downloadResult = await waitForPDFDownload(`Challan_${summaryData.crn}`, 15000);
      
      if (downloadResult.success) {
        console.log('✓ PDF download confirmed and managed successfully');
        // Update the PDF path with the actual downloaded file
        summaryData.actualPdfPath = downloadResult.filePath;
        summaryData.actualPdfName = downloadResult.fileName;
      } else {
        console.log('✗ PDF download verification failed');
        downloadSuccess = false;
      }
      
      await page.screenshot({ path: 'after_pdf_download.png' });
    } else {
      console.log('✗ Could not find or click download button');
      await page.screenshot({ path: 'download_failed.png' });
    }
    
  } catch (error) {
    console.log('Error extracting challan summary or downloading PDF:', error.message);
    await page.screenshot({ path: 'challan_summary_error.png' });
  }
  
  // Generate PDF file path and creation date
  let pdfPath = null;
  let dateCreated = null;
  
  if (downloadSuccess && summaryData.crn) {
    // Create current date for PDF creation
    const now = new Date();
    dateCreated = now.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    }) + ' ' + now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    // Use actual downloaded PDF path if available, otherwise create expected path
    if (summaryData.actualPdfPath) {
      pdfPath = summaryData.actualPdfPath;
      console.log(`✓ Using actual PDF path: ${pdfPath}`);
    } else {
      // Fallback to expected path
      const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const pdfFileName = `Income_Tax_Challan_${summaryData.crn}_${timestamp}.pdf`;
      pdfPath = path.join(DOWNLOAD_DIR, pdfFileName);
      console.log(`✓ Using expected PDF path: ${pdfPath}`);
    }
    
    console.log(`✓ PDF creation date: ${dateCreated}`);
  }
  
  return {
    success: downloadSuccess && summaryData.crn,
    ...summaryData,
    pdfPath: pdfPath,
    dateCreated: dateCreated
  };
}

// Function to wait for and manage PDF download
async function waitForPDFDownload(expectedFileName, maxWaitTime = 30000) {
  console.log(`Waiting for PDF download: ${expectedFileName}`);
  
  const startTime = Date.now();
  const checkInterval = 1000; // Check every 1 second
  
  // Get initial file count to detect new downloads
  let initialFileCount = 0;
  try {
    const initialFiles = fs.readdirSync(DOWNLOAD_DIR);
    const initialPdfFiles = initialFiles.filter(file => file.toLowerCase().endsWith('.pdf'));
    initialFileCount = initialPdfFiles.length;
    console.log(`Initial PDF count in folder: ${initialFileCount}`);
  } catch (error) {
    console.log('Could not read initial file count:', error.message);
  }
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      // Check if any PDF files exist in the download directory
      const files = fs.readdirSync(DOWNLOAD_DIR);
      const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
      
      // Check if we have a new PDF (more than initial count)
      if (pdfFiles.length > initialFileCount) {
        // Find the most recently created PDF (should be the new one)
        let newestPdf = null;
        let newestTime = startTime; // Only consider files created after we started waiting
        
        for (const pdfFile of pdfFiles) {
          const fullPath = path.join(DOWNLOAD_DIR, pdfFile);
          const stats = fs.statSync(fullPath);
          // Only consider files created after we started waiting
          if (stats.mtime.getTime() > newestTime) {
            newestTime = stats.mtime.getTime();
            newestPdf = pdfFile;
          }
        }
        
        if (newestPdf) {
          const finalPath = path.join(DOWNLOAD_DIR, newestPdf);
          console.log(`✓ New PDF downloaded successfully: ${finalPath}`);
          console.log(`✓ PDF count increased from ${initialFileCount} to ${pdfFiles.length}`);
          return {
            success: true,
            filePath: finalPath,
            fileName: newestPdf
          };
        }
      }
    } catch (error) {
      console.log('Error checking for PDF download:', error.message);
    }
    
    await delay(checkInterval);
  }
  
  console.log('✗ PDF download timeout - no new file detected within expected time');
  return {
    success: false,
    filePath: null,
    fileName: null
  };
}

// Function to generate summary report
async function generateSummaryReport(sheet, downloadDir) {
  console.log('\n=== Generating Summary Report ===');
  
  let totalProcessed = 0;
  let successfulChallans = 0;
  let failedChallans = 0;
  let partialSuccess = 0;
  const successfulCRNs = [];
  const failedRows = [];
  
  // Count rows and analyze results
  for (let i = 2; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);
    const company = row.getCell('B').value;
    const status = row.getCell('O').value; // Status column
    const crn = row.getCell('N').value; // CRN column
    
    if (company) { // Only count rows with company names
      totalProcessed++;
      
      if (status && typeof status === 'string') {
        const statusStr = status.toLowerCase();
        if (statusStr.includes('successfully')) {
          successfulChallans++;
          if (crn) successfulCRNs.push({ company, crn });
        } else if (statusStr.includes('partial')) {
          partialSuccess++;
        } else if (statusStr.includes('failed')) {
          failedChallans++;
          failedRows.push({ row: i, company, reason: status });
        }
      }
    }
  }
  
  // Display summary
  console.log('\n' + '='.repeat(60));
  console.log('                AUTOMATION SUMMARY REPORT');
  console.log('='.repeat(60));
  console.log(`📊 Total Rows Processed: ${totalProcessed}`);
  console.log(`✅ Successful Challans: ${successfulChallans}`);
  console.log(`⚠️  Partial Success: ${partialSuccess}`);
  console.log(`❌ Failed Challans: ${failedChallans}`);
  console.log(`📁 PDFs Location: ${downloadDir}`);
  
  if (successfulCRNs.length > 0) {
    console.log('\n✅ SUCCESSFUL CHALLANS:');
    successfulCRNs.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.company} - CRN: ${item.crn}`);
    });
  }
  
  if (failedRows.length > 0) {
    console.log('\n❌ FAILED CHALLANS:');
    failedRows.forEach((item, index) => {
      console.log(`   ${index + 1}. Row ${item.row}: ${item.company} - ${item.reason}`);
    });
  }
  
  // Success rate calculation
  const successRate = totalProcessed > 0 ? ((successfulChallans / totalProcessed) * 100).toFixed(1) : 0;
  console.log(`\n📈 Success Rate: ${successRate}%`);
  
  // Generate timestamp for report
  const now = new Date();
  const reportTime = now.toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  
  console.log(`🕒 Report Generated: ${reportTime}`);
  console.log('='.repeat(60));
  
  // Save summary to text file
  const summaryContent = `
INCOME TAX CHALLAN AUTOMATION - SUMMARY REPORT
${'='.repeat(60)}
Generated: ${reportTime}

PROCESSING SUMMARY:
- Total Rows Processed: ${totalProcessed}
- Successful Challans: ${successfulChallans}
- Partial Success: ${partialSuccess}
- Failed Challans: ${failedChallans}
- Success Rate: ${successRate}%
- PDFs Location: ${downloadDir}

SUCCESSFUL CHALLANS:
${successfulCRNs.map((item, i) => `${i + 1}. ${item.company} - CRN: ${item.crn}`).join('\n')}

${failedRows.length > 0 ? `FAILED CHALLANS:
${failedRows.map((item, i) => `${i + 1}. Row ${item.row}: ${item.company} - ${item.reason}`).join('\n')}` : 'No failed challans.'}

${'='.repeat(60)}
`;
  
  try {
    const summaryFile = path.join(downloadDir, 'Automation_Summary_Report.txt');
    fs.writeFileSync(summaryFile, summaryContent);
    console.log(`📄 Summary report saved: ${summaryFile}`);
  } catch (error) {
    console.log('⚠️  Could not save summary report file:', error.message);
  }
}

// Function to setup Excel headers for challan summary data
async function setupExcelHeaders(sheet) {
  console.log('Setting up Excel headers for challan summary data...');
  
  // Add headers for new columns (N to T)
  const headers = {
    'N': 'CRN',
    'O': 'Status',
    'P': 'PDF Path',
    'Q': 'PDF Created Date',
    'R': 'Challan Created On',
    'S': 'Valid Till',
    'T': 'Payment Mode'
  };
  
  // Set headers in row 1
  for (const [column, header] of Object.entries(headers)) {
    const cell = sheet.getCell(`${column}1`);
    if (!cell.value || cell.value.toString().trim() === '') {
      cell.value = header;
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center' };
      console.log(`✓ Added header '${header}' to column ${column}`);
    }
  }
}

// Browser management functions
async function createBrowser(maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const browserConfig = {
        headless: isCloudPlatform ? 'new' : false, // Use new headless mode for better stability
        defaultViewport: { width: 1366, height: 768 }, // Set explicit viewport for consistency
        timeout: 120000, // Increase timeout for cloud platforms
        protocolTimeout: 120000, // Add protocol timeout
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--disable-extensions',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-web-security',
          '--allow-running-insecure-content',
          '--disable-features=VizDisplayCompositor',
          '--disable-ipc-flooding-protection',
          '--memory-pressure-off',
          '--max_old_space_size=4096',
          '--disable-background-networking',
          '--disable-default-apps',
          '--disable-sync',
          '--metrics-recording-only',
          '--no-crash-upload',
          '--disable-crash-reporter'
        ]
      };
      
      // Cloud platform specific optimizations
      if (isCloudPlatform) {
        browserConfig.args.push(
          '--disable-software-rasterizer',
          '--disable-background-media-suspend',
          '--disable-client-side-phishing-detection',
          '--disable-component-update',
          '--disable-domain-reliability',
          '--disable-features=AudioServiceOutOfProcess',
          '--disable-hang-monitor',
          '--disable-prompt-on-repost',
          '--disable-translate',
          '--hide-scrollbars',
          '--mute-audio',
          '--no-default-browser-check',
          '--no-pings',
          '--disable-logging',
          '--disable-permissions-api',
          '--single-process' // Only use single-process on cloud
        );
      } else {
        // Local development optimizations
        browserConfig.args.push(
          '--start-maximized',
          `--download-default-directory=${DOWNLOAD_DIR}`
        );
      }
      
      console.log(`🚀 Launching browser (attempt ${attempt}/${maxRetries})...`);
      console.log(`📊 Cloud Platform: ${isCloudPlatform ? 'Yes' : 'No'}`);
      
      const browser = await puppeteer.launch(browserConfig);
      
      // Test browser health immediately after creation
      const isHealthy = await checkBrowserHealth(browser);
      if (!isHealthy) {
        await browser.close();
        throw new Error('Browser failed health check after creation');
      }
      
      console.log('✅ Browser launched successfully');
      return browser;
    } catch (error) {
      console.log(`❌ Browser launch attempt ${attempt} failed: ${error.message}`);
      
      if (attempt === maxRetries) {
        throw new Error(`Failed to create browser after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Exponential backoff for retries
      const waitTime = Math.min(5000 * Math.pow(2, attempt - 1), 30000);
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await delay(waitTime);
    }
  }
}

async function checkBrowserHealth(browser) {
  try {
    if (!browser || !browser.isConnected()) {
      return false;
    }
    // Try to get browser version as a health check
    await browser.version();
    return true;
  } catch (error) {
    console.log('⚠️ Browser health check failed:', error.message);
    return false;
  }
}

async function createNewPageSafely(browser, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📄 Creating new page (attempt ${attempt}/${maxRetries})...`);
      
      // Check browser health first
      const isHealthy = await checkBrowserHealth(browser);
      if (!isHealthy) {
        throw new Error('Browser is not healthy');
      }
      
      // Create page with extended timeout for cloud platforms
      const timeoutMs = isCloudPlatform ? 60000 : 30000;
      const page = await Promise.race([
        browser.newPage(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Page creation timeout')), timeoutMs)
        )
      ]);
      
      // Configure page settings for stability
      const navigationTimeout = isCloudPlatform ? 60000 : 30000;
      const defaultTimeout = isCloudPlatform ? 45000 : 30000;
      
      await page.setDefaultTimeout(defaultTimeout);
      await page.setDefaultNavigationTimeout(navigationTimeout);
      
      // Set user agent to avoid detection
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Additional cloud platform optimizations
      if (isCloudPlatform) {
        // Disable images and CSS to reduce load
        await page.setRequestInterception(true);
        page.on('request', (req) => {
          const resourceType = req.resourceType();
          if (resourceType === 'image' || resourceType === 'stylesheet' || resourceType === 'font') {
            req.abort();
          } else {
            req.continue();
          }
        });
        
        // Set viewport explicitly
        await page.setViewport({ width: 1366, height: 768 });
        
        // Add error handling for page crashes
        page.on('error', (error) => {
          console.log('⚠️ Page error:', error.message);
        });
        
        page.on('pageerror', (error) => {
          console.log('⚠️ Page script error:', error.message);
        });
      }
      
      console.log('✅ New page created successfully');
      return page;
    } catch (error) {
      console.log(`❌ Failed to create page (attempt ${attempt}): ${error.message}`);
      
      if (attempt === maxRetries) {
        throw new Error(`Failed to create page after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Wait before retry with exponential backoff
      const waitTime = Math.min(3000 * Math.pow(2, attempt - 1), 15000);
      console.log(`⏳ Waiting ${waitTime}ms before page creation retry...`);
      await delay(waitTime);
    }
  }
}

async function closePageSafely(page) {
  if (!page) {
    return;
  }
  
  try {
    if (!page.isClosed()) {
      console.log('🔄 Closing current page...');
      await page.close();
      console.log('✅ Page closed successfully');
      await delay(1000);
    }
  } catch (closeErr) {
    console.log('⚠️ Error closing page:', closeErr.message);
    // Try to force close if normal close fails
    try {
      await page.evaluate(() => window.close());
    } catch (forceCloseErr) {
      console.log('⚠️ Could not force close page:', forceCloseErr.message);
    }
  }
}

async function main() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(EXCEL_FILE);
  const sheet = workbook.getWorksheet(1);
  
  // Setup headers for new columns
  await setupExcelHeaders(sheet);

  let browser = await createBrowser();

  // We'll create a new page for each row instead of reusing one page
  let currentPage = null;

  console.log(`\n=== Starting Multi-Row Processing ===`);
  console.log(`Total rows to process: ${sheet.rowCount - 1}`);
  
  for (let i = 2; i <= sheet.rowCount; i++) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`PROCESSING ROW ${i} of ${sheet.rowCount}`);
    console.log(`${'='.repeat(80)}`);
    
    const row = sheet.getRow(i);
    const company = row.getCell(2).value;  // Column B: Company Name
    const userIdRaw = row.getCell(4).value;   // Column D: User ID
    let userId = '';
    if (userIdRaw) {
      if (typeof userIdRaw === 'object' && userIdRaw.text) {
        userId = String(userIdRaw.text).trim();
      } else if (typeof userIdRaw === 'object' && userIdRaw.result) {
        userId = String(userIdRaw.result).trim();
      } else {
        userId = String(userIdRaw).trim();
      }
    }
    
    const passwordRaw = row.getCell(5).value; // Column E: Password
    let password = '';
    if (passwordRaw) {
      if (typeof passwordRaw === 'object' && passwordRaw.text) {
        password = String(passwordRaw.text).trim();
      } else if (typeof passwordRaw === 'object' && passwordRaw.result) {
        password = String(passwordRaw.result).trim();
      } else {
        password = String(passwordRaw).trim();
      }
    }
    const status = row.getCell(15).value;
    
    console.log(`User ID raw type: ${typeof userIdRaw}, value: ${userIdRaw}`);
    console.log(`Password raw type: ${typeof passwordRaw}, value: ${passwordRaw}`);
    console.log(`Processed User ID: "${userId}"`);
    console.log(`Processed Password: "${password}"`);

    if (status && typeof status.toString === 'function') {
      const statusStr = status.toString().toLowerCase();
      if (statusStr && typeof statusStr === 'string' && statusStr.includes('challan created')) {
        console.log(`Skipping ${company}`);
        continue;
      }
    }

    console.log(`Processing: ${company}`);
    
    // Wrap entire row processing in try-catch for robust error handling
    try {
      // Create a new page for this row with error handling
      try {
        currentPage = await createNewPageSafely(browser);
      } catch (pageError) {
        console.log('❌ Failed to create new page, attempting browser restart...');
        
        try {
          // Close the old browser if it exists
          if (browser && browser.isConnected()) {
            await browser.close();
          }
        } catch (closeError) {
          console.log('⚠️ Error closing old browser:', closeError.message);
        }
        
        // Create a new browser
        try {
          browser = await createBrowser();
          currentPage = await createNewPageSafely(browser);
          console.log('✅ Browser restarted and new page created successfully');
        } catch (restartError) {
          console.log(`❌ Failed to restart browser for ${company}:`, restartError.message);
          row.getCell(15).value = `Failed - Browser Error: ${restartError.message}`;
          continue; // Skip this row and continue with next
        }
      }
      
      // Set download behavior for the new page
      try {
        const client = await currentPage.target().createCDPSession();
        await client.send('Page.setDownloadBehavior', {
          behavior: 'allow',
          downloadPath: DOWNLOAD_DIR
        });
        console.log('✓ Download behavior configured for new page');
        console.log(`✓ PDFs will be saved to: ${DOWNLOAD_DIR}`);
      } catch (downloadConfigError) {
        console.log('⚠️ Could not configure download behavior:', downloadConfigError.message);
        console.log('⚠️ PDFs may go to default download folder - will attempt to move them');
      }
      
      // Patch for Node.js 22 to add $x support for the new page
      if (!currentPage.$x) {
        currentPage.$x = async function (expression) {
          return await this.evaluateHandle((exp) => {
            return document.evaluate(exp, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
          }, expression).then(async (handle) => {
            const length = await (await handle.getProperty('snapshotLength')).jsonValue();
            const results = [];
            for (let i = 0; i < length; i++) {
              const elHandle = await handle.evaluateHandle((h, index) => h.snapshotItem(index), i);
              results.push(elHandle);
            }
            return results;
          });
        };
      }
      
      console.log(`PDF will be saved to: ${DOWNLOAD_DIR}`);
      
      const success = await login(currentPage, userId, password);

      if (!success) {
        row.getCell(15).value = 'Login failed';
        continue;
      }

      // Navigate to E-Pay Tax after login
      if (success) {
        // First, check if we're on the ITR page and need to click e-File
        console.log('Checking current page after login...');
        await delay(3000);
        
        // Check if we're on the ITR page by looking for the e-File button
        const eFileButton = await currentPage.$('#e-File');
        if (eFileButton) {
          console.log('Detected ITR page, clicking e-File button...');
          const eFileClicked = await clickEFileButton(currentPage);
          if (!eFileClicked) {
            console.log('✗ Failed to click e-File button');
            row.getCell(15).value = 'Failed to click e-File button';
            continue;
          }
        }
        
        await gotoEPayTax(currentPage);
        await clickNewPaymentButton(currentPage);
        await clickIncomeTaxProceed(currentPage);
        
        // Get and log assessment year for debugging
        const assessmentYear = row.getCell('F').value;
        console.log(`Assessment Year from Excel (Column F): "${assessmentYear}" (Type: ${typeof assessmentYear})`);
        
        // Always select minor head code '300' (Self-Assessment Tax)
        await selectAssessmentYearAndMinorHead(currentPage, assessmentYear, '300');
        await clickContinueOnNewPayment(currentPage);
        
        // Fill tax details from Excel
        const taxDetailsFilled = await fillTaxDetails(currentPage, row);
        
        if (taxDetailsFilled && taxDetailsFilled.success) {
          // Save comprehensive challan summary to Excel
          console.log('\n=== Saving Challan Summary to Excel ===');
          
          // Column N - CRN
          if (taxDetailsFilled.crn) {
            row.getCell('N').value = taxDetailsFilled.crn;
            console.log(`✓ CRN: ${taxDetailsFilled.crn}`);
          }
          
          // Column P - PDF Path
          if (taxDetailsFilled.pdfPath) {
            row.getCell('P').value = taxDetailsFilled.pdfPath;
            console.log(`✓ PDF Path: ${taxDetailsFilled.pdfPath}`);
          }
          
          // Column Q - Date Created
          if (taxDetailsFilled.dateCreated) {
            row.getCell('Q').value = taxDetailsFilled.dateCreated;
            console.log(`✓ Date Created: ${taxDetailsFilled.dateCreated}`);
          }
          
          // Column R - Created On (from challan)
          if (taxDetailsFilled.createdOn) {
            row.getCell('R').value = taxDetailsFilled.createdOn;
            console.log(`✓ Challan Created On: ${taxDetailsFilled.createdOn}`);
          }
          
          // Column S - Valid Till
          if (taxDetailsFilled.validTill) {
            row.getCell('S').value = taxDetailsFilled.validTill;
            console.log(`✓ Valid Till: ${taxDetailsFilled.validTill}`);
          }
          
          // Column T - Payment Mode
          if (taxDetailsFilled.paymentMode) {
            row.getCell('T').value = taxDetailsFilled.paymentMode;
            console.log(`✓ Payment Mode: ${taxDetailsFilled.paymentMode}`);
          }
          
          // Update status in Status column (Column O - Status)
          row.getCell(15).value = 'Challan Created Successfully - Complete Summary Saved';
          console.log(`✓ Completed full challan process with comprehensive summary for ${company}`);
          
        } else if (taxDetailsFilled) {
          // Partial success - save whatever data we have
          console.log('\n=== Saving Partial Challan Data to Excel ===');
          
          if (taxDetailsFilled.crn) {
            row.getCell('N').value = taxDetailsFilled.crn;
            console.log(`✓ CRN: ${taxDetailsFilled.crn}`);
          }
          if (taxDetailsFilled.pdfPath) {
            row.getCell('P').value = taxDetailsFilled.pdfPath;
          }
          if (taxDetailsFilled.dateCreated) {
            row.getCell('Q').value = taxDetailsFilled.dateCreated;
          }
          
          row.getCell(15).value = 'Partial Success - Some data extracted';
          console.log(`⚠ Partial completion for ${company} - some data saved`);
        } else {
          row.getCell(15).value = 'Failed - Could not complete challan process';
          console.log(`✗ Failed to complete challan process for ${company}`);
        }
      }
      
      // Close current page and prepare for next row
      console.log('\n=== Preparing for Next Row ===');
      await closePageSafely(currentPage);
      currentPage = null;
      
      // Log completion of this row
      console.log(`\n${'='.repeat(80)}`);
      console.log(`COMPLETED ROW ${i}: ${company}`);
      console.log(`${'='.repeat(80)}`);
      
      await delay(2000);
      
    } catch (rowError) {
      // Handle any unexpected errors during row processing
      console.log(`\n❌ Unexpected error processing ${company}:`, rowError.message);
      console.log('Stack trace:', rowError.stack);
      
      // Update status in Excel
      row.getCell(15).value = `Failed - Unexpected Error: ${rowError.message}`;
      
      // Clean up current page if it exists
      await closePageSafely(currentPage);
      currentPage = null;
      
      // Log error completion
      console.log(`\n${'='.repeat(80)}`);
      console.log(`ERROR COMPLETED ROW ${i}: ${company}`);
      console.log(`${'='.repeat(80)}`);
      
      await delay(2000);
    }

  }
  
  // Generate summary report
  await generateSummaryReport(sheet, DOWNLOAD_DIR);
  
  // Save Excel file
  await workbook.xlsx.writeFile(EXCEL_FILE);
  
  // Close browser safely
  try {
    if (browser && browser.isConnected()) {
      await browser.close();
      console.log('✅ Browser closed successfully');
    }
  } catch (browserCloseError) {
    console.log('⚠️ Error closing browser:', browserCloseError.message);
  }
  
  console.log("\n=== Automation completed successfully ===");
  console.log(`PDFs saved in: ${DOWNLOAD_DIR}`);
  console.log(`Excel file updated: ${EXCEL_FILE}`);
}

// Use an immediately invoked async function to handle top-level await
(async () => {
  await main();
})();
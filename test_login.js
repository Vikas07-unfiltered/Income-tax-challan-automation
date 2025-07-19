const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const ExcelJS = require('exceljs');

puppeteer.use(StealthPlugin());

const EXCEL_FILE = 'IncomeTax_Challan_Template.xlsx';
const PORTAL_URL = 'https://www.incometax.gov.in/iec/foportal/';

async function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function testLogin() {
  console.log('=== STARTING LOGIN TEST ===');
  
  // Read Excel file
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(EXCEL_FILE);
  const sheet = workbook.getWorksheet(1);
  
  const row = sheet.getRow(2); // First data row
  const company = row.getCell(2).value;
  const userId = row.getCell(4).value;
  const password = row.getCell(5).value;
  
  console.log(`Company: ${company}`);
  console.log(`User ID: ${userId}`);
  console.log(`Password: ${password ? '[PROVIDED]' : '[MISSING]'}`);
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const [page] = await browser.pages();
  
  try {
    console.log('Navigating to portal...');
    await page.goto(PORTAL_URL, { waitUntil: 'networkidle2' });
    await delay(3000);

    console.log('Clicking login button...');
    const loginButton = await page.$("a.login[aria-label='Login button']");
    if (!loginButton) throw new Error("Login button not found");
    await loginButton.click();
    await delay(3000);

    console.log('Entering User ID...');
    await page.waitForSelector("input[placeholder*='User ID']", { timeout: 10000 });
    await page.type("input[placeholder*='User ID']", userId);
    await delay(1000);

    console.log('Looking for Continue button...');
    const continueButtons = await page.$$('button span');
    console.log(`Found ${continueButtons.length} button spans`);
    
    let continueBtnFound = false;
    for (let i = 0; i < continueButtons.length; i++) {
      try {
        const span = continueButtons[i];
        const text = await page.evaluate(el => {
          console.log('Element:', el);
          console.log('textContent type:', typeof el.textContent);
          console.log('textContent value:', el.textContent);
          
          if (el && el.textContent !== null && el.textContent !== undefined) {
            const content = String(el.textContent).trim();
            console.log('Converted content:', content);
            return content;
          }
          return '';
        }, span);
        
        console.log(`Button ${i}: "${text}"`);
        
        if (text === 'Continue') {
          console.log('Found Continue button, clicking...');
          await span.click();
          continueBtnFound = true;
          break;
        }
      } catch (err) {
        console.log(`Error processing button ${i}:`, err.message);
      }
    }
    
    if (!continueBtnFound) {
      console.log('Continue button not found');
    } else {
      console.log('Continue button clicked successfully');
    }
    
    await delay(4000);
    
    // Test password entry
    console.log('Testing password entry...');
    try {
      // Method 1: XPath selector
      const [passwordField] = await page.$x('//input[@id="loginPasswordField"]');
      if (passwordField) {
        console.log('Found password field using XPath');
        await passwordField.click();
        await passwordField.type(password);
        console.log('✓ Password entered using XPath');
      } else {
        console.log('Password field not found using XPath');
        
        // Method 2: CSS selector
        try {
          await page.waitForSelector("input#loginPasswordField", { timeout: 5000 });
          await page.click("input#loginPasswordField");
          await page.type("input#loginPasswordField", password);
          console.log('✓ Password entered using CSS selector');
        } catch (cssErr) {
          console.log('CSS selector failed:', cssErr.message);
        }
      }
    } catch (err) {
      console.log('Password entry error:', err.message);
    }
    
    await delay(2000);
    console.log('Test completed successfully');
    
  } catch (error) {
    console.error('Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await browser.close();
  }
}

testLogin().catch(console.error);

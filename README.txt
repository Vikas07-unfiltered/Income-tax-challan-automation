Income Tax Portal Challan Automation
------------------------------------

1. Install dependencies:
   pip install -r requirements.txt

2. Update 'IncomeTax_Challan_Template.xlsx' with your clients' data.

3. Run the script:
   python challan_automation.py

4. Output:
   - Excel will be updated with CRN, status, and PDF path.
   - PDF will be downloaded into folder like 'Vikas Challan May/'.

Note: Chrome browser and matching ChromeDriver are required.

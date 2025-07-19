const ExcelJS = require('exceljs');
const path = require('path');

// Create ideal Excel template for Income Tax Challan Automation
async function createIdealTemplate() {
  console.log('Creating ideal Excel template...');
  
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Challan Data');

  // Define column headers and their purposes
  const headers = [
    { key: 'A', header: 'Sr. No.', width: 8, description: 'Serial Number' },
    { key: 'B', header: 'Company Name', width: 25, description: 'Name of the company/taxpayer' },
    { key: 'C', header: 'PAN Number', width: 15, description: 'PAN of the taxpayer' },
    { key: 'D', header: 'User ID', width: 20, description: 'Login User ID for Income Tax Portal' },
    { key: 'E', header: 'Password', width: 15, description: 'Login Password for Income Tax Portal' },
    { key: 'F', header: 'Assessment Year', width: 15, description: 'Assessment Year (e.g., 2025-26)' },
    { key: 'G', header: 'Tax Amount', width: 15, description: 'Income Tax amount to be paid' },
    { key: 'H', header: 'Surcharge', width: 15, description: 'Surcharge amount' },
    { key: 'I', header: 'Cess', width: 15, description: 'Education Cess amount' },
    { key: 'J', header: 'Interest', width: 15, description: 'Interest amount (if any)' },
    { key: 'K', header: 'Fee (if any)', width: 15, description: 'Fee amount (if applicable)' },
    { key: 'L', header: 'Penalty', width: 15, description: 'Penalty amount (if any)' },
    { key: 'M', header: 'Others', width: 15, description: 'Other charges (if any)' },
    { key: 'N', header: 'CRN', width: 20, description: 'Challan Reference Number (auto-filled)' },
    { key: 'O', header: 'Status', width: 30, description: 'Processing status (auto-updated)' },
    { key: 'P', header: 'PDF Path', width: 40, description: 'Path to downloaded PDF (auto-filled)' },
    { key: 'Q', header: 'PDF Created Date', width: 20, description: 'PDF creation timestamp (auto-filled)' },
    { key: 'R', header: 'Challan Created On', width: 20, description: 'Challan creation date (auto-filled)' },
    { key: 'S', header: 'Valid Till', width: 20, description: 'Challan validity date (auto-filled)' },
    { key: 'T', header: 'Payment Mode', width: 15, description: 'Payment mode (auto-filled)' }
  ];

  // Set up headers with styling
  headers.forEach((col, index) => {
    const cell = worksheet.getCell(1, index + 1);
    cell.value = col.header;
    cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '366092' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } }
    };
    worksheet.getColumn(index + 1).width = col.width;
  });

  // Set row height for header
  worksheet.getRow(1).height = 25;

  // Add sample data rows with proper formatting
  const sampleData = [
    {
      srNo: 1,
      company: 'ABC Private Limited',
      pan: 'ABCPV1234J',
      userId: 'user123@example.com',
      password: 'password123',
      assessmentYear: '2025-26',
      tax: 50000,
      surcharge: 5000,
      cess: 1500,
      interest: 2000,
      fee: 0,
      penalty: 0,
      others: 0,
      status: 'Pending'
    },
    {
      srNo: 2,
      company: 'XYZ Corporation',
      pan: 'XYZCO5678K',
      userId: 'xyz.corp@example.com',
      password: 'xyz@2024',
      assessmentYear: '2025-26',
      tax: 75000,
      surcharge: 7500,
      cess: 2250,
      interest: 0,
      fee: 0,
      penalty: 1000,
      others: 500,
      status: 'Pending'
    },
    {
      srNo: 3,
      company: 'PQR Enterprises',
      pan: 'PQREN9012L',
      userId: 'pqr.enterprises@example.com',
      password: 'pqr#123',
      assessmentYear: '2025-26',
      tax: 25000,
      surcharge: 0,
      cess: 750,
      interest: 500,
      fee: 0,
      penalty: 0,
      others: 0,
      status: 'Pending'
    }
  ];

  // Add sample data with formatting
  sampleData.forEach((data, index) => {
    const rowIndex = index + 2;
    const row = worksheet.getRow(rowIndex);
    
    // Fill data
    row.getCell(1).value = data.srNo;
    row.getCell(2).value = data.company;
    row.getCell(3).value = data.pan;
    row.getCell(4).value = data.userId;
    row.getCell(5).value = data.password;
    row.getCell(6).value = data.assessmentYear;
    row.getCell(7).value = data.tax;
    row.getCell(8).value = data.surcharge;
    row.getCell(9).value = data.cess;
    row.getCell(10).value = data.interest;
    row.getCell(11).value = data.fee;
    row.getCell(12).value = data.penalty;
    row.getCell(13).value = data.others;
    row.getCell(15).value = data.status;
    
    // Apply alternating row colors
    const fillColor = index % 2 === 0 ? 'F8F9FA' : 'FFFFFF';
    for (let col = 1; col <= 20; col++) { // Only up to column T (20th column)
      const cell = row.getCell(col);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'E0E0E0' } },
        left: { style: 'thin', color: { argb: 'E0E0E0' } },
        bottom: { style: 'thin', color: { argb: 'E0E0E0' } },
        right: { style: 'thin', color: { argb: 'E0E0E0' } }
      };
    }
    
    // Set row height
    row.height = 20;
  });

  // Apply number formatting
  ['G', 'H', 'I', 'J', 'K', 'L', 'M'].forEach(col => {
    worksheet.getColumn(col).numFmt = '₹#,##0';
  });

  // Text format for specific columns
  worksheet.getColumn('F').numFmt = '@'; // Assessment Year
  worksheet.getColumn('C').numFmt = '@'; // PAN
  worksheet.getColumn('N').numFmt = '@'; // CRN

  // Freeze the header row
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];

  // Auto-filter
  worksheet.autoFilter = 'A1:T1';

  // Add instructions worksheet
  const instructionsSheet = workbook.addWorksheet('Instructions');
  
  const instructions = [
    ['Income Tax Challan Automation - Excel Template Instructions', ''],
    ['', ''],
    ['REQUIRED COLUMNS (Must be filled):', ''],
    ['Column B - Company Name', 'Name of the company or taxpayer'],
    ['Column C - PAN Number', 'PAN of the taxpayer (10 characters)'],
    ['Column D - User ID', 'Login User ID for Income Tax Portal'],
    ['Column E - Password', 'Login Password for Income Tax Portal'],
    ['Column F - Assessment Year', 'Format: 2025-26, 2024-25, etc.'],
    ['Column G - Tax Amount', 'Income Tax amount to be paid'],
    ['Column H - Surcharge', 'Surcharge amount (if applicable)'],
    ['Column I - Cess', 'Education Cess amount'],
    ['Column J - Interest', 'Interest amount (if any)'],
    ['Column L - Penalty', 'Penalty amount (if any)'],
    ['Column M - Others', 'Other charges (if any)'],
    ['', ''],
    ['AUTO-FILLED COLUMNS (Do not edit):', ''],
    ['Column N - CRN', 'Challan Reference Number (filled by automation)'],
    ['Column O - Status', 'Processing status (updated by automation)'],
    ['Column P - PDF Path', 'Path to downloaded PDF file'],
    ['Column Q - PDF Created Date', 'PDF creation timestamp'],
    ['Column R - Challan Created On', 'Challan creation date from portal'],
    ['Column S - Valid Till', 'Challan validity date'],
    ['Column T - Payment Mode', 'Payment mode (RTGS/NEFT)'],
    ['', ''],
    ['IMPORTANT NOTES:', ''],
    ['1. Do not modify column headers', ''],
    ['2. Assessment Year format must be YYYY-YY (e.g., 2025-26)', ''],
    ['3. All amount columns accept numbers only', ''],
    ['4. PAN must be valid 10-character format', ''],
    ['5. User ID and Password must be correct for portal login', ''],
    ['6. Status column will show processing progress', ''],
    ['7. Auto-filled columns will be populated after successful challan creation', '']
  ];

  instructions.forEach((instruction, index) => {
    const row = instructionsSheet.getRow(index + 1);
    row.getCell(1).value = instruction[0];
    row.getCell(2).value = instruction[1];
    
    if (index === 0) {
      // Title formatting
      row.getCell(1).font = { bold: true, size: 14, color: { argb: '366092' } };
    } else if (instruction[0].includes('COLUMNS') && instruction[0].includes(':')) {
      // Section headers
      row.getCell(1).font = { bold: true, size: 12, color: { argb: '2F5233' } };
    } else if (instruction[0].startsWith('Column')) {
      // Column descriptions
      row.getCell(1).font = { bold: true, size: 10 };
      row.getCell(2).font = { size: 10 };
    } else if (instruction[0].match(/^\\d+\\./)) {
      // Numbered points
      row.getCell(1).font = { size: 10 };
    }
  });

  instructionsSheet.getColumn(1).width = 40;
  instructionsSheet.getColumn(2).width = 50;

  return workbook;
}

// Create and save the template
async function main() {
  try {
    const workbook = await createIdealTemplate();
    const fileName = 'IncomeTax_Challan_Template_Ideal.xlsx';
    await workbook.xlsx.writeFile(fileName);
    console.log(`✅ Ideal Excel template created successfully: ${fileName}`);
    console.log('📋 Template includes:');
    console.log('   • Properly formatted headers with descriptions');
    console.log('   • Sample data for reference');
    console.log('   • Auto-filled columns for challan summary');
    console.log('   • Instructions sheet with detailed guidance');
    console.log('   • Professional styling and formatting');
    console.log('\\n🚀 You can now use this template with your automation!');
  } catch (error) {
    console.error('❌ Error creating template:', error.message);
  }
}

main();

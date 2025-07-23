const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

puppeteer.use(StealthPlugin());

// Simplified automation service for web interface
// This integrates with the existing challan_automation.js

// Helper functions
async function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function runAutomation(excelFilePath, sessionId, io) {
  const room = sessionId;
  
  // Emit progress updates
  const emitProgress = (message, progress = null, data = null) => {
    console.log(`[${sessionId}] ${message}`);
    io.to(room).emit('progress', {
      message,
      progress,
      data,
      timestamp: new Date().toISOString()
    });
  };

  try {
    emitProgress('🚀 Starting automation process...', 0);

    // Create session-specific directories
    const sessionDir = path.join(__dirname, 'processed', sessionId);
    const pdfDir = path.join(sessionDir, 'pdfs');
    
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }

    emitProgress('📄 Loading Excel file...', 5);

    // For now, we'll use the existing automation by copying the file and running it
    // This is a simplified approach for the web interface
    
    // Copy uploaded file to replace the template
    const templatePath = path.join(__dirname, 'IncomeTax_Challan_Template.xlsx');
    fs.copyFileSync(excelFilePath, templatePath);
    
    emitProgress('🔄 Running automation engine...', 20);
    
    // Run the existing automation directly
    const { exec } = require('child_process');
    
    exec('node challan_automation.js', { cwd: __dirname }, async (error, stdout, stderr) => {
      try {
        if (error) {
          throw new Error(`Automation failed: ${error.message}`);
        }
        
        emitProgress('🔄 Processing completed, organizing files...', 90);
        
        // Find the most recent date folder
        const challanPdfDir = path.join(__dirname, 'Challan_PDFs');
        let latestDateDir = null;
        
        if (fs.existsSync(challanPdfDir)) {
          const dateDirs = fs.readdirSync(challanPdfDir).filter(dir => {
            const fullPath = path.join(challanPdfDir, dir);
            return fs.statSync(fullPath).isDirectory();
          });
          
          if (dateDirs.length > 0) {
            // Get the most recent directory
            latestDateDir = dateDirs.sort().pop();
            const sourcePdfDir = path.join(challanPdfDir, latestDateDir);
            
            // Copy PDFs to session directory
            if (fs.existsSync(sourcePdfDir)) {
              const files = fs.readdirSync(sourcePdfDir);
              for (const file of files) {
                if (file.endsWith('.pdf')) {
                  const sourcePath = path.join(sourcePdfDir, file);
                  const destPath = path.join(pdfDir, file);
                  fs.copyFileSync(sourcePath, destPath);
                }
              }
            }
          }
        }
        
        // Copy processed Excel file
        const processedExcelPath = path.join(sessionDir, `${sessionId}_processed.xlsx`);
        if (fs.existsSync(templatePath)) {
          fs.copyFileSync(templatePath, processedExcelPath);
        }
        
        // Create summary report
        const reportPath = path.join(sessionDir, `${sessionId}_report.txt`);
        const summaryReportPath = latestDateDir ? 
          path.join(challanPdfDir, latestDateDir, 'Automation_Summary_Report.txt') : null;
        
        let reportContent = `Income Tax Challan Automation Report\n`;
        reportContent += `=====================================\n\n`;
        reportContent += `Session ID: ${sessionId}\n`;
        reportContent += `Completed: ${new Date().toISOString()}\n`;
        reportContent += `Total PDFs Generated: ${pdfFiles.length}\n\n`;
        
        if (summaryReportPath && fs.existsSync(summaryReportPath)) {
          const originalReport = fs.readFileSync(summaryReportPath, 'utf8');
          reportContent += 'Original Automation Report:\n';
          reportContent += '================================\n';
          reportContent += originalReport;
        } else {
          reportContent += 'Processing Details:\n';
          reportContent += '==================\n';
          reportContent += 'Processing completed successfully.\n';
          reportContent += 'Check the Excel file for detailed results.\n';
          reportContent += `Generated ${pdfFiles.length} PDF challan files.\n`;
        }
        
        reportContent += '\n\nFiles Generated:\n';
        reportContent += '================\n';
        pdfFiles.forEach((file, index) => {
          reportContent += `${index + 1}. ${file}\n`;
        });
        
        fs.writeFileSync(reportPath, reportContent);
        
        // Create ZIP file of PDFs
        const zipPath = path.join(sessionDir, `${sessionId}_pdfs.zip`);
        await createPDFZip(pdfDir, zipPath);
        
        // Count actual results
        const pdfFiles = fs.existsSync(pdfDir) ? 
          fs.readdirSync(pdfDir).filter(f => f.endsWith('.pdf')) : [];
        
        // Final completion data
        const completionData = {
          processed: pdfFiles.length,
          successful: pdfFiles.length,
          failed: 0,
          totalAmount: 0, // Will be calculated from Excel if needed
          downloadLinks: {
            excel: `/download/${sessionId}/excel`,
            pdfs: `/download/${sessionId}/pdfs`,
            report: `/download/${sessionId}/report`
          },
          summary: `Processing completed! Generated ${pdfFiles.length} PDF files.`
        };
        
        emitProgress('🎉 Automation completed successfully!', 100, completionData);
        
        // Also emit a specific completion event
        io.to(room).emit('completion', completionData);
        
      } catch (processError) {
        console.error('Processing error:', processError);
        emitProgress(`❌ Error organizing results: ${processError.message}`, -1, { error: processError.message });
      }
      
      // Clean up uploaded file
      if (fs.existsSync(excelFilePath)) {
        fs.unlinkSync(excelFilePath);
      }
    });
    
  } catch (error) {
    console.error(`Automation error for session ${sessionId}:`, error);
    emitProgress(`❌ Automation failed: ${error.message}`, -1, { error: error.message });
  }
}

async function createPDFZip(pdfDir, zipPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`ZIP created: ${archive.pointer()} total bytes`);
      resolve();
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);

    // Add all PDF files to the archive
    const files = fs.readdirSync(pdfDir);
    const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
    
    pdfFiles.forEach(file => {
      const filePath = path.join(pdfDir, file);
      archive.file(filePath, { name: file });
    });

    archive.finalize();
  });
}

module.exports = { runAutomation };

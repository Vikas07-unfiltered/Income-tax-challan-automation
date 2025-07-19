# 🏢 Income Tax Challan Automation

**Automated Income Tax Challan Processing System** - A comprehensive web-based solution for generating income tax challans from Excel data with real-time processing and company-wide accessibility.

![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![Express](https://img.shields.io/badge/Express-4.18+-blue.svg)
![Puppeteer](https://img.shields.io/badge/Puppeteer-24+-red.svg)
![License](https://img.shields.io/badge/License-ISC-yellow.svg)

## 🎯 Features

### 🚀 **Core Automation**
- **Multi-row Excel Processing** - Process multiple tax entries in one go
- **Automated Browser Navigation** - Uses Puppeteer with stealth mode
- **Smart Error Handling** - Continues processing even if individual entries fail
- **Date-based PDF Organization** - Saves PDFs in organized date folders

### 🌐 **Web Application**
- **Modern Responsive UI** - Beautiful, user-friendly interface
- **Drag & Drop Upload** - Easy Excel file uploading
- **Real-time Progress Tracking** - Live updates via Socket.IO
- **Template Download** - Users can download the Excel template instantly
- **Bulk Downloads** - Download processed Excel, PDFs (ZIP), and reports

### 📊 **Data Management**
- **Comprehensive Excel Integration** - Reads input data and saves detailed results
- **Challan Summary Extraction** - Captures all challan details automatically
- **PDF Download & Storage** - Organizes PDFs by date for easy management
- **Detailed Reporting** - Generates processing summaries with statistics

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- Chrome/Chromium browser
- Windows/Linux/macOS

### Quick Setup
```bash
# Clone the repository
git clone https://github.com/Vikas07-unfiltered/Income-tax-challan-automation.git
cd Income-tax-challan-automation

# Install dependencies
npm install

# Start the web server
npm start
```

The application will be available at `http://localhost:3001`

## 📋 Usage

### 1. **Download Excel Template**
- Visit the web interface
- Click "Download Excel Template" button
- Use the provided template with proper column structure

### 2. **Fill Template Data**
Required columns (A-M):
- **Company Name, PAN Number**
- **User ID & Password** (for portal login)
- **Assessment Year** (e.g., 2025-26)
- **Tax amounts** (Tax, Surcharge, Cess, Interest, Fee, Penalty, Others)

### 3. **Upload & Process**
- Drag & drop your filled Excel file
- Monitor real-time progress
- Download results when complete

### 4. **Download Results**
- **Processed Excel** - Updated with challan details
- **PDF Archive** - ZIP file with all generated PDFs
- **Summary Report** - Detailed processing statistics

## 🏗️ Project Structure

```
├── 📁 public/                 # Web interface files
│   ├── index.html            # Main web page
│   └── script.js             # Frontend JavaScript
├── 📁 Challan_PDFs/          # Generated PDFs (organized by date)
├── 📁 processed/             # Processed files for download
├── 📄 server.js              # Express web server
├── 📄 challan_automation.js  # Core automation logic
├── 📄 automation-service.js  # Automation service wrapper
├── 📄 IncomeTax_Challan_Template.xlsx  # Excel template
└── 📄 package.json           # Dependencies and scripts
```

## 🚀 Online Deployment

### Quick Deploy Options

#### **Railway (Recommended)**
```bash
npm install -g @railway/cli
railway login
railway deploy
```

#### **Render.com**
1. Connect your GitHub repository
2. Set Build Command: `npm install`
3. Set Start Command: `npm start`

#### **Heroku**
```bash
npm install -g heroku
heroku create your-app-name
git push heroku main
```

#### **Netlify**
1. Connect GitHub repository
2. Deploy automatically with included `netlify.toml`

📖 **Detailed deployment instructions:** [ONLINE_DEPLOYMENT_GUIDE.md](ONLINE_DEPLOYMENT_GUIDE.md)

## 🔧 Configuration

### Environment Variables
```bash
PORT=3001                    # Server port (default: 3001)
NODE_ENV=production         # Environment mode
```

### Browser Configuration
The automation uses Puppeteer with stealth mode and optimized settings for reliable portal navigation.

## 📊 Excel Template Structure

### Input Columns (A-M)
| Column | Field | Description |
|--------|-------|-------------|
| A | Sr. No. | Serial number |
| B | Company Name | Organization name |
| C | PAN Number | Permanent Account Number |
| D | User ID | Portal login ID |
| E | Password | Portal login password |
| F | Assessment Year | Format: 2025-26 |
| G-M | Tax Amounts | Tax, Surcharge, Cess, Interest, Fee, Penalty, Others |

### Auto-filled Output Columns (N-Z)
- **CRN, Status, PDF Path**
- **Challan Details** (Created On, Valid Till, Payment Mode)
- **Summary Information** (PAN, Name, Tax Type, Assessment Year)

## 🛡️ Security Features

- **Rate Limiting** - Prevents abuse
- **File Validation** - Only accepts .xlsx files
- **Helmet Security** - HTTP security headers
- **CORS Protection** - Configurable cross-origin requests
- **Session Isolation** - Multi-user support with separate processing

## 🔍 Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Kill process on port 3001
npx kill-port 3001
npm start
```

**Puppeteer Issues**
- Ensure Chrome/Chromium is installed
- Check internet connectivity
- Verify portal credentials

**Excel Processing Errors**
- Use the provided template format
- Ensure all required columns are filled
- Check for special characters in data

## 📈 Performance

- **Concurrent Processing** - Handles multiple users simultaneously
- **Memory Efficient** - Optimized for large Excel files
- **Error Recovery** - Continues processing despite individual failures
- **Progress Tracking** - Real-time updates for better UX

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation:** Check the deployment guide and code comments
- **Issues:** Open a GitHub issue for bugs or feature requests
- **Company Use:** Perfect for internal automation needs

## 🎉 Acknowledgments

- Built with Node.js, Express, and Puppeteer
- Modern web interface with Bootstrap and Socket.IO
- Designed for enterprise-level automation needs

---

**🚀 Ready to automate your income tax challan processing? Deploy now and share with your team!**

[![Deploy to Railway](https://railway.app/button.svg)](https://railway.app/new/template)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)
[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

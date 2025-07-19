#!/usr/bin/env node

/**
 * 🚀 Income Tax Challan Automation - Deployment Helper
 * 
 * This script helps you deploy your application to various cloud platforms
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Income Tax Challan Automation - Deployment Helper\n');

// Check if required files exist
const requiredFiles = [
    'package.json',
    'server.js',
    'public/index.html',
    'IncomeTax_Challan_Template.xlsx',
    '.gitignore',
    'netlify.toml'
];

console.log('📋 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - MISSING!`);
        allFilesExist = false;
    }
});

if (!allFilesExist) {
    console.log('\n❌ Some required files are missing. Please ensure all files are present before deployment.');
    process.exit(1);
}

console.log('\n✅ All required files are present!');

// Display deployment options
console.log('\n🌐 Deployment Options:');
console.log('1. Railway.app (Recommended - Easiest)');
console.log('2. Render.com (Free tier available)');
console.log('3. Heroku (Classic choice)');
console.log('4. Netlify (Static + Functions)');

console.log('\n📖 For detailed instructions, see: ONLINE_DEPLOYMENT_GUIDE.md');

// Check if git is initialized
if (!fs.existsSync('.git')) {
    console.log('\n🔧 Git repository not initialized. Initializing...');
    try {
        execSync('git init', { stdio: 'inherit' });
        execSync('git add .', { stdio: 'inherit' });
        execSync('git commit -m "Initial commit for deployment"', { stdio: 'inherit' });
        console.log('✅ Git repository initialized and files committed!');
    } catch (error) {
        console.log('⚠️  Git initialization failed. You may need to do this manually.');
    }
}

// Display quick start commands
console.log('\n🚀 Quick Start Commands:');
console.log('\n📍 Railway (Recommended):');
console.log('   npm install -g @railway/cli');
console.log('   railway login');
console.log('   railway deploy');

console.log('\n📍 Render:');
console.log('   1. Go to https://render.com');
console.log('   2. Connect GitHub and select this repository');
console.log('   3. Set Build Command: npm install');
console.log('   4. Set Start Command: npm start');

console.log('\n📍 Heroku:');
console.log('   npm install -g heroku');
console.log('   heroku login');
console.log('   heroku create income-tax-challan-automation');
console.log('   git push heroku main');

console.log('\n📍 Netlify:');
console.log('   1. Go to https://netlify.com');
console.log('   2. Drag and drop this project folder');
console.log('   3. Or connect via GitHub');

console.log('\n🎯 Your app features:');
console.log('   ✅ Excel template download');
console.log('   ✅ Drag & drop file upload');
console.log('   ✅ Real-time progress tracking');
console.log('   ✅ Automated challan generation');
console.log('   ✅ PDF and Excel downloads');
console.log('   ✅ Company-wide access');

console.log('\n🔗 Once deployed, share the URL with your company users!');
console.log('\n📞 Need help? Check ONLINE_DEPLOYMENT_GUIDE.md for detailed instructions.');

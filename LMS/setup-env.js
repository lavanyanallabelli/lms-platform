#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up environment configuration...\n');

// Check if .env already exists
if (fs.existsSync('.env')) {
    console.log('⚠️  .env file already exists!');
    console.log('   If you want to recreate it, delete the existing .env file first.\n');
    process.exit(0);
}

// Read the template
const templatePath = path.join(__dirname, 'env-template.txt');
if (!fs.existsSync(templatePath)) {
    console.error('❌ env-template.txt not found!');
    process.exit(1);
}

// Copy template to .env
try {
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    fs.writeFileSync('.env', templateContent);

    console.log('✅ .env file created successfully!');
    console.log('📝 Your Firebase and OpenAI keys are already configured.');
    console.log('\n🚀 Next steps:');
    console.log('   1. Run: npm install');
    console.log('   2. Run: npm start');
    console.log('   3. Deploy to Cloudflare Pages');
    console.log('\n📚 See DEPLOYMENT-GUIDE.md for detailed instructions.');

} catch (error) {
    console.error('❌ Error creating .env file:', error.message);
    process.exit(1);
}

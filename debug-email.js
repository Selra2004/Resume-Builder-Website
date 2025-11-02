// Debug email configuration
const fs = require('fs');
const path = require('path');

// Manually read .env file
const envPath = path.join(__dirname, 'server', '.env');
console.log('Reading .env from:', envPath);

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  const envVars = {};
  envLines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key] = valueParts.join('=');
      }
    }
  });

  console.log('🔧 Email Configuration Debug:');
  console.log('EMAIL_SERVICE:', envVars.EMAIL_SERVICE);
  console.log('EMAIL_USER:', envVars.EMAIL_USER);
  console.log('EMAIL_PASS:', envVars.EMAIL_PASS ? '***configured***' : 'NOT SET');
  console.log('EMAIL_FROM:', envVars.EMAIL_FROM);

  // Test Gmail configuration detection
  const isGmail = envVars.EMAIL_SERVICE === 'gmail';
  console.log('Using Gmail SMTP:', isGmail);

  if (isGmail) {
    console.log('Gmail SMTP Config:');
    console.log('- Host: smtp.gmail.com');
    console.log('- Port: 587');
    console.log('- User:', envVars.EMAIL_USER);
    console.log('- Password configured:', !!envVars.EMAIL_PASS);
  } else {
    console.log('Using localhost SMTP (this will fail)');
  }

} catch (error) {
  console.error('Error reading .env file:', error.message);
}

const fs = require('fs');

async function testOCR(lang) {
  const formData = new FormData();
  formData.append('language', lang);
  
  // Create a Blob from the file
  const buffer = fs.readFileSync('d:/Rakshak-AI/functions/rakshak_function/test.jpg');
  const blob = new Blob([buffer], { type: 'image/jpeg' });
  formData.append('image', blob, 'test.jpg');

  try {
    const response = await fetch('http://localhost:3000/server/rakshak_function/api/ocr', {
      method: 'POST',
      body: formData
    });
    
    const text = await response.text();
    console.log(`Lang: ${lang}, Status: ${response.status}`);
    console.log(`Response:`, text.substring(0, 150));
  } catch (err) {
    console.error(`Error for ${lang}: ${err.message}`);
  }
}

async function run() {
  await testOCR('kannada');
  await testOCR('kan');
  await testOCR('hin');
  await testOCR('hindi');
}
run();

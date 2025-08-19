import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Method 1: Try pdf-parse (most common)
async function tryPdfParse(buffer) {
  try {
    const pdfParse = await import('pdf-parse');
    const data = await pdfParse.default(buffer);
    return data.text;
  } catch (error) {
    console.log('pdf-parse failed:', error.message);
    return null;
  }
}

// Method 2: Try pdfjs-dist (Mozilla's PDF.js)
async function tryPdfJs(buffer) {
  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js');
    const loadingTask = pdfjsLib.getDocument({ data: buffer });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText.trim();
  } catch (error) {
    console.log('pdfjs-dist failed:', error.message);
    return null;
  }
}

// Method 3: Try pdf2pic + OCR (for image-based PDFs)
async function tryPdfToImage(filePath) {
  try {
    // This requires tesseract-ocr to be installed on the system
    const { stdout } = await execAsync(`pdftotext "${filePath}" -`);
    return stdout.trim();
  } catch (error) {
    console.log('pdftotext failed:', error.message);
    return null;
  }
}

export default async (fileBuffer, filePath = null) => {
  console.log('🔍 Attempting to parse PDF...');
  
  // Method 1: pdf-parse
  let text = await tryPdfParse(fileBuffer);
  if (text && text.trim().length > 0) {
    console.log('✅ PDF parsed successfully with pdf-parse');
    return { text: text.trim(), metadata: { method: 'pdf-parse' } };
  }

  // Method 2: pdfjs-dist
  text = await tryPdfJs(fileBuffer);
  if (text && text.trim().length > 0) {
    console.log('✅ PDF parsed successfully with pdfjs-dist');
    return { text: text.trim(), metadata: { method: 'pdfjs-dist' } };
  }

  // Method 3: System pdftotext (if available and filePath provided)
  if (filePath) {
    text = await tryPdfToImage(filePath);
    if (text && text.trim().length > 0) {
      console.log('✅ PDF parsed successfully with pdftotext');
      return { text: text.trim(), metadata: { method: 'pdftotext' } };
    }
  }

  // If all methods fail, try to extract any readable content
  const bufferText = fileBuffer.toString('utf8', 0, Math.min(1000, fileBuffer.length));
  if (bufferText.includes('PDF')) {
    console.warn('⚠️ PDF detected but could not extract text. It might be image-based or encrypted.');
    throw new Error('PDF appears to be image-based or encrypted. Please use OCR or convert to text format.');
  }

  console.error('❌ All PDF parsing methods failed');
  throw new Error('Failed to parse PDF with all available methods');
};
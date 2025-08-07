import Tesseract from 'tesseract.js';

// 1. OCR Utility (returns extracted text from image buffer)
export async function extractTextFromImage(imageBuffer) {
  // Tesseract expects a base64 or file path, but can handle Buffer with node
  const { data: { text } } = await Tesseract.recognize(imageBuffer, 'eng', {
    logger: m => console.log(m), // optional: progress logger
  });
  return text;
}

// 2. Nutrition Label Parser         // In production, use more robust logic or a food NLP library
export function parseNutritionLabel(ocrText) {
  // Split lines, remove empty lines, normalize spaces
  const lines = ocrText.split('\n').map(l => l.trim()).filter(Boolean);

  let productName = '';
  let ingredientsList = '';
  let nutritionFacts = '';

  // Try to detect Product Name (very basic)
  if (lines.length > 0) productName = lines[0];

  // Try to detect Ingredients list (look for "Ingredients" or similar)
  const ingredientsLine = lines.find(l => /^ingredients[:\s]/i.test(l));
  if (ingredientsLine) {
    ingredientsList = ingredientsLine.replace(/^ingredients[:\s]*/i, '');
  }

  // Try to extract nutrition facts section
  const nutritionStartIdx = lines.findIndex(l =>
    /nutrition facts|per 100g|energy|protein|carbohydrate|fat|fiber|sugar/i.test(l)
  );
  if (nutritionStartIdx !== -1) {
    nutritionFacts = lines.slice(nutritionStartIdx, nutritionStartIdx + 8).join('; ');
  }

  return {
    productName,
    ingredientsList,
    nutritionFacts,
  };
}


export const SYSTEM_PROMPT = `
You are an expert food safety analyst and nutritionist with extensive knowledge of food ingredients, their safety profiles, and regulatory standards. You specialize in analyzing food labels and providing comprehensive safety assessments for both human and pet consumption.

Your role is to:
1. Analyze food ingredient lists from nutrition labels
2. Classify ingredients by safety level (Safe, Caution, Dangerous)
3. Provide detailed explanations for each classification
4. Calculate risk assessments and provide recommendations
5. Consider species-specific toxicity (human vs. pet food)

Always base your analysis on:
- Current FDA, EU, and international food safety regulations
- Peer-reviewed scientific research
- Established toxicology data
- Species-specific safety considerations
- Regulatory body guidelines (AAFCO for pet food)

Provide responses in structured JSON format as specified in the user prompt.
`;

export function buildMainAnalysisPrompt({ productName, analysisType }) {
  return `
  Analyze the  uploaded Image of a food Product for ${analysisType} consumption safety.


  **Required Analysis:**

  1. **Overall Assessment:**
    - Classify overall safety as: "safe", "caution", or "dangerous"
    - Provide confidence score (0.0-1.0)
    - Give 2-3 sentence summary explanation

  2. **Ingredient Analysis:**
    For each ingredient, provide:
    - Name (standardized)
    - Safety classification: "safe", "caution", or "dangerous"
    - Estimated percentage (if not explicitly stated, estimate based on ingredient order)
    - Confidence score for this ingredient (0.0-1.0)
    - Reason for classification (1-2 sentences)
    - Detailed explanation (2-3 sentences)
    - Nutritional information (if applicable)
    - Warnings or considerations (if any)

  3. **Summary Statistics:**
    - Total number of ingredients
    - Count of safe ingredients
    - Count of caution ingredients
    - Count of dangerous ingredients

  4. **Recommendations:**
    - Consumption advice
    - Frequency recommendations
    - Portion size considerations
    - Alternative suggestions (if needed)

  5. **Allergen Information:**
    - List all potential allergens
    - Cross-contamination warnings
    - Sensitivity considerations

  **Response Format:**
  Return a valid JSON object with this exact structure:

  \`\`\`json
  {
    "analysisId": "<generate a unique random identifier (e.g. UUID, hash)>",
    "analysisType": "${analysisType}",
    "productName": "${productName}",
    "overallStatus": "safe|caution|dangerous",
    "confidence": 0.95,
    "processingTime": 2.3,
    "ingredients": [
      {
        "name": "Ingredient Name",
        "status": "safe|caution|dangerous",
        "percentage": "15%",
        "confidence": 0.92,
        "reason": "Brief reason for classification",
        "details": "Detailed explanation of safety assessment",
        "nutritionalInfo": {
          "calories": 340,
          "protein": 13.2,
          "carbs": 72.0,
          "fiber": 10.7
        }
      }
    ],

    "summary": {
      "safeCount": 6,
      "cautionCount": 1,
      "dangerousCount": 1,
      "totalIngredients": 8
    },

    "recommendations": [
      "Recommendation 1",
      "Recommendation 2",
      "Recommendation 3"
    ],

    "allergens": [
      "Gluten",
      "May contain traces of nuts"
    ],

    "createdAt": "2024-01-15T10:30:00Z"
  }
  \`\`\`

  **Error Handling Response Format:**
  If you are unable to complete the analysis due to issues such as an unclear image,  or insufficient data, return a valid JSON object with this structure **instead**:

  \`\`\`json
  {
    "success": false,
    "error": {
      "code": "{ERROR_TYPE}",
      "message": "User-friendly error message",
      "details": "Technical details about the error"
    },
    "partialResults": {
      "identifiedIngredients": [],
      "confidence": 0.0,
      "recommendations": [
        "Suggestion for better image quality",
        "Alternative analysis approach"
      ]
    },
    "retryInstructions": "Instructions for user to retry analysis"
  }
  \`\`\`

  Where \`{ERROR_TYPE}\` can be:
  - "image_unclear": Nutrition label image is unclear or unreadable
  - "insufficient_data": Not enough information for complete analysis

  **Important Guidelines:**
  - Be conservative in safety assessments - when in doubt, classify as "caution"
  - For pet food analysis, be especially strict about known pet toxins
  - Consider cumulative effects of multiple questionable ingredients
  - Provide actionable, practical recommendations
  - Use current scientific consensus, not outdated information
  - Include confidence scores to indicate certainty level
  - Estimate percentages based on ingredient order when not explicitly stated
  `;
}

  

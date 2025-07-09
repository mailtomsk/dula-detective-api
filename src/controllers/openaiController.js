import dotenv from 'dotenv';
import OpenAI from 'openai';
import { success, error } from '../utils/apiResponse.js';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function ask(req, res) {
  const { prompt } = req.body;
  if (!prompt) return error(res, "Prompt is required", 400);
  try {
    const response = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o",
    });
    return success(res, response.choices[0].message.content, "OpenAI chat result");
  } catch (e) {
    return error(res, e.message || "OpenAI Error", 500, e.stack);
  }
}

export async function vision(req, res) {
  try {
    if (!req.file || !req.file.mimetype.startsWith('image/')) {
      return error(res, "Valid image file is required.", 400);
    }

    const analysisType  = `You are a food analysing expert, based on this pack details, provide me overall assessment, including how safe, how cautious and how dangerous. Rank me the cautious out of 10. Include the list of safe ingredients, and their safe percentage. Include caution required. Provide some very useful insights for this product 
      Return the response as a JSON object with this structure (ensure there are NO trailing commas or extra characters — it must be valid JSON only and Return ONLY a valid JSON object, wrapped inside triple backticks like \`\`\`json ... \`\`\`. Do not add any explanations or comments.):
      "data": {        
      "overallStatus": number,
      "confidence": number,
      "processingTime": number,
      "ingredients": [
        {
          "name": string,
          "status": string,
          "percentage": string,
          "confidence": number,
          "reason": string,
          "details": string,
          "nutritionalInfo": {
            "calories": number,
            "protein": number,
            "carbs": number,
            "fiber": number
          }
        },
        {
          "name": string,
          "status": string,
          "percentage": number,
          "confidence": number,
          "reason": string,
          "details": string,
          "warnings": [string]
        }
      ],
      "summary": {
        "safeCount": number,
        "cautionCount": number,
        "dangerousCount": number,
        "totalIngredients": number
      },
      "recommendations": [
        string
      ],
      "allergens": [string],
    }`;
    const base64Image = req.file.buffer.toString('base64');
    const imageMimeType = req.file.mimetype;

    const dataUrl = `data:${imageMimeType};base64,${base64Image}`;  

    // OpenAI Vision API call
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: analysisType },
            {
              type: "image_url",
              image_url: { url: dataUrl }
            }
          ]
        }
      ]
    });

    const result = response.choices?.[0]?.message?.content?.trim();
    if (!result) {
      return error(res, "Empty response from OpenAI. Try again or with a different image.", 502);
    }

    // Attempt to extract JSON
    let cleanedResponse;
    try {      
      const match = result.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      const jsonStr = match ? match[1] : result;
      cleanedResponse = JSON.parse(jsonStr);
    } catch (parseErr) {
      //If OpenAI responded with "I'm unable..."
      if (/i'm unable|i cannot|not able|could not|can't/i.test(result)) {
        return error(
          res,
          "OpenAI was unable to analyze the image. Please upload a clearer image of a food label or product.",
          400
        );
      }
      // Default parse error
      return error(res, "Failed to parse JSON from OpenAI", 502, parseErr.message);
    }

    const outputData = cleanedResponse.data ? cleanedResponse.data : cleanedResponse;
    return success(res, outputData, "Analysis completed successfully");
  } catch (e) {   
    return error(res, e?.error?.message || e.message || "Server Error", e.statusCode || 500, e.stack);       
  }
}

import dotenv from 'dotenv';
import OpenAI from 'openai';
import { success, error, openaiError } from '../utils/apiResponse.js';
import { extractTextFromImage, parseNutritionLabel } from '../utils/ocrUtils.js';
import { SYSTEM_PROMPT, buildMainAnalysisPrompt } from '../utils/foodPrompts.js';

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

    const { analysisType } = req.body;

    if (!analysisType || (analysisType !== 'human' && analysisType !== 'pet')) {
      return error(res, "Valid 'analysisType' is required. It must be either 'human' or 'pet'.", 400);
    }    

    // OCR
    const ocrText = await extractTextFromImage(req.file.buffer);

    // Parse fields
    const { productName, ingredientsList, nutritionFacts } = parseNutritionLabel(ocrText);

    // Build user prompt
    const mainPrompt = buildMainAnalysisPrompt({
      productName: productName || "Unknown Product",
      analysisType: analysisType || "human",
      ingredientsList: ingredientsList || "Not provided",
      nutritionFacts: nutritionFacts || "Not provided"
    });

    const base64Image = req.file.buffer.toString('base64');
    const imageMimeType = req.file.mimetype;
    const dataUrl = `data:${imageMimeType};base64,${base64Image}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: mainPrompt },
            { type: "image_url", image_url: { url: dataUrl } }
          ]
        }
      ]
    });

    const result = response.choices?.[0]?.message?.content?.trim();
    if (!result) {
      return openaiError(res, { code: "OPENAI_EMPTY_RESPONSE", message: "Empty response from OpenAI. Try again or with a different image." }, 502);
    }

    // Parse result JSON
    let cleanedResponse;
    try {
      const match = result.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      const jsonStr = match ? match[1] : result;
      cleanedResponse = JSON.parse(jsonStr);
    } catch (parseErr) {
      // Check if OpenAI indicated it couldn't analyze
      if (/i'm unable|i cannot|not able|could not|can't/i.test(result)) {
        return openaiError(
          res,
          { code: "OPENAI_CANNOT_ANALYZE", message: "OpenAI was unable to analyze the image. Please upload a clearer image of a food label or product." },
          400
        );
      }
      return openaiError(res, { code: "OPENAI_INVALID_JSON", message: "Failed to parse JSON from OpenAI" }, 502, { details: parseErr.message });
    }

    const outputData = cleanedResponse.data ? cleanedResponse.data : cleanedResponse;

    // If OpenAI response has success: false, treat as API error
    if (outputData.success === false) {
      return openaiError(
        res,
        {
          code: outputData.error?.code || "ANALYSIS_FAILED",
          message: outputData.error?.message || "Analysis failed"
        },
        400,
        {
          ...(outputData.error?.details && { details: outputData.error.details }),
          ...(outputData.partialResults && { partialResults: outputData.partialResults }),
          ...(outputData.retryInstructions && { retryInstructions: outputData.retryInstructions })
        }
      );
    }

    return success(res, outputData, "Analysis completed successfully");
  } catch (e) {
    return openaiError(
      res,
      { code: "SERVER_ERROR", message: e?.error?.message || e.message || "Server Error" },
      e.statusCode || 500,
      { details: e.stack }
    );
  }
}

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import { getFullImageUrl } from '../utils/helpers.js';
import { success, error, openaiError } from '../utils/apiResponse.js';
import { extractTextFromImage, parseNutritionLabel } from '../utils/ocrUtils.js';
import { SYSTEM_PROMPT, buildMainAnalysisPrompt } from '../utils/foodPrompts.js';

dotenv.config();

const prisma = new PrismaClient();

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
    console.log("analysis", req); 
    if (!req.file || !req.file.mimetype.startsWith('image/')) {
      return error(res, "Valid image file is required.", 400);
    }

    const { analysisType } = req.body;

    if (!analysisType || (analysisType !== 'human' && analysisType !== 'pet')) {
      return error(res, "Valid 'analysisType' is required. It must be either 'human' or 'pet'.", 400);
    }    

    //Save File to Storage
    const uploadType = 'scan';
    const timestamp = Date.now();
    const ext = req.file.originalname.split('.').pop();
    const filename = `${uploadType}_${timestamp}.${ext}`;
    const uploadDir = path.join(`./public/uploads/${uploadType}`);
    const filePath = path.join(uploadDir, filename);

    // Ensure uploads directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Save the file to disk
    fs.writeFileSync(filePath, req.file.buffer);

    const storedFilename = filename;

    // Save to ScanHistory if needed
    await prisma.scanHistory.create({
      data: {
        user_id: req.user?.userId || null,
        image_path: storedFilename,
        analysis_type :analysisType
      }
    });

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

    const analysisId = outputData.analysisId || uuidv4();


    // Save analysis in DB
    await prisma.scanAnalysis.create({
      data: {
        analysis_id: analysisId,
        user_id: req.user?.userId || null,
        image_url: storedFilename,
        product_name: outputData.productName,
        analysis_type: outputData.analysisType,
        overall_status: outputData.overallStatus,
        confidence: outputData.confidence,
        processing_time: outputData.processingTime || null,
        ingredients: outputData.ingredients,
        summary: outputData.summary,
        recommendations: outputData.recommendations,
        allergens: outputData.allergens,
        created_at: new Date(Date.now())
      }
    });


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

export async function getAnalysisHistory(req, res) {
  try {
    const userId = req.user.userId;
    const {
      page = 1,
      limit = 20,
      analysisType = 'all',
      status = 'all'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = Math.min(parseInt(limit), 100);

    const whereClause = {
      user_id: userId,
      ...(analysisType !== 'all' && { analysis_type: analysisType }),
      ...(status !== 'all' && { overall_status: status })
    };

    const [totalItems, analyses] = await Promise.all([
      prisma.scanAnalysis.count({ where: whereClause }),
      prisma.scanAnalysis.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
        skip,
        take,
        select: {
          analysis_id: true,
          product_name: true,
          analysis_type: true,
          overall_status: true,
          confidence: true,
          summary: true,
          image_url: true,
          created_at: true
        }
      })
    ]);

    return success(res, {
      analyses: analyses.map(item => ({
        id: item.analysis_id,
        productName: item.product_name,
        analysisType: item.analysis_type,
        overallStatus: item.overall_status,
        confidence: item.confidence,
        summary: item.summary,
        createdAt: item.created_at,
        imageUrl: getFullImageUrl(item.image_url)
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / take),
        totalItems,
        hasNext: skip + take < totalItems,
        hasPrev: skip > 0
      }
    });
  } catch (e) {
    return error(res, 'Failed to fetch analysis history', 500, [{ details: e.message }]);
  }
}

export async function getAnalysisDetails(req, res) {
  try {
    const userId = req.user.userId;
    const analysisId = req.params.id;

    const analysis = await prisma.scanAnalysis.findUnique({
      where: {
        analysis_id: analysisId,
        user_id: userId
      }
    });

    if (!analysis) {
      return error(res, 'Analysis not found', 404);
    }

    return success(res, {
      analysisId: analysis.analysis_id,
      analysisType: analysis.analysis_type,
      overallStatus: analysis.overall_status,
      confidence: analysis.confidence,
      processingTime: analysis.processing_time,
      ingredients: analysis.ingredients,
      summary: analysis.summary,
      recommendations: analysis.recommendations,
      allergens: analysis.allergens,
      imageUrl: getFullImageUrl(analysis.image_url),
      createdAt: analysis.created_at
    });
  } catch (e) {
    return error(res, 'Failed to fetch analysis details', 500, [{ details: e.message }]);
  }
}

export async function deleteAnalysis(req, res) {
  try {
    const userId = req.user.userId;
    const analysisId = req.params.id;

    const existing = await prisma.scanAnalysis.findUnique({
      where: {
        analysis_id: analysisId,
        user_id: userId
      }
    });

    if (!existing) {
      return error(res, 'Analysis not found', 404);
    }

    await prisma.scanAnalysis.delete({
      where: { analysis_id: analysisId }
    });

    return success(res, null, 'Analysis deleted successfully');
  } catch (e) {
    return error(res, 'Failed to delete analysis', 500, [{ details: e.message }]);
  }
}


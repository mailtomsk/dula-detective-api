import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { success, error, openaiError } from '../utils/apiResponse.js';
import { BarcodeService } from '../services/barcodeService.js';
import { PrismaClient } from '@prisma/client';
import { buildBarcodeAnalysisPrompt } from '../utils/foodPrompts.js';
import { OpenAIService } from '../services/openaiService.js';

const prisma = new PrismaClient();

export class FoodAnalysisContoller {

    static async barcodeInfo(req, res) {
         const { barcode } = req.body;
         if (!barcode) {
             return error(res, "Enter valid barcode.", 422);
         }
        const barcodeInfo = await BarcodeService.fetchdetails(barcode);
        const barcode_details = barcodeInfo.data || false;
        if (!barcode_details) {
            return error(res, "Barcode is not valid or no data found for the barcode", 422);
        }

        const product = {
            'barcode':barcode,
            'name': barcode_details.name,
            'brand': barcode_details.brand,
            'image_url': barcode_details.image_url,
        }
        return success(res, product, "Barcode Information");


    }

    static async barcodeAnalysis(req, res) {
        try {
            const { barcode, analysisType } = req.body;

            if (!barcode) {
                return error(res, "Enter valid barcode.", 422);
            }
            if (!analysisType || (analysisType !== 'human' && analysisType !== 'pet')) {
                return error(res, "Valid 'analysisType' is required. It must be either 'human' or 'pet'.", 422);
            }

            const data = {
                user_id: req.user?.userId || null,
                analysis_type: analysisType,
                barcode: barcode
            };

             //Add Request to History
            await FoodAnalysisContoller.updateScanHistory(data);

            const barcodeInfo = await BarcodeService.fetchdetails(barcode);

            const barcode_details = barcodeInfo.data || false;
            if (!barcode_details) {
                return error(res, "Barcode is not valid or no data found for the barcode", 422);
            }

            var ai_reponse = barcode_details.ai_reponse ?? false;
            if(ai_reponse){
                ai_reponse = JSON.parse(ai_reponse);
               if (ai_reponse.success != false) {
                  ai_reponse.analysisId = crypto.randomUUID();
                  ai_reponse.productImage = barcode_details.image_url ?? null;
                  await FoodAnalysisContoller.createScanAnalysis(ai_reponse.analysisId,ai_reponse,req.user?.userId,barcode);
                  return success(res, ai_reponse, "Analysis completed successfully. data fetched from database");
               }
            }

            const product = {
                'name': barcode_details.name,
                'brand': barcode_details.brand,
                'ingredients': barcode_details.ingredients,
                'nutrition':barcode_details.nutrition
            }

            const mainPrompt = buildBarcodeAnalysisPrompt({
                product: product || "Unknown Product",
                analysisType: analysisType || "human"
            });



            const result = await OpenAIService.chatCompletions(mainPrompt);

            if (!result) {
                return openaiError(res, { code: "OPENAI_EMPTY_RESPONSE", message: "Barcode is not valid or no data found for the barcode" }, 422);
            }

            let cleanedResponse = await FoodAnalysisContoller.cleanReponse(result);


            if (!cleanedResponse) {
                return openaiError(res, { code: "OPENAI_EMPTY_RESPONSE", message: "Barcode is not valid or no data found for the barcode" }, 422);
            }

            if (cleanedResponse.success == false) {
                return openaiError(res, { code: cleanedResponse.code, message: cleanedResponse.message }, 502);
            }
            var cleanReponse = cleanedResponse.data;
            const outputData = cleanReponse.data ? cleanReponse.data : cleanReponse;
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
            outputData.productImage = barcode_details.image_url ?? null;
            await FoodAnalysisContoller.createScanAnalysis(analysisId,outputData,req.user?.userId,barcode);
            // Save analysis in DB
            await BarcodeService.updateAIResponse(barcode,outputData);
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

     static async createScanAnalysis(analysisId,outputData,userId,barcode){

        var data = {
                analysis_id: analysisId,
                user_id: userId,
                barcode:barcode,
                image_url:null,
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
            };

        await prisma.scanAnalysis.create({
            data:data
        });
    }

    static async updateScanHistory(data) {
        return await prisma.scanHistory.create({ data });
    }

    static async readableNutrition(obj) {

        return Object.entries(obj)
            .map(([key, value]) => {
                const label = key
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, char => char.toUpperCase());
                return `${label}: ${value}`;
            })
            .join('\n');
    }

    static async cleanReponse(result) {
        let cleanedResponse = '';
        console.log(result,"resultss");
        try {
            const match = result.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
            const jsonStr = match ? match[1] : result;
            cleanedResponse = JSON.parse(jsonStr);
            return {
                data: cleanedResponse,
                success: true
            }

        } catch (parseErr) {
            // Check if OpenAI indicated it couldn't analyze
            if (/i'm unable|i cannot|not able|could not|can't/i.test(result)) {
                return {
                    "code": "OPENAI_CANNOT_ANALYZE",
                    "message": "OpenAI was unable to analyze the image. Please upload a clearer image of a food label or product.",
                    'success': false
                }
            }
            return {
                code: "OPENAI_INVALID_JSON",
                message: parseErr.message,
                success: false
            }

        }

    }




}




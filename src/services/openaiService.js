import OpenAI from 'openai';
import { SYSTEM_PROMPT } from '../utils/foodPrompts.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class OpenAIService {
    static async chatCompletions(mainPrompt) {
        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: mainPrompt },
                        ]
                    }
                ]
            });
            const result = response.choices?.[0]?.message?.content?.trim();
            return result;
        } catch (error) {
            console.log(error);
            return false;
        }
    }
}
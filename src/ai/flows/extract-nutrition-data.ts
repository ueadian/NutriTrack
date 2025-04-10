'use server';

/**
 * @fileOverview Extracts nutrition data from a food label image using OCR and AI.
 *
 * - extractNutritionData - A function that handles the nutrition data extraction process.
 * - ExtractNutritionDataInput - The input type for the extractNutritionData function.
 * - ExtractNutritionDataOutput - The return type for the extractNutritionData function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const ExtractNutritionDataInputSchema = z.object({
  photoUrl: z.string().describe('The URL of the food label image.'),
});
export type ExtractNutritionDataInput = z.infer<typeof ExtractNutritionDataInputSchema>;

const ExtractNutritionDataOutputSchema = z.object({
  calories: z.number().describe('The number of calories in the serving.'),
  protein: z.number().describe('The amount of protein in grams in the serving.'),
  fat: z.number().describe('The amount of fat in grams in the serving.'),
  carbohydrates: z.number().describe('The amount of carbohydrates in grams in the serving.'),
  sugar: z.number().describe('The amount of sugar in grams in the serving.'),
});
export type ExtractNutritionDataOutput = z.infer<typeof ExtractNutritionDataOutputSchema>;

export async function extractNutritionData(input: ExtractNutritionDataInput): Promise<ExtractNutritionDataOutput> {
  return extractNutritionDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractNutritionDataPrompt',
  input: {
    schema: z.object({
      photoUrl: z.string().describe('The URL of the food label image.'),
    }),
  },
  output: {
    schema: z.object({
      calories: z.number().describe('The number of calories in the serving.'),
      protein: z.number().describe('The amount of protein in grams in the serving.'),
      fat: z.number().describe('The amount of fat in grams in the serving.'),
      carbohydrates: z.number().describe('The amount of carbohydrates in grams in the serving.'),
      sugar: z.number().describe('The amount of sugar in grams in the serving.'),
    }),
  },
  prompt: `You are an AI trained to extract nutritional information from food labels.
  Given an image of a food label, extract the following information if present, if the value is not found return 0:
  - Calories
  - Protein (in grams)
  - Fat (in grams)
  - Total Carbohydrates (in grams)
  - Sugar (in grams)

  If the label specifies "Added Sugars", use this value for the sugar content. Otherwise use the "Sugar" value.

  Ensure that you accurately identify and extract the "Total Carbohydrates" value from the label.

  Return the extracted information in a structured JSON format.

  Here is the food label image: {{media url=photoUrl}}
  `,
});

const extractNutritionDataFlow = ai.defineFlow<
  typeof ExtractNutritionDataInputSchema,
  typeof ExtractNutritionDataOutputSchema
>({
  name: 'extractNutritionDataFlow',
  inputSchema: ExtractNutritionDataInputSchema,
  outputSchema: ExtractNutritionDataOutputSchema,
}, async input => {
  const {output} = await prompt(input);
  return output!;
});

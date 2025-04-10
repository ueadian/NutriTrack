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
  photoUrl: z.string().optional().describe('The URL of the food label image.'),
});
export type ExtractNutritionDataInput = z.infer<typeof ExtractNutritionDataInputSchema>;

const ExtractNutritionDataOutputSchema = z.object({
  calories: z.number().describe('The number of calories in the serving.'),
  protein: z.number().describe('The amount of protein in grams in the serving.'),
  fat: z.number().describe('The amount of fat in grams in the serving.'),
  carbohydrates: z.number().describe('The amount of carbohydrates in grams in the serving.'),
  sugar: z.number().describe('The amount of sugar in grams in the serving.'),
  barcode: z.string().describe('The barcode extracted from image if available')
});
export type ExtractNutritionDataOutput = z.infer<typeof ExtractNutritionDataOutputSchema>;

export async function extractNutritionData(input: ExtractNutritionDataInput): Promise<ExtractNutritionDataOutput> {
  // If no image is available, return default values or throw an error
  if (!input.photoUrl) {
    throw new Error('No photo URL provided.');
  }

  console.log('Attempting to extract nutrition data from image...');
  try {
    return await extractNutritionDataFlow({photoUrl: input.photoUrl});
  } catch (error: any) {
    console.error('Error extracting nutrition data from image:', error.message);
    throw new Error('Failed to extract nutrition data from image.');
  }
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
      barcode: z.string().describe('The barcode extracted from image if available')
    }),
  },
  prompt: `You are an AI trained to extract nutritional information from food labels and barcodes.
  Given an image, extract the following information if present, if the value is not found return 0:
  - Calories
  - Protein (in grams)
  - Fat (in grams)
  - Total Carbohydrates (in grams)
  - Sugar (in grams)
  - Barcode Number

  If the label specifies "Added Sugars", use this value for the sugar content. Otherwise use the "Sugar" value.

  Ensure that you accurately identify and extract the "Total Carbohydrates" value from the label.

  Here is the image: {{media url=photoUrl}}
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

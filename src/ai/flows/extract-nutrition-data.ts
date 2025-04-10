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
  barcode: z.string().optional().describe('The barcode of the food product.'),
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

const BarcodeLookupInputSchema = z.object({
  barcode: z.string().describe('The barcode of the food product.'),
});

const barcodeLookupFlow = ai.defineFlow<
  typeof BarcodeLookupInputSchema,
  typeof ExtractNutritionDataOutputSchema
>({
  name: 'barcodeLookupFlow',
  inputSchema: BarcodeLookupInputSchema,
  outputSchema: ExtractNutritionDataOutputSchema,
}, async input => {
  const apiUrl = `https://world.openfoodfacts.org/api/v0/product/${input.barcode}.json`;
  const response = await fetch(apiUrl);
  const data = await response.json();

  if (data.status === 1) {
    const product = data.product;
    console.log('Product data from Open Food Facts:', product);
    return {
      calories: product.nutriments?.energy_kcal || 0,
      protein: product.nutriments?.protein || 0,
      fat: product.nutriments?.fat || 0,
      carbohydrates: product.nutriments?.carbohydrates || 0,
      sugar: product.nutriments?.sugars || 0,
    };
  } else {
    // Handle the case where the barcode is not found
    throw new Error('Barcode not found in Open Food Facts database.');
  }
});

export async function extractNutritionData(input: ExtractNutritionDataInput): Promise<ExtractNutritionDataOutput> {
  // First, try to extract data using the barcode
  if (input.barcode) {
    try {
      console.log('Attempting to extract nutrition data from barcode...');
      const barcodeData = await barcodeLookupFlow({barcode: input.barcode});
      console.log('Nutrition data extracted from barcode:', barcodeData);
      return barcodeData;
    } catch (error: any) {
      console.error('Error extracting nutrition data from barcode:', error.message);
      // If barcode extraction fails, proceed with image analysis
    }
  }

  // If no barcode or barcode extraction fails, proceed with image analysis
  if (input.photoUrl) {
    console.log('Attempting to extract nutrition data from image...');
    return extractNutritionDataFlow({photoUrl: input.photoUrl});
  }

  // If neither barcode nor image is available, return default values or throw an error
  throw new Error('No barcode or photo URL provided.');
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

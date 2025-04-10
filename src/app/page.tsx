'use client';

import Image from 'next/image';
import {useState, useEffect, useRef} from 'react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Slider} from '@/components/ui/slider';
import {Textarea} from '@/components/ui/textarea';
import {Progress} from '@/components/ui/progress';
import {extractNutritionData, ExtractNutritionDataOutput} from '@/ai/flows/extract-nutrition-data';
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import {toast} from "@/hooks/use-toast"
import {Icons} from "@/components/icons"

export default function Home() {
  const [caloriesTarget, setCaloriesTarget] = useState(2000);
  const [proteinTarget, setProteinTarget] = useState(50);
  const [fatTarget, setFatTarget] = useState(70);
  const [carbsTarget, setCarbsTarget] = useState(250);
  const [sugarTarget, setSugarTarget] = useState(50);

  const [caloriesIntake, setCaloriesIntake] = useState(0);
  const [proteinIntake, setProteinIntake] = useState(0);
  const [fatIntake, setFatIntake] = useState(0);
  const [carbsIntake, setCarbsIntake] = useState(0);
  const [sugarIntake, setSugarIntake] = useState(0);

  const [foodName, setFoodName] = useState('');
  const [nutritionInfo, setNutritionInfo] = useState('');
  const [servingSize, setServingSize] = useState(1);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractNutritionDataOutput | null>(null);
  const [barcode, setBarcode] = useState(''); // New state for barcode
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [imageType, setImageType] = useState<string | null>(null); // "label" or "barcode"
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiSource, setApiSource] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [genAiBarcode, setGenAiBarcode] = useState<string | null>(null);

  const calculateProgress = (intake: number, target: number) => {
    if (target === 0) return 0;
    return Math.min((intake / target) * 100, 100);
  };

  const trackIntake = () => {
    // Placeholder logic - replace with actual data source
    const foodCalories = 150 * servingSize; // Example value, replace with actual data
    const foodProtein = 10 * servingSize; // Example value
    const foodFat = 5 * servingSize; // Example value
    const foodCarbs = 20 * servingSize; // Example value
    const foodSugar = 5 * servingSize; // Example value

    setCaloriesIntake(caloriesIntake + foodCalories);
    setProteinIntake(proteinIntake + foodProtein);
    setFatIntake(fatIntake + foodFat);
    setCarbsIntake(carbsIntake + foodCarbs);
    setSugarIntake(sugarIntake + foodSugar);
  };

  const handleImageCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setApiResponse(null);
    setGenAiBarcode(null);
    setBarcode('');
    setApiSource(null);
    setErrorMessage(null);
    setImageType(null);
    setExtractedData(null);

    const file = event.target.files![0];
    const reader = new FileReader();
    reader.onloadend = async () => {
      const imageUrl = reader.result as string;
      setCapturedImage(imageUrl);

      try {
        const extracted = await extractNutritionData({photoUrl: imageUrl});
        setExtractedData(extracted);
        setApiResponse(extracted);
        setApiSource('AI Label Scanning');
        setImageType('label');
      } catch (error: any) {
        console.error('Error extracting nutrition data from image:', error.message);
        setApiResponse({error: error.message});
        setApiSource('AI Label Scanning');
        setErrorMessage('Failed to extract nutrition data from the image. Please try again or enter manually.');
        setImageType('label');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBarcodeCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setApiResponse(null);
    setGenAiBarcode(null);
    setBarcode('');
    setApiSource(null);
    setErrorMessage(null);
    setImageType(null);
    setExtractedData(null);

    setCapturedImage(URL.createObjectURL(event.target.files![0]));
    const file = event.target.files![0];
    const reader = new FileReader();
    reader.onloadend = async () => {
      const imageUrl = reader.result as string;
      try {
        await processBarcodeImage(imageUrl); // Call processBarcodeImage with the image URL
      } catch (error: any) {
        console.error('Error extracting nutrition data from barcode:', error.message);
        setApiResponse({error: error.message});
        setApiSource('AI Barcode Scanning');
        setErrorMessage('Failed to extract nutrition data from barcode. Please try again or enter manually.');
      }
    };
    reader.readAsDataURL(file);
  };

  const processBarcodeImage = async (imageUrl: string) => {
    try {
      // Extract the barcode from image using AI
      const extractedBarcodeData = await extractNutritionData({ photoUrl: imageUrl });

      if (!extractedBarcodeData) {
        setApiResponse({ error: 'Failed to extract barcode number from the image' });
        setApiSource('AI Barcode Scanning');
        setErrorMessage('Failed to extract barcode number from the image. Please try again or enter manually.');
        setImageType('barcode');
        return;
      }

      // Set the extracted barcode
      setGenAiBarcode(extractedBarcodeData.barcode);
      console.log(`Barcode number extracted from image ${extractedBarcodeData.barcode}`);

      // Process the barcode
      await processBarcode(extractedBarcodeData.barcode);
    } catch (error: any) {
      console.error('Error extracting barcode from image:', error.message);
      setApiResponse({ error: error.message });
      setApiSource('AI Barcode Scanning');
      setErrorMessage('Failed to extract barcode from the image. Please try again.');
    }
  };


  const processBarcode = async (barcodeValue: string) => {
    setBarcode(barcodeValue);
    try {
      console.log(`Attempting to fetch data from Open Food Facts API with barcode: ${barcodeValue}`);
      setGenAiBarcode(barcodeValue);
      setApiSource('Open Food Facts API');
      const apiUrl = `https://world.openfoodfacts.org/api/v0/product/${barcodeValue}.json`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.status === 1) {
        console.log('Data fetched from Open Food Facts API successfully.');
        const product = data.product;
        const extracted = {
          calories: product.nutriments.energy_kcal || 0,
          protein: product.nutriments.protein || 0,
          fat: product.nutriments.fat || 0,
          carbohydrates: product.nutriments.carbohydrates || 0,
          sugar: product.nutriments.sugars || 0,
          barcode: barcodeValue
        };
        setExtractedData(extracted);
        setApiResponse(extracted);
      } else {
        console.warn('Product not found in Open Food Facts API.');
        setApiResponse({error: 'Product not found in Open Food Facts database.'});
        setErrorMessage('Product not found in Open Food Facts database.');
      }
    } catch (error: any) {
      console.error('Error fetching data from Open Food Facts API:', error.message);
      setApiResponse({error: error.message});
      setErrorMessage('Failed to fetch data from Open Food Facts API.');
    }
  };

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({video: true});
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this app.',
        });
      }
    };

    getCameraPermission();
  }, []);

  const calculateCaloriesRemaining = () => {
    return caloriesTarget - caloriesIntake;
  };
  const calculateProteinRemaining = () => {
    return proteinTarget - proteinIntake;
  };
  const calculateFatRemaining = () => {
    return fatTarget - fatIntake;
  };
  const calculateCarbsRemaining = () => {
    return carbsTarget - carbsIntake;
  };
  const calculateSugarRemaining = () => {
    return sugarTarget - sugarIntake;
  };

  return (
    <main className="container mx-auto p-4">
      <section className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Daily Nutrition Tracker</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Calories</CardTitle>
              <CardDescription>Your daily calorie intake</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{caloriesIntake}</div>
              <div className="text-sm text-muted-foreground">Target: {caloriesTarget}</div>
              <Progress value={calculateProgress(caloriesIntake, caloriesTarget)} />
              <div className="text-sm text-muted-foreground">Remaining: {calculateCaloriesRemaining()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Protein</CardTitle>
              <CardDescription>Your daily protein intake (grams)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{proteinIntake}g</div>
              <div className="text-sm text-muted-foreground">Target: {proteinTarget}g</div>
              <Progress value={calculateProgress(proteinIntake, proteinTarget)} />
              <div className="text-sm text-muted-foreground">Remaining: {calculateProteinRemaining()}g</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fat</CardTitle>
              <CardDescription>Your daily fat intake (grams)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fatIntake}g</div>
              <div className="text-sm text-muted-foreground">Target: {fatTarget}g</div>
              <Progress value={calculateProgress(fatIntake, fatTarget)} />
              <div className="text-sm text-muted-foreground">Remaining: {calculateFatRemaining()}g</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Carbs</CardTitle>
              <CardDescription>Your daily carbohydrate intake (grams)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{carbsIntake}g</div>
              <div className="text-sm text-muted-foreground">Target: {carbsTarget}g</div>
              <Progress value={calculateProgress(carbsIntake, carbsTarget)} />
              <div className="text-sm text-muted-foreground">Remaining: {calculateCarbsRemaining()}g</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sugar</CardTitle>
              <CardDescription>Your daily sugar intake (grams)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sugarIntake}g</div>
              <div className="text-sm text-muted-foreground">Target: {sugarTarget}g</div>
              <Progress value={calculateProgress(sugarIntake, sugarTarget)} />
              <div className="text-sm text-muted-foreground">Remaining: {calculateSugarRemaining()}g</div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Add Food Intake</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual Entry</CardTitle>
              <CardDescription>Enter food details manually</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="food-name">Food Name</Label>
                  <Input type="text" id="food-name" placeholder="e.g., Apple" value={foodName} onChange={e => setFoodName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="nutrition-info">Nutrition Info</Label>
                  <Textarea id="nutrition-info" placeholder="Calories: 80, Protein: 1g, ..." value={nutritionInfo} onChange={e => setNutritionInfo(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="serving-size">Serving Size</Label>
                  <Input type="number" id="serving-size" placeholder="1" value={servingSize} onChange={e => setServingSize(Number(e.target.value))} />
                </div>
                <Button onClick={trackIntake}>Track Intake</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Capture Food Label</CardTitle>
              <CardDescription>Upload an image of the food label to extract nutrition data</CardDescription>
            </CardHeader>
            <CardContent>
              <Input type="file" accept="image/*" onChange={handleImageCapture} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scan Barcode</CardTitle>
              <CardDescription>Upload an image of the barcode to extract nutrition data</CardDescription>
            </CardHeader>
            <CardContent>
              <Input type="file" accept="image/*" onChange={handleBarcodeCapture} />
            </CardContent>
          </Card>

          {extractedData && (
              <Card>
               <CardHeader>
                 <CardTitle>Extracted Nutrition Data</CardTitle>
                 <CardDescription>
                   Nutrition data extracted from the image.
                 </CardDescription>
               </CardHeader>
               <CardContent>
                 {extractedData ? (
                   <div>
                     <p>Calories: {extractedData?.calories}</p>
                     <p>Protein: {extractedData?.protein}g</p>
                     <p>Fat: {extractedData?.fat}g</p>
                     <p>Carbohydrates: {extractedData?.carbohydrates}g</p>
                     <p>Sugar: {extractedData?.sugar}g</p>
                   </div>
                 ) : (
                   <p>No data extracted.</p>
                   )}
               </CardContent>
             </Card>
           )}
         </div>
       </section>

       <section className="mb-8">
         <h2 className="text-xl font-semibold mb-2">Debugging Information</h2>
         {capturedImage && <Image src={capturedImage} alt="Captured Image" width={200} height={200} />}
         {imageType && <p>Image Type: {imageType}</p>}
         {genAiBarcode && <p>Gen AI Extracted Barcode: {genAiBarcode}</p>}
         {barcode && <p>Barcode Number: {barcode}</p>}
         {apiSource && <p>API Source: {apiSource}</p>}
         {apiResponse && (
           <div>
             <p>API Response ({apiSource}):</p>
             <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
             {errorMessage && (
               <Alert variant="destructive">
                 <AlertTitle>Error</AlertTitle>
                 <AlertDescription>{errorMessage}</AlertDescription>
               </Alert>
             )}
           </div>
         )}
       </section>
     </main>
   );
 };


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
        const extracted = await extractNutritionData({photoUrl: imageUrl});
        setExtractedData(extracted);
        setApiResponse(extracted);
        setApiSource('AI Label Scanning');
        setImageType('label'); // Set image type to label
      } catch (error: any) {
        console.error('Error extracting nutrition data:', error.message);
        setApiResponse({error: error.message});
        setApiSource('AI Label Scanning');
        setErrorMessage('Failed to extract nutrition data from the image. Please try again or enter manually.');
        setImageType('label'); // Still a label
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBarcodeCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setApiResponse(null);
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
        // Dummy barcode number
        const extracted = await extractNutritionData({barcode: '0078742040669'});
        setExtractedData(extracted);
        setApiResponse(extracted);
        setApiSource('AI Barcode Scanning');
        setImageType('barcode'); // set to barcode
      } catch (error: any) {
        console.error('Error extracting nutrition data from barcode:', error.message);
        setApiResponse({error: error.message});
        setApiSource('AI Barcode Scanning');
        setErrorMessage('Failed to extract nutrition data from the barcode. Please try again or enter manually.');
        setImageType('barcode'); // Still a barcode
      }
    };
    reader.readAsDataURL(file);
  };

  const processBarcode = async (barcodeValue: string) => {
    setBarcode(barcodeValue);
    try {
      const extracted = await extractNutritionData({barcode: barcodeValue});
      setExtractedData(extracted);
      setApiResponse(extracted);
      setApiSource('Open Food Facts API');
      setImageType('barcode');
    } catch (error: any) {
      console.error('Error extracting nutrition data from barcode:', error.message);
      setApiResponse({error: error.message});
      setApiSource('Open Food Facts API');
      setErrorMessage('Barcode not found in Open Food Facts database.');
      setImageType('barcode');
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

  return (
    <main className="flex min-h-screen flex-col items-center p-12">
      <h1 className="text-4xl font-bold mb-8">NutriTrack</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Daily Targets</h2>
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Calories</CardTitle>
              <CardDescription>Set your daily calorie goal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Label htmlFor="calories">Target: {caloriesTarget} kcal</Label>
                <Slider
                  id="calories"
                  defaultValue={[caloriesTarget]}
                  max={3000}
                  step={100}
                  onValueChange={(value) => setCaloriesTarget(value[0])}
                />
              </div>
              <Progress value={calculateProgress(caloriesIntake, caloriesTarget)} />
              <p>Intake: {caloriesIntake} kcal</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Protein</CardTitle>
              <CardDescription>Set your daily protein goal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Label htmlFor="protein">Target: {proteinTarget} g</Label>
                <Slider
                  id="protein"
                  defaultValue={[proteinTarget]}
                  max={200}
                  step={5}
                  onValueChange={(value) => setProteinTarget(value[0])}
                />
              </div>
              <Progress value={calculateProgress(proteinIntake, proteinTarget)} />
              <p>Intake: {proteinIntake} g</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fat</CardTitle>
              <CardDescription>Set your daily fat goal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Label htmlFor="fat">Target: {fatTarget} g</Label>
                <Slider
                  id="fat"
                  defaultValue={[fatTarget]}
                  max={150}
                  step={5}
                  onValueChange={(value) => setFatTarget(value[0])}
                />
              </div>
              <Progress value={calculateProgress(fatIntake, fatTarget)} />
              <p>Intake: {fatIntake} g</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Carbs</CardTitle>
              <CardDescription>Set your daily carbs goal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Label htmlFor="carbs">Target: {carbsTarget} g</Label>
                <Slider
                  id="carbs"
                  defaultValue={[carbsTarget]}
                  max={400}
                  step={10}
                  onValueChange={(value) => setCarbsTarget(value[0])}
                />
              </div>
              <Progress value={calculateProgress(carbsIntake, carbsTarget)} />
              <p>Intake: {carbsIntake} g</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sugar</CardTitle>
              <CardDescription>Set your daily sugar goal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Label htmlFor="sugar">Target: {sugarTarget} g</Label>
                <Slider
                  id="sugar"
                  defaultValue={[sugarTarget]}
                  max={100}
                  step={5}
                  onValueChange={(value) => setSugarTarget(value[0])}
                />
              </div>
              <Progress value={calculateProgress(sugarIntake, sugarTarget)} />
              <p>Intake: {sugarIntake} g</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Track Your Intake</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Food Manually</CardTitle>
              <CardDescription>Enter food details to track your intake</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="food-name">Food Name</Label>
                  <Input
                    type="text"
                    id="food-name"
                    value={foodName}
                    onChange={(e) => setFoodName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="nutrition-info">Nutrition Information</Label>
                  <Textarea
                    id="nutrition-info"
                    value={nutritionInfo}
                    onChange={(e) => setNutritionInfo(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="serving-size">Serving Size</Label>
                  <Input
                    type="number"
                    id="serving-size"
                    value={servingSize}
                    onChange={(e) => setServingSize(Number(e.target.value))}
                  />
                </div>
                <Button onClick={trackIntake}>Add to Daily Intake</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Capture Food Label</CardTitle>
              <CardDescription>Upload an image of a food label to automatically extract nutrition information</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  onChange={handleImageCapture}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scan Barcode</CardTitle>
              <CardDescription>Upload an image of a barcode to automatically extract nutrition information</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                  type="file"
                  id="barcode-upload"
                  accept="image/*"
                  onChange={handleBarcodeCapture}
              />
              { !(hasCameraPermission) && (
                  <Alert variant="destructive">
                            <AlertTitle>Camera Access Required</AlertTitle>
                            <AlertDescription>
                              Please allow camera access to use this feature.
                            </AlertDescription>
                    </Alert>
              )
              }
              <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted />
               <div>
                 <Label htmlFor="barcode">Enter Barcode:</Label>
                 <Input
                     type="text"
                     id="barcode"
                     placeholder="Enter barcode number"
                     value={barcode}
                     onChange={(e) => setBarcode(e.target.value)}
                     onBlur={() => processBarcode(barcode)}
                 />
               </div>
            </CardContent>
          </Card>

          {extractedData && (
            <Card>
              <CardHeader>
                <CardTitle>Extracted Nutrition Data</CardTitle>
                <CardDescription>
                  Nutrition information extracted from the image or barcode.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {extractedData ? (
                  <div className="grid gap-2">
                    <p>Calories: {extractedData.calories} kcal</p>
                    <p>Protein: {extractedData.protein} g</p>
                    <p>Fat: {extractedData.fat} g</p>
                    <p>Carbohydrates: {extractedData.carbohydrates} g</p>
                    <p>Sugar: {extractedData.sugar} g</p>
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
        {imageType && <p>Image Type: {imageType}</p>}
        {barcode && <p>Barcode Number: {barcode}</p>}
        {apiResponse && (
          <div>
            <p>API Response ({apiSource}):</p>
            <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
          </div>
        )}
        {errorMessage && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
      </section>
    </main>
  );
}


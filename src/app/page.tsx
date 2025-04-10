'use client';

import Image from 'next/image';
import {useState, useEffect} from 'react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Slider} from '@/components/ui/slider';
import {Textarea} from '@/components/ui/textarea';
import {Progress} from '@/components/ui/progress';
import {extractNutritionData, ExtractNutritionDataOutput} from '@/ai/flows/extract-nutrition-data';

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

  const handleImageCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const imageUrl = reader.result as string;
        setCapturedImage(imageUrl);

        // Call the AI function to extract nutrition data
        const result = await extractNutritionData({photoUrl: imageUrl});
        setExtractedData(result);
      };
      reader.readAsDataURL(file);
    }
  };

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

  const caloriesProgress = calculateProgress(caloriesIntake, caloriesTarget);
  const proteinProgress = calculateProgress(proteinIntake, proteinTarget);
  const fatProgress = calculateProgress(fatIntake, fatTarget);
  const carbsProgress = calculateProgress(carbsIntake, carbsTarget);
  const sugarProgress = calculateProgress(sugarIntake, sugarTarget);

  useEffect(() => {
    if (extractedData) {
      // Update intake values based on extracted data
      setCaloriesIntake(caloriesIntake + (extractedData.calories || 0) * servingSize);
      setProteinIntake(proteinIntake + (extractedData.protein || 0) * servingSize);
      setFatIntake(fatIntake + (extractedData.fat || 0) * servingSize);
      setCarbsIntake(carbsIntake + (extractedData.carbohydrates || 0) * servingSize);
      setSugarIntake(sugarIntake + (extractedData.sugar || 0) * servingSize);
    }
  }, [extractedData, servingSize]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">NutriSnap</h1>

      {/* Target Setting */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Set Daily Targets</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Calories</CardTitle>
              <CardDescription>Set your daily calorie target.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="calories">{caloriesTarget} kcal</Label>
                <Slider
                  id="calories"
                  defaultValue={[caloriesTarget]}
                  max={3000}
                  step={10}
                  onValueChange={(value) => setCaloriesTarget(value[0])}
                />
              </div>
              <div className="mt-4">
                <Progress value={caloriesProgress} />
                <p className="text-sm mt-1">
                  {caloriesIntake} / {caloriesTarget} kcal ({caloriesProgress.toFixed(1)}%)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Protein</CardTitle>
              <CardDescription>Set your daily protein target.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="protein">{proteinTarget} g</Label>
                <Slider
                  id="protein"
                  defaultValue={[proteinTarget]}
                  max={200}
                  step={1}
                  onValueChange={(value) => setProteinTarget(value[0])}
                />
              </div>
              <div className="mt-4">
                <Progress value={proteinProgress} />
                <p className="text-sm mt-1">
                  {proteinIntake} / {proteinTarget} g ({proteinProgress.toFixed(1)}%)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fat</CardTitle>
              <CardDescription>Set your daily fat target.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="fat">{fatTarget} g</Label>
                <Slider
                  id="fat"
                  defaultValue={[fatTarget]}
                  max={150}
                  step={1}
                  onValueChange={(value) => setFatTarget(value[0])}
                />
              </div>
              <div className="mt-4">
                <Progress value={fatProgress} />
                <p className="text-sm mt-1">{fatIntake} / {fatTarget} g ({fatProgress.toFixed(1)}%)</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Carbs</CardTitle>
              <CardDescription>Set your daily carbs target.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="carbs">{carbsTarget} g</Label>
                <Slider
                  id="carbs"
                  defaultValue={[carbsTarget]}
                  max={400}
                  step={1}
                  onValueChange={(value) => setCarbsTarget(value[0])}
                />
              </div>
              <div className="mt-4">
                <Progress value={carbsProgress} />
                <p className="text-sm mt-1">{carbsIntake} / {carbsTarget} g ({carbsProgress.toFixed(1)}%)</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sugar</CardTitle>
              <CardDescription>Set your daily sugar target.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="sugar">{sugarTarget} g</Label>
                <Slider
                  id="sugar"
                  defaultValue={[sugarTarget]}
                  max={100}
                  step={1}
                  onValueChange={(value) => setSugarTarget(value[0])}
                />
              </div>
              <div className="mt-4">
                <Progress value={sugarProgress} />
                <p className="text-sm mt-1">{sugarIntake} / {sugarTarget} g ({sugarProgress.toFixed(1)}%)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Label Capture */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Capture Food Label</h2>
        <Input type="file" accept="image/*" onChange={handleImageCapture} />
        {capturedImage && (
          <div className="mt-4">
            <Image src={capturedImage} alt="Captured Food Label" width={300} height={300} />
          </div>
        )}
      </section>

      {/* AI Label Scanning - Display Extracted Data */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">AI Label Scanning</h2>
        {extractedData ? (
          <div>
            <p>Calories: {extractedData.calories || 'N/A'}</p>
            <p>Protein: {extractedData.protein || 'N/A'} g</p>
            <p>Fat: {extractedData.fat || 'N/A'} g</p>
            <p>Carbohydrates: {extractedData.carbohydrates || 'N/A'} g</p>
            <p>Sugar: {extractedData.sugar || 'N/A'} g</p>
          </div>
        ) : (
          <p>No data extracted yet. Please upload a food label image.</p>
        )}
      </section>

      {/* Manual Entry & Storage */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Manual Entry &amp; Storage</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="foodName">Food Name</Label>
            <Input
              type="text"
              id="foodName"
              placeholder="Enter food name"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="nutritionInfo">Nutrition Information</Label>
            <Textarea
              id="nutritionInfo"
              placeholder="Enter nutrition information"
              value={nutritionInfo}
              onChange={(e) => setNutritionInfo(e.target.value)}
            />
          </div>
        </div>
        <Button className="mt-4">Store Food Item</Button>
      </section>

      {/* Serving Size Tracking */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Serving Size Tracking</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="foodItem">Select Food Item</Label>
            <Input type="text" id="foodItem" placeholder="Select food item" />
          </div>
          <div>
            <Label htmlFor="servingSize">Serving Size</Label>
            <Input
              type="number"
              id="servingSize"
              placeholder="Enter serving size"
              value={servingSize}
              onChange={(e) => setServingSize(Number(e.target.value))}
            />
          </div>
        </div>
        <Button className="mt-4" onClick={trackIntake}>
          Track Intake
        </Button>
      </section>
    </div>
  );
}

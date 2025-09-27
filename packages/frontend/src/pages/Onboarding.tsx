import { useState } from "react";
import WelcomeStep from "@/components/onboarding/WelcomeStep";
import PriceStep from "@/components/onboarding/PriceStep";
import { AnimatePresence } from "framer-motion";
import LocationStep from "@/components/onboarding/LocationStep";
import RoomsStep from "@/components/onboarding/RoomsStep";
import AmenitiesStep from "@/components/onboarding/AmenitiesStep";

export type TravelMode = "DRIVING" | "WALKING" | "BICYCLING";
export type RuleType = "generic" | "specific";

export interface LocationRule {
  id: string;
  type: RuleType;
  target: string; // "Academia" ou "Avenida Paulista, 1578"
  maxTime: number; // Em minutos
  travelMode: TravelMode;
}

export interface UserPreferences {
  bedrooms: number;
  bathrooms: number;
  parkingSpots: number;
  amenities: string[];
  price: {
    rent: [number, number];
    condo: [number, number];
  };
  locations: LocationRule[];
}

const Onboarding = () => {
  const [step, setStep] = useState(0);

  const [preferences, setPreferences] = useState<UserPreferences>({
    bedrooms: 2,
    bathrooms: 1,
    parkingSpots: 1,
    amenities: [],
    price: {
      rent: [0, 1500],
      condo: [0, 250],
    },
    locations: [],
  });

  const updatePreferences = (newValues: Partial<UserPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...newValues }));
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const steps = [
    <WelcomeStep key="step0" onNext={nextStep} />,
    <RoomsStep
      key="step1"
      onNext={nextStep}
      onPrev={prevStep}
      preferences={preferences}
      updatePreferences={updatePreferences}
    />,
    <AmenitiesStep
      key="step2"
      onNext={nextStep}
      onPrev={prevStep}
      preferences={preferences}
      updatePreferences={updatePreferences}
    />,
    <PriceStep
      key="step3"
      onNext={nextStep}
      onPrev={prevStep}
      preferences={preferences}
      updatePreferences={updatePreferences}
    />,
    <LocationStep
      key="step4"
      onNext={nextStep}
      onPrev={prevStep}
      preferences={preferences}
      updatePreferences={updatePreferences}
    />,
  ];

  return (
    <div className="flex flex-col min-w-screen justify-center items-center min-h-screen">
      <div className="flex relative justify-center items-center w-xl h-[36rem]">
        <AnimatePresence mode="wait">{steps[step]}</AnimatePresence>
      </div>
    </div>
  );
};

export default Onboarding;

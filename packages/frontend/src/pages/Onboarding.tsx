import { useState } from "react";
import WelcomeStep from "@/components/onboarding/WelcomeStep";
import PriceStep from "@/components/onboarding/PriceStep";
import { AnimatePresence } from "framer-motion";
import LocationStep from "@/components/onboarding/LocationStep";
import RoomsStep from "@/components/onboarding/RoomsStep";
import AmenitiesStep from "@/components/onboarding/AmenitiesStep";
import PhoneStep from "@/components/onboarding/PhoneStep";

// Definindo tipos mais específicos para as regras
export type TravelMode = "DRIVING" | "WALKING" | "BICYCLING";
export type RuleType = "generic" | "specific";

export interface LocationRule {
  id: string;
  type: RuleType;
  target: string; // "Academia" ou "Avenida Paulista, 1578"
  maxTime: number; // Em minutos
  travelMode: TravelMode;
  departureTime?: string; // Horário no formato "HH:mm"
}

// Atualize a interface principal
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
  phoneNumber?: string;
}

const Onboarding = () => {
  const [step, setStep] = useState(0);

  const [preferences, setPreferences] = useState<UserPreferences>({
    bedrooms: 2, // Default to 2 bedrooms
    bathrooms: 1, // Default to 1 bathroom
    parkingSpots: 1, // Default to 1 parking spot
    amenities: [], // Começa vazio
    price: {
      rent: [0, 1500],
      condo: [0, 250],
    },

    locations: [],
    phoneNumber: "",
  });

  const updatePreferences = (newValues: Partial<UserPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...newValues }));
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  // O componente LocationStep agora vai receber as props atualizadas
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
    <PhoneStep
      key="step4"
      onNext={nextStep}
      onPrev={prevStep}
      preferences={preferences}
      updatePreferences={updatePreferences}
    />,
    <LocationStep
      key="step5"
      onPrev={prevStep}
      preferences={preferences}
      updatePreferences={updatePreferences}
    />,
  ];

  // O resto do componente permanece o mesmo...
  return (
    <div className="flex flex-col justify-center items-center p-4 min-h-screen">
      <div className="flex relative justify-center items-center w-full max-w-md h-[34rem]">
        <AnimatePresence mode="wait">{steps[step]}</AnimatePresence>
      </div>
    </div>
  );
};

export default Onboarding;

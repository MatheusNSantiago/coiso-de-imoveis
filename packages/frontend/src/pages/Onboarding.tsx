// packages/frontend/src/pages/Onboarding.tsx
import { useState } from "react";
import WelcomeStep from "@/components/onboarding/WelcomeStep";
import PriceStep from "@/components/onboarding/PriceStep";
import { AnimatePresence } from "framer-motion";
import LocationStep from "@/components/onboarding/LocationStep";

// Definindo tipos para os locais
export type TravelMode = "DRIVING" | "WALKING" | "BICYCLING";

export interface LocationPreference {
  id: string; // Para identificar unicamente cada local
  name: string; // "Trabalho", "Academia", etc.
  address: string;
  maxTime: number; // Em minutos
  travelMode: TravelMode;
}

// Atualize a interface principal
export interface UserPreferences {
  price: {
    rent: [number, number];
    condo: [number, number];
  };
  locations: LocationPreference[]; // Adicione o array de locais
}

const Onboarding = () => {
  const [step, setStep] = useState(0);

  const [preferences, setPreferences] = useState<UserPreferences>({
    price: {
      rent: [500, 5000],
      condo: [0, 1500],
    },
    locations: [], // Começa vazio
  });

  const updatePreferences = (newValues: Partial<UserPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...newValues }));
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  // Adicionamos o novo passo ao array
  const steps = [
    <WelcomeStep key="step0" onNext={nextStep} />,
    <PriceStep
      key="step1"
      onNext={nextStep}
      onPrev={prevStep}
      preferences={preferences}
      updatePreferences={updatePreferences}
    />,
    <LocationStep
      key="step2"
      onNext={nextStep}
      onPrev={prevStep}
      preferences={preferences}
      updatePreferences={updatePreferences}
    />,
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="relative w-full max-w-md h-96 flex items-center justify-center">
        <AnimatePresence mode="wait">{steps[step]}</AnimatePresence>
      </div>
    </div>
  );
};

export default Onboarding;

// packages/frontend/src/pages/Onboarding.tsx
import { useState } from "react";
import WelcomeStep from "@/components/onboarding/WelcomeStep";
import PriceStep from "@/components/onboarding/PriceStep";
import { AnimatePresence } from "framer-motion";
import LocationStep from "@/components/onboarding/LocationStep";

// Definindo tipos mais específicos para as regras
export type TravelMode = "DRIVING" | "WALKING" | "BICYCLING";
export type RuleType = "generic" | "specific";

export interface LocationRule {
  id: string;
  type: RuleType;
  target: string; // "Academia" ou "Avenida Paulista, 1578"
  maxTime: number; // Em minutos
  travelMode: TravelMode;
}

// Atualize a interface principal
export interface UserPreferences {
  price: {
    rent: [number, number];
    condo: [number, number];
  };
  locations: LocationRule[]; // Usando o novo tipo LocationRule
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

  // O componente LocationStep agora vai receber as props atualizadas
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
      onNext={nextStep} // Este será o último passo
      onPrev={prevStep}
      preferences={preferences}
      updatePreferences={updatePreferences}
    />,
  ];

  // O resto do componente permanece o mesmo...
  return (
    <div className="flex flex-col justify-center items-center p-4 min-h-screen">
      <div className="flex relative justify-center items-center w-full max-w-md h-[26rem]">
        <AnimatePresence mode="wait">{steps[step]}</AnimatePresence>
      </div>
    </div>
  );
};

export default Onboarding;

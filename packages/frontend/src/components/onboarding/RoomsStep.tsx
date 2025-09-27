import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { type UserPreferences } from "@/pages/Onboarding";
import { cn } from "@/lib/utils";

// --- Subcomponente reutilizável para o seletor com seu estilo customizado ---
interface IdealValueToggleProps {
  label: string;
  options: string[];
  currentValue: string;
  onValueChange: (value: string) => void;
}

const IdealValueToggle = ({
  label,
  options,
  currentValue,
  onValueChange,
}: IdealValueToggleProps) => (
  <div className="space-y-3">
    <Label>{label}</Label>
    <ToggleGroup
      type="single"
      value={currentValue}
      onValueChange={onValueChange}
      className={`flex flex-row w-full`} // Adicionado gap para espaçamento
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={`${label}-${option}`}
          value={option}
          aria-label={`${option} ${label}`}
          className="bg-accent p-0 m-0" // Estilo base
        >
          {currentValue === option ? (
            <div
              className={cn(
                // "w-full h-full flex justify-center items-center bg-white text-foreground font-semibold rounded-[7px]", // Ajustado o rounding
                // "shadow-[0_1.5px_3px_0.5px_rgba(0,0,0,0.6)]",
                "p-7 rounded-3xl py-0.5 flex justify-center items-center bg-white",
                "shadow-[0_1.5px_3px_0.5px_rgba(0,0,0,0.6)]",
              )}
            >
              {option}
            </div>
          ) : (
            <div className="text-muted-foreground">{option}</div>
          )}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  </div>
);

// --- Componente principal ---
interface RoomsStepProps {
  onNext: () => void;
  onPrev: () => void;
  preferences: UserPreferences;
  updatePreferences: (newValues: Partial<UserPreferences>) => void;
}

const roomOptions = ["1", "2", "3", "4", "5+"];
const parkingOptions = ["0", "1", "2", "3", "4+"];

const RoomsStep = ({
  onNext,
  onPrev,
  preferences,
  updatePreferences,
}: RoomsStepProps) => {
  const handleBedroomsChange = (value: string) => {
    if (value) {
      const bedrooms = value === "5+" ? 5 : parseInt(value, 10);
      updatePreferences({ bedrooms });
    }
  };

  const handleBathroomsChange = (value: string) => {
    if (value) {
      const bathrooms = value === "5+" ? 5 : parseInt(value, 10);
      updatePreferences({ bathrooms });
    }
  };

  const handleParkingSpotsChange = (value: string) => {
    if (value) {
      const parkingSpots = value === "4+" ? 4 : parseInt(value, 10);
      updatePreferences({ parkingSpots });
    }
  };

  // Funções helper para converter valores numéricos para as strings do UI
  const getRoomToggleValue = (num: number) =>
    num >= 5 ? "5+" : num.toString();
  const getParkingToggleValue = (num: number) =>
    num >= 4 ? "4+" : num.toString();

  return (
    <motion.div
      key="rooms-step"
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -300 }}
      transition={{ duration: 0.3 }}
      // className="absolute size-full"
      className="size-full flex items-center"
    >
      <Card className="w-full ">
        <CardHeader>
          <div className="items-center flex gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onPrev}
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle className="text-2xl">Seu Imóvel Ideal</CardTitle>
              <CardDescription>
                Qual a configuração ideal para você?
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <IdealValueToggle
            label="Quartos"
            options={roomOptions}
            currentValue={getRoomToggleValue(preferences.bedrooms)}
            onValueChange={handleBedroomsChange}
          />
          <IdealValueToggle
            label="Banheiros"
            options={roomOptions}
            currentValue={getRoomToggleValue(preferences.bathrooms)}
            onValueChange={handleBathroomsChange}
          />
          <IdealValueToggle
            label="Vagas de Garagem"
            options={parkingOptions}
            currentValue={getParkingToggleValue(preferences.parkingSpots)}
            onValueChange={handleParkingSpotsChange}
          />
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={onNext}>
            Próximo
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default RoomsStep;

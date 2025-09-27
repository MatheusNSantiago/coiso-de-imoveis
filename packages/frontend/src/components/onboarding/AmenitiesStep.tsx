// src/components/onboarding/AmenitiesStep.tsx
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
import {
  ArrowLeft,
  Sofa,
  Dog,
  AirVent,
  DoorOpen,
  Waves,
  UtensilsCrossed, // Ícone novo para Churrasqueira
  Dumbbell,
  PartyPopper,
  ArrowUpDown,
  ShieldCheck,
  Check, // Ícone para o estado selecionado
} from "lucide-react";
import { type UserPreferences } from "@/pages/Onboarding";
import { cn } from "@/lib/utils";

interface AmenitiesStepProps {
  onNext: () => void;
  onPrev: () => void;
  preferences: UserPreferences;
  updatePreferences: (newValues: Partial<UserPreferences>) => void;
}

const propertyAmenities = [
  { id: "furnished", label: "Mobiliado", icon: Sofa },
  { id: "balcony", label: "Varanda", icon: DoorOpen },
  { id: "pets_allowed", label: "Aceita pets", icon: Dog },
  { id: "air_conditioning", label: "Ar-condicionado", icon: AirVent },
];

const buildingAmenities = [
  { id: "pool", label: "Piscina", icon: Waves },
  { id: "barbecue", label: "Churrasqueira", icon: UtensilsCrossed }, // Ícone atualizado
  { id: "gym", label: "Academia", icon: Dumbbell },
  { id: "party_room", label: "Salão de Festas", icon: PartyPopper },
  { id: "elevator", label: "Elevador", icon: ArrowUpDown },
  { id: "doorman_24h", label: "Portaria 24h", icon: ShieldCheck },
];

const AmenitiesStep = ({
  onNext,
  onPrev,
  preferences,
  updatePreferences,
}: AmenitiesStepProps) => {
  const handleAmenitiesChange = (newSelection: string[]) => {
    updatePreferences({ amenities: newSelection });
  };

  return (
    <motion.div
      key="amenities-step"
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -300 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onPrev}
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle className="text-2xl">Comodidades</CardTitle>
              <CardDescription>
                O que não pode faltar no seu novo lar?
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="font-semibold">Diferenciais do Imóvel</Label>
            <ToggleGroup
              type="multiple"
              variant="outline"
              value={preferences.amenities}
              onValueChange={handleAmenitiesChange}
              className="grid grid-cols-3 grid-flow-dense gap-2 mt-2 grid-rows-2"
            >
              {propertyAmenities.map(({ id, label, icon: Icon }) => (
                <ToggleGroupItem
                  key={id}
                  value={id}
                  aria-label={label}
                  className={cn(
                    "rounded-full w-max last:rounded-full first:rounded-full",
                    "group m-0 p-0",
                  )}
                >
                  <div className="flex items-center gap-2 size-full rounded-full pr-3">
                    <div className="hidden ml-1 mr-2 rounded-full group-data-[state=on]:bg-primary group-data-[state=on]:text-primary-foreground group-data-[state=on]:inline-block">
                      <Check className="h-4 w-4 m-1" />
                    </div>
                    <Icon className="h-4 w-4 ml-3 mr-2 group-data-[state=on]:hidden" />
                    {label}
                  </div>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <div>
            <Label className="font-semibold">Comodidades do Condomínio</Label>
            <ToggleGroup
              type="multiple"
              variant="outline"
              value={preferences.amenities}
              onValueChange={handleAmenitiesChange}
              className="grid auto-cols-max auto-rows-max grid-flow-col gap-2 mt-2 grid-rows-2"
            >
              {buildingAmenities.map(({ id, label, icon: Icon }) => (
                <ToggleGroupItem
                  key={id}
                  value={id}
                  aria-label={label}
                  className={cn(
                    "rounded-full w-max last:rounded-full first:rounded-full",
                    "group m-0 p-0",
                  )}
                >
                  <div className="flex items-center gap-2 size-full rounded-full pr-3">
                    <div className="hidden ml-1 mr-2 rounded-full group-data-[state=on]:bg-primary group-data-[state=on]:text-primary-foreground group-data-[state=on]:inline-block">
                      <Check className="h-4 w-4 m-1" />
                    </div>
                    <Icon className="h-4 w-4 ml-3 mr-2 group-data-[state=on]:hidden" />
                    {label}
                  </div>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
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

export default AmenitiesStep;

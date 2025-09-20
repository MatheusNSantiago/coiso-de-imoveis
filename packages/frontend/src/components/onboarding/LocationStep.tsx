import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { UserPreferences, LocationPreference } from "@/pages/Onboarding";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  MapPin,
  Car,
  Bike,
  Footprints,
  Trash2,
} from "lucide-react";
import { AddLocationDialog } from "./AddLocationDialog";

interface LocationStepProps {
  onNext: () => void;
  onPrev: () => void;
  preferences: UserPreferences;
  updatePreferences: (newValues: Partial<UserPreferences>) => void;
}

const TravelModeIcon = ({
  mode,
}: {
  mode: LocationPreference["travelMode"];
}) => {
  if (mode === "DRIVING") return <Car className="h-4 w-4" />;
  if (mode === "BICYCLING") return <Bike className="h-4 w-4" />;
  if (mode === "WALKING") return <Footprints className="h-4 w-4" />;
  return null;
};

export const LocationStep = ({
  onNext,
  onPrev,
  preferences,
  updatePreferences,
}: LocationStepProps) => {
  const addLocation = (newLocation: Omit<LocationPreference, "id">) => {
    const locationWithId = { ...newLocation, id: crypto.randomUUID() };
    updatePreferences({
      locations: [...preferences.locations, locationWithId],
    });
  };

  const removeLocation = (id: string) => {
    updatePreferences({
      locations: preferences.locations.filter((loc) => loc.id !== id),
    });
  };

  return (
    <motion.div
      key="location-step"
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -300 }}
      transition={{ duration: 0.3 }}
      className="absolute"
    >
      <Card className="w-[350px] md:w-[450px]">
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
              <CardTitle className="text-2xl">Locais Importantes</CardTitle>
              <CardDescription>
                Adicione lugares do seu dia a dia para acharmos imóveis
                próximos.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 min-h-[150px]">
          {preferences.locations.length === 0 ? (
            <div className="text-center text-muted-foreground py-10">
              <MapPin className="mx-auto h-8 w-8 mb-2" />
              <p>Nenhum local adicionado ainda.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {preferences.locations.map((loc) => (
                <li
                  key={loc.id}
                  className="flex items-center justify-between text-sm p-2 bg-muted rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <TravelModeIcon mode={loc.travelMode} />
                    <div>
                      <p className="font-semibold">{loc.name}</p>
                      <p className="text-muted-foreground text-xs">{`Até ${loc.maxTime} min`}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLocation(loc.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <Separator />
          <AddLocationDialog onAddLocation={addLocation}>
            <Button variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Local
            </Button>
          </AddLocationDialog>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={onNext}
            disabled={preferences.locations.length === 0}
          >
            Concluir e ver imóveis
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default LocationStep;

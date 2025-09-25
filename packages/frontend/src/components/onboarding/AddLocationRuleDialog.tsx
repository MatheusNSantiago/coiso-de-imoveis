import { useState, useRef, useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Loader as GoogleApiLoader } from "@googlemaps/js-api-loader";
import { Car, Bike, Footprints, Building, MapPin, Loader2 } from "lucide-react";
import type { LocationRule, RuleType, TravelMode } from "@/pages/Onboarding";

interface AddLocationRuleDialogProps {
  children: ReactNode;
  onAddRule: (rule: Omit<LocationRule, "id">) => void;
}

// Hook do autocomplete, agora mais robusto
const useGooglePlacesAutocomplete = (
  inputRef: React.RefObject<HTMLInputElement | null>,
  isDialogOpen: boolean,
) => {
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const isApiLoading = useRef(false); // Ref para evitar recarregamentos múltiplos

  useEffect(() => {
    // Só carrega a API se o dialog estiver aberto e a API ainda não tiver sido carregada
    if (isDialogOpen && !isApiLoaded && !isApiLoading.current) {
      isApiLoading.current = true;

      const loader = new GoogleApiLoader({
        apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY!,
        version: "weekly",
        libraries: ["places"],
      });

      loader
        .importLibrary("places")
        .then((places) => {
          if (inputRef.current) {
            new places.Autocomplete(inputRef.current, {
              fields: ["formatted_address", "name"],
              types: ["address", "establishment"],
              componentRestrictions: { country: "br" },
            });
          }
          setIsApiLoaded(true);
        })
        .catch((e) => console.error("Falha ao carregar Google Maps API", e))
        .finally(() => {
          isApiLoading.current = false;
        });
    }
  }, [isDialogOpen, isApiLoaded, inputRef]);

  return { isApiLoaded, isApiLoading: isApiLoading.current && !isApiLoaded };
};

export const AddLocationRuleDialog = ({
  children,
  onAddRule,
}: AddLocationRuleDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [ruleType, setRuleType] = useState<RuleType>("generic");
  const [target, setTarget] = useState("");
  const [maxTime, setMaxTime] = useState(15);
  const [travelMode, setTravelMode] = useState<TravelMode>("DRIVING");
  const addressInputRef = useRef<HTMLInputElement>(null);

  const { isApiLoading } = useGooglePlacesAutocomplete(addressInputRef, isOpen);

  const handleSubmit = () => {
    const finalTarget =
      ruleType === "specific" ? addressInputRef.current?.value || "" : target;

    if (finalTarget && maxTime > 0) {
      onAddRule({ type: ruleType, target: finalTarget, maxTime, travelMode });
      // Resetar e fechar
      setIsOpen(false); // Primeiro fecha, depois reseta para evitar "flicker"
      setTimeout(() => {
        setRuleType("generic");
        setTarget("");
        if (addressInputRef.current) addressInputRef.current.value = "";
        setMaxTime(15);
        setTravelMode("DRIVING");
      }, 150); // Timeout para dar tempo da animação de fechar ocorrer
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Nova Regra</DialogTitle>
          <DialogDescription>
            Defina um local ou tipo de lugar e o tempo máximo de deslocamento.
          </DialogDescription>
        </DialogHeader>

        <div className="pt-4 space-y-6">
          <div>
            <Label className="font-semibold">
              O que você quer estar perto?
            </Label>
            <ToggleGroup
              type="single"
              value={ruleType}
              onValueChange={(value: RuleType) => value && setRuleType(value)}
              className="grid grid-cols-2 mt-2 w-full"
            >
              <ToggleGroupItem value="generic" aria-label="Tipo de Lugar">
                <Building className="mr-2 w-4 h-4" />
                Tipo de Lugar
              </ToggleGroupItem>
              <ToggleGroupItem
                value="specific"
                aria-label="Endereço Específico"
              >
                <MapPin className="mr-2 w-4 h-4" />
                Endereço
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {ruleType === "generic" && (
            <Input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="Ex: Academia, Supermercado, Parque"
            />
          )}
          {ruleType === "specific" && (
            <div className="relative">
              <Input
                ref={addressInputRef}
                placeholder="Digite o endereço..."
                disabled={isApiLoading} // Desabilita enquanto carrega
              />
              {isApiLoading && (
                <Loader2 className="absolute right-3 top-1/2 w-4 h-4 animate-spin -translate-y-1/2 text-muted-foreground" />
              )}
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="maxTime-slider" className="font-semibold">
                Tempo Máximo
              </Label>
              <span className="py-1 px-2 w-20 text-sm font-medium text-center rounded-md bg-muted text-muted-foreground">
                {maxTime} min
              </span>
            </div>
            <Slider
              id="maxTime-slider"
              min={5}
              max={60}
              step={5}
              value={[maxTime]}
              onValueChange={(value) => setMaxTime(value[0])}
            />
          </div>

          <div>
            <Label className="font-semibold">Como você vai se deslocar?</Label>
            <ToggleGroup
              type="single"
              value={travelMode}
              onValueChange={(value: TravelMode) =>
                value && setTravelMode(value)
              }
              className="grid grid-cols-3 mt-2 w-full"
            >
              <ToggleGroupItem value="DRIVING" aria-label="Carro">
                <Car className="mr-2 w-4 h-4" />
                Carro
              </ToggleGroupItem>
              <ToggleGroupItem value="BICYCLING" aria-label="Bicicleta">
                <Bike className="mr-2 w-4 h-4" />
                Bicicleta
              </ToggleGroupItem>
              <ToggleGroupItem value="WALKING" aria-label="A pé">
                <Footprints className="mr-2 w-4 h-4" />A pé
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        <DialogFooter className="pt-4">
          <Button onClick={() => setIsOpen(false)} variant="ghost">
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Adicionar Regra</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

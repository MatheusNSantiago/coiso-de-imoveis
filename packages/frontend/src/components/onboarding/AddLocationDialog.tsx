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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LocationPreference, TravelMode } from "@/pages/Onboarding";
import { Loader } from "lucide-react";
import { Loader as GoogleApiLoader } from "@googlemaps/js-api-loader";

interface AddLocationDialogProps {
  children: ReactNode;
  onAddLocation: (location: Omit<LocationPreference, "id">) => void;
}

// CORREÇÃO 4: A tipagem do inputRef agora aceita 'null'
const useGooglePlacesAutocomplete = (
  inputRef: React.RefObject<HTMLInputElement | null>,
) => {
  const [isApiLoaded, setIsApiLoaded] = useState(false);

  useEffect(() => {
    const initAutocomplete = async () => {
      // Garantimos que o input existe antes de prosseguir
      if (!inputRef.current) return;

      const loader = new GoogleApiLoader({
        // CORREÇÃO: O nome da variável de ambiente precisa ser VITE_...
        apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY!,
        version: "weekly",
        libraries: ["places"],
      });

      try {
        const google = await loader.importLibrary("maps");
        const places = await loader.importLibrary("places");
        setIsApiLoaded(true);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const autocomplete = new places.Autocomplete(inputRef.current, {
          fields: ["formatted_address"],
          types: ["address", "establishment"],
          componentRestrictions: { country: "br" },
        });
      } catch (e) {
        console.error("Falha ao carregar Google Maps API", e);
      }
    };

    initAutocomplete();
  }, [inputRef]);

  return isApiLoaded;
};

export const AddLocationDialog = ({
  children,
  onAddLocation,
}: AddLocationDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  // O estado 'address' não é mais necessário, pois pegamos o valor direto da ref
  const [maxTime, setMaxTime] = useState(15);
  const [travelMode, setTravelMode] = useState<TravelMode>("DRIVING");
  const addressInputRef = useRef<HTMLInputElement>(null);

  const isApiLoaded = useGooglePlacesAutocomplete(addressInputRef);

  const handleSubmit = () => {
    // Pegamos o valor final do input, que pode ter sido preenchido pelo Autocomplete
    const finalAddress = addressInputRef.current?.value;

    if (name && finalAddress && maxTime > 0) {
      onAddLocation({ name, address: finalAddress, maxTime, travelMode });
      // Resetar e fechar
      setName("");
      // Limpa o valor do input diretamente na ref
      if (addressInputRef.current) addressInputRef.current.value = "";
      setMaxTime(15);
      setTravelMode("DRIVING");
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Novo Local</DialogTitle>
          <DialogDescription>
            Ex: Trabalho, academia, escola, etc.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nome
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="Ex: Trabalho"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address" className="text-right">
              Endereço
            </Label>
            {!isApiLoaded && <Loader className="animate-spin col-span-3" />}
            <Input
              ref={addressInputRef}
              id="address"
              className="col-span-3"
              placeholder="Digite e selecione um endereço"
              style={{ display: isApiLoaded ? "block" : "none" }}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="maxTime" className="text-right">
              Tempo Máx.
            </Label>
            <Input
              id="maxTime"
              type="number"
              value={maxTime}
              onChange={(e) => setMaxTime(Number(e.target.value))}
              className="col-span-3"
              placeholder="em minutos"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Transporte</Label>
            <Select
              value={travelMode}
              onValueChange={(v: TravelMode) => setTravelMode(v)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRIVING">Carro</SelectItem>
                <SelectItem value="BICYCLING">Bicicleta</SelectItem>
                <SelectItem value="WALKING">A pé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>Adicionar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

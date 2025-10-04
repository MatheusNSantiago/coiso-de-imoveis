import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BedDouble,
  Bath,
  Car,
  Ruler,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Bike,
  Footprints,
  Clock,
  MessageSquare, // Ícone para WhatsApp
  Loader2, // Ícone de carregamento
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ImovelCardProps {
  imovel: any;
  onSendToWhatsApp: (imovel: any) => void; // Nova propriedade
  isSendingWhatsApp: boolean; // Nova propriedade para estado de loading
}

const formatRent = (value: number | null) => {
  if (value === null) return "N/A";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(value);
};

const TravelModeIcon = ({ mode }: { mode: string }) => {
  if (mode === "DRIVING")
    return <Car className="h-4 w-4 text-muted-foreground" />;
  if (mode === "BICYCLING")
    return <Bike className="h-4 w-4 text-muted-foreground" />;
  if (mode === "WALKING")
    return <Footprints className="h-4 w-4 text-muted-foreground" />;
  return <MapPin className="h-4 w-4 text-muted-foreground" />;
};

export const ImovelCard = ({
  imovel,
  onSendToWhatsApp,
  isSendingWhatsApp,
}: ImovelCardProps) => {
  const images = (imovel.imagens as string[]) || [];
  const [currentImage, setCurrentImage] = useState(0);

  const nextImage = () =>
    setCurrentImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  const prevImage = () =>
    setCurrentImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));

  return (
    <Card className="flex flex-col overflow-hidden">
      {images.length > 0 && (
        <div className="relative aspect-video overflow-hidden group">
          <img
            src={images[currentImage]}
            alt={`Foto de ${imovel.endereco}`}
            className="object-cover w-full h-full transition-transform duration-300"
          />
          {images.length > 1 && (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <Button
                size="icon"
                variant="secondary"
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={prevImage}
              >
                <ChevronLeft />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={nextImage}
              >
                <ChevronRight />
              </Button>
              <div className="absolute bottom-2 right-2 text-xs bg-black/60 text-white px-2 py-1 rounded-md">
                {currentImage + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      )}

      <CardHeader>
        <CardTitle className="truncate text-lg">{imovel.endereco}</CardTitle>
        <CardDescription>
          {imovel.bairro}, {imovel.cidade}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BedDouble className="h-4 w-4" />
            <span>{imovel.quartos ?? "?"} quartos</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Bath className="h-4 w-4" />
            <span>{imovel.suites ?? "?"} suítes</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Car className="h-4 w-4" />
            <span>{imovel.vagas_garagem ?? "?"} vagas</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Ruler className="h-4 w-4" />
            <span>{imovel.area_privativa ?? "?"} m²</span>
          </div>
        </div>
        {imovel.matchedRules && imovel.matchedRules.length > 0 && (
          <div className="space-y-2">
            <Separator />
            <h4 className="font-semibold text-foreground pt-2">
              Análise de Proximidade
            </h4>
            {imovel.matchedRules.map((result: any) => (
              <div
                key={result.rule.id}
                className="flex justify-between items-center text-muted-foreground"
              >
                <div className="flex items-center gap-2">
                  <TravelModeIcon mode={result.rule.travelMode} />
                  <span className="truncate">{result.rule.target}</span>
                </div>
                <div className="flex items-center gap-1 font-medium text-foreground">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span>{result.actualDuration} min</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center bg-muted/50 p-4 mt-auto">
        <div className="text-xl font-bold text-primary">
          {formatRent(imovel.valor_aluguel)}
          <span className="text-sm font-normal text-muted-foreground">
            /mês
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onSendToWhatsApp(imovel)}
            disabled={isSendingWhatsApp}
            aria-label="Enviar para WhatsApp"
          >
            {isSendingWhatsApp ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
          <Button asChild variant="secondary">
            <a href={imovel.url} target="_blank" rel="noopener noreferrer">
              Ver anúncio
            </a>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

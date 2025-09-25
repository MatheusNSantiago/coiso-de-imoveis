import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Imovel } from "../../../backend/src/types";
import { BedDouble, Bath, Car, Ruler } from "lucide-react";

interface ImovelCardProps {
  imovel: Imovel;
}

// Função para formatar o valor do aluguel
const formatRent = (value: number | null) => {
  if (value === null) return "N/A";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(value);
};

export const ImovelCard = ({ imovel }: ImovelCardProps) => {
  const firstImage = (imovel.imagens as string[])?.[0];

  return (
    <Card className="flex flex-col overflow-hidden">
      {firstImage && (
        <div className="aspect-video overflow-hidden">
          <img
            src={firstImage}
            alt={`Foto de ${imovel.endereco}`}
            className="object-cover w-full h-full"
          />
        </div>
      )}
      <CardHeader>
        <CardTitle className="truncate text-lg">{imovel.endereco}</CardTitle>
        <CardDescription>
          {imovel.bairro}, {imovel.cidade}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow grid grid-cols-2 gap-4 text-sm">
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
      </CardContent>
      <CardFooter className="flex justify-between items-center bg-muted/50 p-4 mt-auto">
        <div className="text-xl font-bold text-primary">
          {formatRent(imovel.valor_aluguel)}
          <span className="text-sm font-normal text-muted-foreground">
            /mês
          </span>
        </div>
        <Button asChild variant="secondary">
          <a href={imovel.url} target="_blank" rel="noopener noreferrer">
            Ver anúncio
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
};

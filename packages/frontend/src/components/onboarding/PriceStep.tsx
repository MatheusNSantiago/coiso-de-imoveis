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
import { Slider } from "@/components/ui/slider";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { type UserPreferences } from "@/pages/Onboarding";

interface PriceStepProps {
  onNext: () => void;
  onPrev: () => void;
  preferences: UserPreferences;
  updatePreferences: (newValues: Partial<UserPreferences>) => void;
}

// Função para formatar números como moeda brasileira
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(value);
};

const PriceStep = ({
  onNext,
  onPrev,
  preferences,
  updatePreferences,
}: PriceStepProps) => {
  const handleRentChange = (value: [number, number]) => {
    updatePreferences({ price: { ...preferences.price, rent: value } });
  };

  const handleCondoChange = (value: [number, number]) => {
    updatePreferences({ price: { ...preferences.price, condo: value } });
  };

  return (
    <motion.div
      key="price-step"
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
              <CardTitle className="text-2xl">Faixa de Preço</CardTitle>
              <CardDescription>
                Defina os valores mensais que cabem no seu bolso.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <Label htmlFor="rent-slider">Valor do Aluguel</Label>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{formatCurrency(preferences.price.rent[0])}</span>
              <span>{formatCurrency(preferences.price.rent[1])}</span>
            </div>
            <Slider
              id="rent-slider"
              min={0}
              max={5000}
              step={50}
              value={preferences.price.rent}
              onValueChange={handleRentChange}
            />
          </div>
          <div className="space-y-4">
            <Label htmlFor="condo-slider">Valor do Condomínio</Label>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{formatCurrency(preferences.price.condo[0])}</span>
              <span>{formatCurrency(preferences.price.condo[1])}</span>
            </div>
            <Slider
              id="condo-slider"
              min={0}
              max={5000}
              step={50}
              value={preferences.price.condo}
              onValueChange={handleCondoChange}
            />
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

export default PriceStep;

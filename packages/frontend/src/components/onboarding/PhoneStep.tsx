import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { ArrowLeft, Phone } from "lucide-react";
import type { UserPreferences } from "@/pages/Onboarding";

interface PhoneStepProps {
  onNext: () => void;
  onPrev: () => void;
  preferences: UserPreferences;
  updatePreferences: (newValues: Partial<UserPreferences>) => void;
}

// Função para formatar o número de telefone
const formatPhoneNumber = (value: string): string => {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");

  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

const PhoneStep = ({
  onNext,
  onPrev,
  preferences,
  updatePreferences,
}: PhoneStepProps) => {
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    // Armazena o número completo com DDI, mas sem formatação
    updatePreferences({ phoneNumber: `55${rawValue}` });
  };

  // Extrai apenas os dígitos após o "55" para exibição e formatação
  const displayValue = preferences.phoneNumber?.startsWith("55")
    ? preferences.phoneNumber.substring(2)
    : preferences.phoneNumber || "";

  const isPhoneValid = displayValue.length === 10 || displayValue.length === 11;

  return (
    <motion.div
      key="phone-step"
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
              <CardTitle className="text-2xl">Seu WhatsApp</CardTitle>
              <CardDescription>
                Digite seu DDD e número para receber os alertas de imóveis.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Label htmlFor="phone">Número de Telefone</Label>
          <div className="relative flex items-center">
            <div className="absolute left-3 flex items-center pointer-events-none">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">+55</span>
            </div>
            <Input
              id="phone"
              type="tel"
              placeholder="(DD) XXXXX-XXXX"
              value={formatPhoneNumber(displayValue)}
              onChange={handlePhoneChange}
              className="pl-[70px]" // Aumenta o padding para acomodar o prefixo
              maxLength={15} // Limita o tamanho do input formatado (e.g., "(11) 98888-7777")
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={onNext} disabled={!isPhoneValid}>
            Próximo
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default PhoneStep;

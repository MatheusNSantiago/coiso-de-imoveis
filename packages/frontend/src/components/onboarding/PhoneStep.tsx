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

const PhoneStep = ({
  onNext,
  onPrev,
  preferences,
  updatePreferences,
}: PhoneStepProps) => {
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Simples máscara para DDI + DDD + Número
    const value = e.target.value.replace(/\D/g, "");
    updatePreferences({ phoneNumber: value });
  };

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
                Digite seu número para receber os alertas. Usaremos o formato
                internacional.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Label htmlFor="phone">Número com DDI e DDD</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              placeholder="Ex: 5561999998888"
              value={preferences.phoneNumber || ""}
              onChange={handlePhoneChange}
              className="pl-9"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Exemplo: Brasil (55), Brasília (61) e o seu número.
          </p>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={onNext}
            disabled={
              !preferences.phoneNumber || preferences.phoneNumber.length < 12
            }
          >
            Próximo
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default PhoneStep;

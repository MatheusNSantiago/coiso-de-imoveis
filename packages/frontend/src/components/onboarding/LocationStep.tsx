// packages/frontend/src/components/onboarding/LocationStep.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { UserPreferences, LocationRule } from "@/pages/Onboarding";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  MapPin,
  Car,
  Bike,
  Footprints,
  Trash2,
  Clock,
  Loader2, // Importado
} from "lucide-react";
import { AddLocationRuleDialog } from "./AddLocationRuleDialog";
import axios from "axios"; // Importado
import { supabase } from "@/lib/supabaseClient"; // Importado

interface LocationStepProps {
  onPrev: () => void;
  preferences: UserPreferences;
  updatePreferences: (newValues: Partial<UserPreferences>) => void;
}

const TravelModeIcon = ({ mode }: { mode: LocationRule["travelMode"] }) => {
  if (mode === "DRIVING")
    return <Car className="w-4 h-4 text-muted-foreground" />;
  if (mode === "BICYCLING")
    return <Bike className="w-4 h-4 text-muted-foreground" />;
  if (mode === "WALKING")
    return <Footprints className="w-4 h-4 text-muted-foreground" />;
  return null;
};

const LocationStep = ({
  onPrev,
  preferences,
  updatePreferences,
}: LocationStepProps) => {
  // --- NOVOS ESTADOS ---
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // --------------------

  const addRule = (newRule: Omit<LocationRule, "id">) => {
    const ruleWithId = { ...newRule, id: crypto.randomUUID() };
    updatePreferences({
      locations: [...preferences.locations, ruleWithId],
    });
  };

  const removeRule = (id: string) => {
    updatePreferences({
      locations: preferences.locations.filter((loc) => loc.id !== id),
    });
  };

  const navigate = useNavigate();

  // --- LÓGICA ATUALIZADA ---
  const handleFinish = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Você não está autenticado.");

      await axios.post(
        `${import.meta.env.VITE_BACKEND_API_BASE_URL}/api/preferences`,
        preferences,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );

      // Apenas navega se a chamada for bem-sucedida
      const encodedPreferences = btoa(JSON.stringify(preferences));
      navigate(`/dashboard?preferences=${encodedPreferences}`);
    } catch (err: any) {
      console.error("Erro ao salvar preferências:", err);
      setError(
        err.response?.data?.error ||
          "Não foi possível salvar suas preferências. Tente novamente.",
      );
    } finally {
      setIsSaving(false);
    }
  };
  // --------------------------

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
          <div className="flex gap-4 items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={onPrev}
              className="flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <CardTitle className="text-2xl">
                Onde você quer estar perto?
              </CardTitle>
              <CardDescription>
                Adicione regras para encontrar seu imóvel ideal.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 min-h-[150px]">
          {preferences.locations.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <MapPin className="mx-auto mb-2 w-8 h-8" />
              <p>Nenhuma regra de localização adicionada.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {preferences.locations.map((rule) => (
                <li
                  key={rule.id}
                  className="flex justify-between items-center p-3 text-sm rounded-md border"
                >
                  <div className="flex flex-1 gap-3 items-start">
                    <TravelModeIcon mode={rule.travelMode} />
                    <div className="flex-1">
                      <p className="break-words">
                        {"Até "}
                        <span className="font-semibold">
                          {rule.maxTime} min
                        </span>
                        {rule.type === "generic" ? " de um(a) " : " de "}
                        <span className="font-semibold">{rule.target}</span>
                      </p>
                      {rule.departureTime && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          partindo às {rule.departureTime}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => removeRule(rule.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          {error && (
            <p className="text-sm text-center text-destructive mb-2">{error}</p>
          )}
          <AddLocationRuleDialog onAddRule={addRule}>
            <Button variant="outline" className="w-full">
              <Plus className="mr-2 w-4 h-4" />
              Adicionar Nova Regra
            </Button>
          </AddLocationRuleDialog>
          {/* --- BOTÃO ATUALIZADO --- */}
          <Button className="w-full" onClick={handleFinish} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Concluir e ver imóveis"
            )}
          </Button>
          {/* ----------------------- */}
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default LocationStep;

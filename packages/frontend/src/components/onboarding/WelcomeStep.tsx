import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { motion } from "framer-motion";
import { Home } from "lucide-react";

interface WelcomeStepProps {
  onNext: () => void;
}

const WelcomeStep = ({ onNext }: WelcomeStepProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-[350px] md:w-[450px] text-center">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-4 rounded-full mb-4">
            <Home className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Encontre o seu próximo lar</CardTitle>
          <CardDescription>
            Vamos te ajudar a encontrar o imóvel ideal baseado no seu estilo de vida.
            Responda algumas perguntas rápidas para começar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            O processo leva menos de 2 minutos.
          </p>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={onNext}>
            Vamos começar
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default WelcomeStep;

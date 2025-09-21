import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { type Imovel } from "@/../../backend/src/db/schema";
import { Loader2, ServerCrash } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const preferencesParam = searchParams.get("preferences");
    if (preferencesParam) {
      const decodedPreferences = atob(preferencesParam);
      fetch(
        `http://localhost:3000/api/imoveis?preferences=${encodeURIComponent(decodedPreferences)}`,
      )
        .then((res) => {
          if (!res.ok) {
            throw new Error("Falha na resposta da rede");
          }
          return res.json();
        })
        .then((data) => {
          if (data.success) {
            setImoveis(data.data);
          } else {
            throw new Error(data.error || "Erro ao buscar imóveis");
          }
        })
        .catch((err) => {
          console.error("Erro no fetch:", err);
          setError(err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">
          Buscando os melhores imóveis para você...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <ServerCrash className="w-12 h-12 text-destructive" />
        <p className="mt-4 text-destructive-foreground">
          Ocorreu um erro: {error}
        </p>
      </div>
    );
  }

  return (
    <div className="container py-8 mx-auto">
      <h1 className="mb-2 text-3xl font-bold">Imóveis Encontrados</h1>
      <p className="mb-8 text-muted-foreground">
        {imoveis.length > 0
          ? `${imoveis.length} imóveis correspondem às suas preferências.`
          : "Nenhum imóvel encontrado com seus critérios. Tente ampliar sua busca."}
      </p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {imoveis.map((imovel) => (
          <Card key={imovel.codigo_imovel} className="flex flex-col">
            <CardHeader>
              <CardTitle className="truncate">{imovel.endereco}</CardTitle>
              <CardDescription>
                {imovel.bairro}, {imovel.cidade}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p>
                <strong>Tipo:</strong> {imovel.tipo}
              </p>
              <p>
                <strong>Quartos:</strong> {imovel.quartos}
              </p>
            </CardContent>
            <CardFooter className="flex justify-between items-center p-4 bg-muted/50">
              <div className="text-lg font-bold text-primary">
                R$ {imovel.valor_aluguel}
                <span className="text-sm font-normal text-muted-foreground">
                  /mês
                </span>
              </div>
              <a
                href={imovel.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline text-primary"
              >
                Ver mais
              </a>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;

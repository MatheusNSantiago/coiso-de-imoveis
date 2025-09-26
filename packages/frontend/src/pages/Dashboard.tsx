import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ImovelCard } from "@/components/ImovelCard";
import { Button } from "@/components/ui/button";
import { Loader2, ServerCrash, Home } from "lucide-react";
import axios from "axios";

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const [imoveis, setImoveis] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const preferencesParam = searchParams.get("preferences");
    if (preferencesParam) {
      try {
        const decodedPreferences = atob(preferencesParam);
        const apiUrl = `${import.meta.env.VITE_BACKEND_API_BASE_URL}/api/imoveis`;

        axios
          .get(apiUrl, { params: { preferences: decodedPreferences } })
          .then((response) => {
            const data = response.data;
            if (data.success) {
              setImoveis(data.data);
            } else {
              throw new Error(
                data.error || "Ocorreu um erro desconhecido no backend.",
              );
            }
          })
          .catch((err) => {
            // axios.isAxiosError pode ser usado para verificar erros específicos do axios
            if (axios.isAxiosError(err) && err.response) {
              setError(
                err.response.data.message ||
                  err.response.data.error ||
                  `Erro na API: ${err.response.statusText}`,
              );
            } else {
              setError(err.message);
            }
          })
          .finally(() => setIsLoading(false));
      } catch (e: any) {
        setError("Preferências inválidas na URL.");
        setIsLoading(false);
      }
    } else {
      setError("Nenhuma preferência foi fornecida para a busca.");
      setIsLoading(false);
    }
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h2 className="text-xl font-semibold">
          Buscando os melhores imóveis...
        </h2>
        <p className="text-muted-foreground">
          Isso pode levar alguns segundos, estamos calculando as rotas!
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center">
        <ServerCrash className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-semibold text-destructive">
          Ocorreu um erro
        </h2>
        <p className="text-muted-foreground max-w-sm">{error}</p>
        <Button asChild>
          <Link to="/">Tentar Novamente</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Imóveis Encontrados
        </h1>
        <p className="text-muted-foreground">
          {imoveis.length > 0
            ? `${imoveis.length} imóveis que correspondem perfeitamente ao seu estilo de vida.`
            : "Nenhum imóvel corresponde aos seus critérios. Que tal refinar sua busca?"}
        </p>
      </div>

      {imoveis.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {imoveis.map((imovel) => (
            <ImovelCard key={imovel.id} imovel={imovel} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg py-24 gap-4 text-center">
          <Home className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Nenhum resultado</h2>
          <p className="text-muted-foreground max-w-sm">
            Não encontramos imóveis com os filtros que você selecionou.
          </p>
          <Button asChild>
            <Link to="/">Refazer a Busca</Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

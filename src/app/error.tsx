"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <AlertTriangle className="h-10 w-10 text-destructive" />
      <h1 className="text-2xl font-semibold">Algo deu errado</h1>
      <p className="max-w-md text-muted-foreground">
        Ocorreu um erro inesperado. Você pode tentar novamente ou voltar para o início.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => reset()}>
          Tentar novamente
        </Button>
        <Button nativeButton={false} render={<Link href="/">Voltar para o início</Link>} />
      </div>
    </div>
  );
}

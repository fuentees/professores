"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

const noopSubscribe = () => () => {};
/** true só depois da hidratação — via useSyncExternalStore (não setState em efeito) pra satisfazer a regra dos hooks. */
function useMounted(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/**
 * `useTheme()` só reflete o tema real depois da hidratação (antes disso,
 * `resolvedTheme` é undefined no servidor) — sem o guard `mounted`, o ícone
 * piscaria de um estado padrão pro estado real logo após montar.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={mounted && resolvedTheme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {mounted && resolvedTheme === "dark" ? <Sun /> : <Moon />}
    </Button>
  );
}

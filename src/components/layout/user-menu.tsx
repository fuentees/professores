"use client";

import Link from "next/link";
import { LayoutDashboard, LogOut, Settings, ShieldCheck } from "lucide-react";
import { logout } from "@/actions/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CurrentProfile } from "@/lib/auth/get-current-profile";

function getInitials(name: string) {
  const partes = name.trim().split(/\s+/);
  const iniciais = partes.slice(0, 2).map((parte) => parte[0]?.toUpperCase() ?? "");
  return iniciais.join("") || "?";
}

export function UserMenu({ profile }: { profile: CurrentProfile }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" className="gap-2 px-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {getInitials(profile.full_name || profile.email)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium sm:inline">
              {profile.full_name || profile.email}
            </span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="truncate">{profile.email}</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={
            <Link href="/painel">
              <LayoutDashboard className="h-4 w-4" />
              Meu painel
            </Link>
          }
        />
        {profile.role === "admin" && (
          <DropdownMenuItem
            render={
              <Link href="/admin">
                <ShieldCheck className="h-4 w-4" />
                Painel administrativo
              </Link>
            }
          />
        )}
        <DropdownMenuItem
          render={
            <Link href="/painel/perfil">
              <Settings className="h-4 w-4" />
              Meu perfil
            </Link>
          }
        />
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          render={
            <form action={logout} className="w-full">
              <button type="submit" className="flex w-full items-center gap-2">
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </form>
          }
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

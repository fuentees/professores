import { redirect } from "next/navigation";

// Planos e assinaturas passaram a viver no painel do proprietário — mantido
// como redirecionamento (não 404) pra não quebrar links/favoritos antigos.
// A guarda de acesso ao /dono acontece no layout daquela área.
export default function AdminPlanosRedirectPage() {
  redirect("/dono/planos");
}

import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/dono", "/painel", "/entrar", "/cadastro", "/recuperar-senha", "/redefinir-senha", "/auth"],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}

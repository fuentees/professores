import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Assets extraídos de .docx (bucket "private") só são exibidos via URL
      // assinada e temporária (revisão de importação de questões, admin-only)
      // — precisa do padrão "sign" além de "public", senão next/image rejeita
      // com "Invalid src prop" antes mesmo de tentar carregar.
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/sign/**",
      },
    ],
  },
};

export default nextConfig;

"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Heart,
  LayoutGrid,
  Search,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

type ActionSlide = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  icon: LucideIcon;
};

const ACTION_SLIDES: ActionSlide[] = [
  {
    eyebrow: "COMECE POR AQUI",
    title: "Encontre o material certo para a próxima aula",
    description: "Pesquise por tema, disciplina, ano e tipo de material em poucos passos.",
    href: "/buscar",
    cta: "Buscar materiais",
    icon: Search,
  },
  {
    eyebrow: "AVALIE COM PRATICIDADE",
    title: "Monte uma avaliação com questões prontas",
    description: "Selecione as questões, organize a prova e gere o arquivo com gabarito.",
    href: "/painel/banco-de-questoes",
    cta: "Montar avaliação",
    icon: ClipboardCheck,
  },
  {
    eyebrow: "ENVOLVA A TURMA",
    title: "Leve jogos e recursos interativos para a aula",
    description: "Abra quizzes, simulações e atividades que funcionam direto no navegador.",
    href: "/objetos",
    cta: "Ver recursos",
    icon: LayoutGrid,
  },
  {
    eyebrow: "CONTINUE DE ONDE PAROU",
    title: "Volte rapidamente aos conteúdos que você separou",
    description: "Acesse seus favoritos e retome o planejamento sem procurar tudo novamente.",
    href: "/painel/favoritos",
    cta: "Abrir favoritos",
    icon: Heart,
  },
];

export function TeacherActionCarousel({ teacherName }: { teacherName: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentSlide = ACTION_SLIDES[currentIndex];
  const CurrentIcon = currentSlide.icon;

  function showPrevious() {
    setCurrentIndex((index) => (index - 1 + ACTION_SLIDES.length) % ACTION_SLIDES.length);
  }

  function showNext() {
    setCurrentIndex((index) => (index + 1) % ACTION_SLIDES.length);
  }

  return (
    <section
      className="relative isolate overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(120deg,#172b4d_0%,#1d4260_54%,#b92e0b_130%)] text-white shadow-xl shadow-primary/10"
      aria-roledescription="carrossel"
      aria-label="Atalhos para começar"
    >
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.14),transparent_46%),radial-gradient(circle_at_88%_75%,rgba(233,113,56,0.2),transparent_36%)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-15 [background-image:radial-gradient(circle,white_1px,transparent_1px)] [background-size:22px_22px]"
        aria-hidden
      />

      <Image
        src="/brand/educadora-esquerda.webp"
        alt=""
        width={733}
        height={1100}
        sizes="(min-width: 1280px) 260px, (min-width: 768px) 210px, 150px"
        preload
        className="pointer-events-none absolute -bottom-12 -left-8 z-[1] hidden h-[21rem] w-auto select-none object-contain drop-shadow-2xl md:block xl:-left-3 xl:h-[24rem]"
        aria-hidden
      />
      <Image
        src="/brand/educadora-direita.webp"
        alt=""
        width={733}
        height={1100}
        sizes="(min-width: 1280px) 260px, (min-width: 768px) 210px, 150px"
        preload
        className="pointer-events-none absolute -bottom-12 -right-8 z-[1] hidden h-[21rem] w-auto select-none object-contain drop-shadow-2xl md:block xl:-right-3 xl:h-[24rem]"
        aria-hidden
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] flex h-36 items-end justify-between md:hidden" aria-hidden>
        <Image
          src="/brand/educadora-esquerda.webp"
          alt=""
          width={733}
          height={1100}
          sizes="135px"
          className="-mb-10 -ml-7 h-44 w-auto object-contain opacity-75"
        />
        <Image
          src="/brand/educadora-direita.webp"
          alt=""
          width={733}
          height={1100}
          sizes="135px"
          className="-mb-10 -mr-7 h-44 w-auto object-contain opacity-75"
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[29rem] max-w-3xl flex-col items-center px-5 pb-32 pt-8 text-center sm:px-8 md:min-h-[22rem] md:justify-center md:px-44 md:py-8 lg:px-48 xl:px-40">
        <p className="mb-4 text-sm font-medium text-white/80">
          Olá, <strong className="font-semibold text-white">{teacherName}</strong>{" "}
          <span aria-hidden>👋</span>
          <span className="ml-1.5 text-white/60">O que você precisa preparar hoje?</span>
        </p>
        <div key={currentIndex} className="flex flex-col items-center" aria-live="polite">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[0.68rem] font-bold tracking-[0.16em] text-orange-100 backdrop-blur">
            <CurrentIcon className="size-3.5" aria-hidden />
            {currentSlide.eyebrow}
          </span>
          <h2 className="mt-4 max-w-2xl text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
            {currentSlide.title}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
            {currentSlide.description}
          </p>
          <Link
            href={currentSlide.href}
            className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-[#172b4d] shadow-lg transition hover:-translate-y-0.5 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#172b4d]"
          >
            <CurrentIcon className="size-4" aria-hidden />
            {currentSlide.cta}
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        </div>

        <div className="mt-5 flex items-center gap-3" aria-label="Controles do destaque">
          <button
            type="button"
            onClick={showPrevious}
            className="flex size-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Ver ação anterior"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <div className="flex items-center gap-2">
            {ACTION_SLIDES.map((slide, index) => (
              <button
                key={slide.title}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={`h-2.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                  index === currentIndex ? "w-7 bg-white" : "w-2.5 bg-white/35 hover:bg-white/60"
                }`}
                aria-label={`Mostrar ação ${index + 1}: ${slide.cta}`}
                aria-current={index === currentIndex ? "true" : undefined}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={showNext}
            className="flex size-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Ver próxima ação"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}

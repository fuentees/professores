function isHeading(line: string): boolean {
  const letters = line.replace(/[^A-Za-zÀ-ÿ]/g, "");
  return line.length <= 110 && letters.length > 3 && line === line.toLocaleUpperCase("pt-BR");
}

export function MaterialBody({ body, title }: { body: string; title: string }) {
  const lines = body.split(/\r?\n/).map((line) => line.trim());
  if (lines[0]?.toLocaleLowerCase("pt-BR") === title.trim().toLocaleLowerCase("pt-BR")) lines.shift();

  return (
    <article className="space-y-3 rounded-xl border bg-card p-5 text-sm leading-7 shadow-sm print:border-0 print:p-0 print:shadow-none sm:p-7">
      {lines.map((line, index) => {
        if (!line) return <div key={index} className="h-1" aria-hidden="true" />;
        if (isHeading(line)) return <h2 key={index} className="pt-3 text-base font-bold tracking-wide text-foreground">{line}</h2>;
        if (/^[-•]\s*/.test(line)) return <p key={index} className="pl-4 before:mr-2 before:content-['•']">{line.replace(/^[-•]\s*/, "")}</p>;
        return <p key={index} className="whitespace-pre-wrap">{line}</p>;
      })}
    </article>
  );
}

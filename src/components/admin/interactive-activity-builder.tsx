"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  SIMULATION_KEYS,
  type LearningActivityType,
  type QuizConfig,
  type TrueFalseConfig,
  type MatchingConfig,
  type MemoryConfig,
  type FillBlankConfig,
  type OrderingConfig,
  type FlashcardsConfig,
  type SimulationConfig,
} from "@/lib/validations/interactive-activity";
import { SIMULATION_LABELS } from "@/components/interactive/simulations/registry";

let uid = 0;
function nextId(): string {
  uid += 1;
  return `id-${Date.now()}-${uid}`;
}

export function emptyConfigFor(activityType: LearningActivityType): unknown {
  switch (activityType) {
    case "quiz":
      return {
        questions: [
          {
            id: nextId(),
            prompt: "",
            options: [
              { id: nextId(), text: "" },
              { id: nextId(), text: "" },
            ],
            correctOptionId: "",
          },
        ],
      } satisfies QuizConfig;
    case "true_false":
      return { statements: [{ id: nextId(), statement: "", isTrue: true }] } satisfies TrueFalseConfig;
    case "matching":
      return {
        pairs: [
          { id: nextId(), left: "", right: "" },
          { id: nextId(), left: "", right: "" },
        ],
      } satisfies MatchingConfig;
    case "memory":
      return {
        pairs: [
          { id: nextId(), a: "", b: "" },
          { id: nextId(), a: "", b: "" },
        ],
      } satisfies MemoryConfig;
    case "fill_blank":
      return { sentences: [{ id: nextId(), text: "", answer: "" }] } satisfies FillBlankConfig;
    case "ordering":
      return {
        items: [
          { id: nextId(), text: "" },
          { id: nextId(), text: "" },
        ],
      } satisfies OrderingConfig;
    case "flashcards":
      return { cards: [{ id: nextId(), front: "", back: "" }] } satisfies FlashcardsConfig;
    case "simulation":
      return { simulationKey: "fracoes" } satisfies SimulationConfig;
  }
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Button type="button" variant="outline" size="sm" className="self-start" onClick={onClick}>
      {label}
    </Button>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="ghost" size="icon-sm" aria-label="Remover" onClick={onClick}>
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

function QuizBuilder({ value, onChange }: { value: QuizConfig; onChange: (v: QuizConfig) => void }) {
  return (
    <div className="flex flex-col gap-4">
      {value.questions.map((question, qIndex) => (
        <div key={question.id} className="flex flex-col gap-2 rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Pergunta"
              value={question.prompt}
              onChange={(e) => {
                const questions = [...value.questions];
                questions[qIndex] = { ...question, prompt: e.target.value };
                onChange({ questions });
              }}
            />
            <RemoveButton
              onClick={() => onChange({ questions: value.questions.filter((_, i) => i !== qIndex) })}
            />
          </div>
          <div className="flex flex-col gap-2 pl-4">
            {question.options.map((option, oIndex) => (
              <div key={option.id} className="flex items-center gap-2">
                <input
                  type="radio"
                  aria-label={`Marcar "${option.text || `alternativa ${oIndex + 1}`}" como correta`}
                  name={`correct-${question.id}`}
                  checked={question.correctOptionId === option.id}
                  onChange={() => {
                    const questions = [...value.questions];
                    questions[qIndex] = { ...question, correctOptionId: option.id };
                    onChange({ questions });
                  }}
                />
                <Input
                  placeholder={`Alternativa ${oIndex + 1}`}
                  value={option.text}
                  onChange={(e) => {
                    const options = [...question.options];
                    options[oIndex] = { ...option, text: e.target.value };
                    const questions = [...value.questions];
                    questions[qIndex] = { ...question, options };
                    onChange({ questions });
                  }}
                />
                <RemoveButton
                  onClick={() => {
                    const options = question.options.filter((_, i) => i !== oIndex);
                    const questions = [...value.questions];
                    questions[qIndex] = { ...question, options };
                    onChange({ questions });
                  }}
                />
              </div>
            ))}
            <AddButton
              label="Adicionar alternativa"
              onClick={() => {
                const options = [...question.options, { id: nextId(), text: "" }];
                const questions = [...value.questions];
                questions[qIndex] = { ...question, options };
                onChange({ questions });
              }}
            />
            <p className="text-xs text-muted-foreground">Marque o círculo da alternativa correta.</p>
          </div>
        </div>
      ))}
      <AddButton
        label="Adicionar pergunta"
        onClick={() =>
          onChange({
            questions: [
              ...value.questions,
              {
                id: nextId(),
                prompt: "",
                options: [
                  { id: nextId(), text: "" },
                  { id: nextId(), text: "" },
                ],
                correctOptionId: "",
              },
            ],
          })
        }
      />
    </div>
  );
}

function TrueFalseBuilder({ value, onChange }: { value: TrueFalseConfig; onChange: (v: TrueFalseConfig) => void }) {
  return (
    <div className="flex flex-col gap-2">
      {value.statements.map((statement, index) => (
        <div key={statement.id} className="flex items-center gap-2">
          <Input
            placeholder="Afirmação"
            value={statement.statement}
            onChange={(e) => {
              const statements = [...value.statements];
              statements[index] = { ...statement, statement: e.target.value };
              onChange({ statements });
            }}
          />
          <Select
            value={statement.isTrue ? "true" : "false"}
            onValueChange={(v) => {
              const statements = [...value.statements];
              statements[index] = { ...statement, isTrue: v === "true" };
              onChange({ statements });
            }}
          >
            <SelectTrigger className="w-36" aria-label={`Valor de "${statement.statement || `afirmação ${index + 1}`}"`}>
              <SelectValue>{(v: string) => (v === "true" ? "Verdadeiro" : "Falso")}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Verdadeiro</SelectItem>
              <SelectItem value="false">Falso</SelectItem>
            </SelectContent>
          </Select>
          <RemoveButton onClick={() => onChange({ statements: value.statements.filter((_, i) => i !== index) })} />
        </div>
      ))}
      <AddButton
        label="Adicionar afirmação"
        onClick={() => onChange({ statements: [...value.statements, { id: nextId(), statement: "", isTrue: true }] })}
      />
    </div>
  );
}

function MatchingBuilder({ value, onChange }: { value: MatchingConfig; onChange: (v: MatchingConfig) => void }) {
  return (
    <div className="flex flex-col gap-2">
      {value.pairs.map((pair, index) => (
        <div key={pair.id} className="flex items-center gap-2">
          <Input
            placeholder="Item"
            value={pair.left}
            onChange={(e) => {
              const pairs = [...value.pairs];
              pairs[index] = { ...pair, left: e.target.value };
              onChange({ pairs });
            }}
          />
          <Input
            placeholder="Corresponde a"
            value={pair.right}
            onChange={(e) => {
              const pairs = [...value.pairs];
              pairs[index] = { ...pair, right: e.target.value };
              onChange({ pairs });
            }}
          />
          <RemoveButton onClick={() => onChange({ pairs: value.pairs.filter((_, i) => i !== index) })} />
        </div>
      ))}
      <AddButton
        label="Adicionar par"
        onClick={() => onChange({ pairs: [...value.pairs, { id: nextId(), left: "", right: "" }] })}
      />
    </div>
  );
}

function MemoryBuilder({ value, onChange }: { value: MemoryConfig; onChange: (v: MemoryConfig) => void }) {
  return (
    <div className="flex flex-col gap-2">
      {value.pairs.map((pair, index) => (
        <div key={pair.id} className="flex items-center gap-2">
          <Input
            placeholder="Carta A"
            value={pair.a}
            onChange={(e) => {
              const pairs = [...value.pairs];
              pairs[index] = { ...pair, a: e.target.value };
              onChange({ pairs });
            }}
          />
          <Input
            placeholder="Carta B (par)"
            value={pair.b}
            onChange={(e) => {
              const pairs = [...value.pairs];
              pairs[index] = { ...pair, b: e.target.value };
              onChange({ pairs });
            }}
          />
          <RemoveButton onClick={() => onChange({ pairs: value.pairs.filter((_, i) => i !== index) })} />
        </div>
      ))}
      <AddButton
        label="Adicionar par"
        onClick={() => onChange({ pairs: [...value.pairs, { id: nextId(), a: "", b: "" }] })}
      />
    </div>
  );
}

function FillBlankBuilder({ value, onChange }: { value: FillBlankConfig; onChange: (v: FillBlankConfig) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">Use ___ (três underlines) para marcar a lacuna na frase.</p>
      {value.sentences.map((sentence, index) => (
        <div key={sentence.id} className="flex items-center gap-2">
          <Input
            placeholder="Ex.: A capital do Brasil é ___."
            value={sentence.text}
            onChange={(e) => {
              const sentences = [...value.sentences];
              sentences[index] = { ...sentence, text: e.target.value };
              onChange({ sentences });
            }}
          />
          <Input
            className="w-40"
            placeholder="Resposta"
            value={sentence.answer}
            onChange={(e) => {
              const sentences = [...value.sentences];
              sentences[index] = { ...sentence, answer: e.target.value };
              onChange({ sentences });
            }}
          />
          <RemoveButton onClick={() => onChange({ sentences: value.sentences.filter((_, i) => i !== index) })} />
        </div>
      ))}
      <AddButton
        label="Adicionar frase"
        onClick={() => onChange({ sentences: [...value.sentences, { id: nextId(), text: "", answer: "" }] })}
      />
    </div>
  );
}

function OrderingBuilder({ value, onChange }: { value: OrderingConfig; onChange: (v: OrderingConfig) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">Cadastre os itens na ordem correta.</p>
      {value.items.map((item, index) => (
        <div key={item.id} className="flex items-center gap-2">
          <span className="w-5 shrink-0 text-sm text-muted-foreground">{index + 1}.</span>
          <Input
            placeholder="Item"
            value={item.text}
            onChange={(e) => {
              const items = [...value.items];
              items[index] = { ...item, text: e.target.value };
              onChange({ items });
            }}
          />
          <RemoveButton onClick={() => onChange({ items: value.items.filter((_, i) => i !== index) })} />
        </div>
      ))}
      <AddButton
        label="Adicionar item"
        onClick={() => onChange({ items: [...value.items, { id: nextId(), text: "" }] })}
      />
    </div>
  );
}

function FlashcardsBuilder({ value, onChange }: { value: FlashcardsConfig; onChange: (v: FlashcardsConfig) => void }) {
  return (
    <div className="flex flex-col gap-2">
      {value.cards.map((card, index) => (
        <div key={card.id} className="flex items-center gap-2">
          <Input
            placeholder="Frente"
            value={card.front}
            onChange={(e) => {
              const cards = [...value.cards];
              cards[index] = { ...card, front: e.target.value };
              onChange({ cards });
            }}
          />
          <Input
            placeholder="Verso"
            value={card.back}
            onChange={(e) => {
              const cards = [...value.cards];
              cards[index] = { ...card, back: e.target.value };
              onChange({ cards });
            }}
          />
          <RemoveButton onClick={() => onChange({ cards: value.cards.filter((_, i) => i !== index) })} />
        </div>
      ))}
      <AddButton
        label="Adicionar cartão"
        onClick={() => onChange({ cards: [...value.cards, { id: nextId(), front: "", back: "" }] })}
      />
    </div>
  );
}

function SimulationBuilder({ value, onChange }: { value: SimulationConfig; onChange: (v: SimulationConfig) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>Simulação</Label>
      <Select value={value.simulationKey} onValueChange={(v) => onChange({ simulationKey: v as SimulationConfig["simulationKey"] })}>
        <SelectTrigger className="w-full sm:w-80" aria-label="Simulação">
          <SelectValue>{(v: string) => SIMULATION_LABELS[v as keyof typeof SIMULATION_LABELS]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {SIMULATION_KEYS.map((key) => (
            <SelectItem key={key} value={key}>
              {SIMULATION_LABELS[key]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function InteractiveActivityBuilder({
  activityType,
  config,
  onChange,
}: {
  activityType: LearningActivityType;
  config: unknown;
  onChange: (config: unknown) => void;
}) {
  switch (activityType) {
    case "quiz":
      return <QuizBuilder value={config as QuizConfig} onChange={onChange} />;
    case "true_false":
      return <TrueFalseBuilder value={config as TrueFalseConfig} onChange={onChange} />;
    case "matching":
      return <MatchingBuilder value={config as MatchingConfig} onChange={onChange} />;
    case "memory":
      return <MemoryBuilder value={config as MemoryConfig} onChange={onChange} />;
    case "fill_blank":
      return <FillBlankBuilder value={config as FillBlankConfig} onChange={onChange} />;
    case "ordering":
      return <OrderingBuilder value={config as OrderingConfig} onChange={onChange} />;
    case "flashcards":
      return <FlashcardsBuilder value={config as FlashcardsConfig} onChange={onChange} />;
    case "simulation":
      return <SimulationBuilder value={config as SimulationConfig} onChange={onChange} />;
  }
}

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createReply } from "@/actions/forum";
import { forumReplySchema, type ForumReplyInput } from "@/lib/validations/forum";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ReplyForm({ topicId }: { topicId: string }) {
  const form = useForm({ resolver: zodResolver(forumReplySchema), defaultValues: { body: "" } });

  async function onSubmit(values: ForumReplyInput) {
    const result = await createReply(topicId, values);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    form.reset();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <Textarea rows={3} placeholder="Escreva sua resposta..." {...form.register("body")} />
      <Button type="submit" disabled={form.formState.isSubmitting} className="w-fit">
        {form.formState.isSubmitting ? "Enviando..." : "Responder"}
      </Button>
    </form>
  );
}

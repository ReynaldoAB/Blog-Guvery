"use client";

import { useState } from "react";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";

export type NewComment = {
  comment: string;
};

type CommentFormProps = {
  displayName: string;
  onAddComment: (comment: NewComment) => Promise<boolean>;
};

export default function CommentForm({ displayName, onAddComment }: CommentFormProps) {
  const [comment, setComment] = useState("");
  const [errors, setErrors] = useState<{ comment?: string }>({});
  const [formKey, setFormKey] = useState(0);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: { comment?: string } = {};

    if (!comment.trim()) {
      nextErrors.comment = "Escribe tu comentario";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const wasSaved = await onAddComment({
      comment: comment.trim(),
    });

    if (wasSaved) {
      setComment("");
      setErrors({});
      setFormKey((prev) => prev + 1);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Publicando como <span className="font-semibold text-gray-700 dark:text-gray-200">{displayName}</span>
      </p>

      <TextArea
        placeholder="Comparte tu opinion sobre este articulo"
        rows={4}
        value={comment}
        onChange={setComment}
        error={Boolean(errors.comment)}
        hint={errors.comment}
      />

      <Button variant="primary" size="md" className="w-full sm:w-auto">
        Publicar comentario
      </Button>
    </form>
  );
}
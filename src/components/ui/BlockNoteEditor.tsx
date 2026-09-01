"use client";

import React from "react";
import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";

interface BlockNoteEditorProps {
  initialContent?: any[];
  theme: "dark" | "light";
  onChange: (content: any[]) => void;
  onInit?: (editorInstance: any) => void;
}

export default function BlockNoteEditor({
  initialContent,
  theme,
  onChange,
  onInit
}: BlockNoteEditorProps) {
  const editor = useCreateBlockNote({
    initialContent: initialContent && Array.isArray(initialContent) && initialContent.length > 0 ? initialContent : undefined
  });

  React.useEffect(() => {
    if (onInit) {
      onInit(editor);
    }
  }, [editor, onInit]);

  return (
    <BlockNoteView
      editor={editor}
      theme={theme === "dark" ? "dark" : "light"}
      onChange={() => {
        onChange(editor.document);
      }}
    />
  );
}

import type {
  ChangeEvent,
  DragEvent,
} from 'react';
import { useState } from 'react';

export function useImportFileDrop({
  onFileSelected,
}: {
  onFileSelected: (file: File) => void;
}) {
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;

    if (selectedFile === null) {
      return;
    }

    onFileSelected(selectedFile);
    event.target.value = '';
  }

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setIsDraggingFile(true);
  }

  function handleDragLeave(event: DragEvent<HTMLLabelElement>) {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }

    setIsDraggingFile(false);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDraggingFile(false);

    const selectedFile = event.dataTransfer.files[0] ?? null;

    if (selectedFile === null) {
      return;
    }

    onFileSelected(selectedFile);
  }

  return {
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleFileChange,
    isDraggingFile,
    setIsDraggingFile,
  };
}

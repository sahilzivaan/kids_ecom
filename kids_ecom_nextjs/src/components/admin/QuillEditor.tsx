'use client';
import { useEffect, useRef } from 'react';
import 'quill/dist/quill.snow.css';

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string | number;
}

export default function QuillEditor({ value, onChange, height = '250px' }: QuillEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Use InstanceType to correctly derive the Quill instance type from the class
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const quillRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Quill only once (lazy import to keep SSR-safe)
    if (!quillRef.current) {
      import('quill').then(({ default: Quill }) => {
        if (!containerRef.current || quillRef.current) return;

        quillRef.current = new Quill(containerRef.current, {
          theme: 'snow',
        });

        quillRef.current.on('text-change', () => {
          onChange(quillRef.current?.root.innerHTML || '');
        });

        // Initialize with provided value if any
        if (value) {
          quillRef.current.clipboard.dangerouslyPasteHTML(value);
        }
      });
    }

    // Cleanup: nothing strict needed; React will unmount the DOM node
    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value → editor when template changes (e.g. opening a different template)
  useEffect(() => {
    if (!quillRef.current) return;
    const currentHTML = quillRef.current.root.innerHTML;
    // Avoid cursor-jump on every keystroke; only sync when there's a meaningful external change
    if (
      value !== currentHTML &&
      !(value === '' && (currentHTML === '<p><br></p>' || currentHTML === ''))
    ) {
      const selection = quillRef.current.getSelection();
      quillRef.current.clipboard.dangerouslyPasteHTML(value || '');
      if (selection) quillRef.current.setSelection(selection);
    }
  }, [value]);

  return (
    <div style={{ backgroundColor: '#ffffff', color: '#333333', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ height }} ref={containerRef}></div>
    </div>
  );
}

"use client";

import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Color, FontSize, TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import { useEffect, type ReactNode } from "react";
import { PasteLineBreaks } from "./paste-line-breaks";

const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "30px", "36px", "48px"];

type Props = {
  initialContent?: string;
  onChange: (html: string) => void;
  /** Muda este valor para limpar/recarregar o conteúdo do editor. */
  resetKey?: number;
  autoFocus?: boolean;
};

export function RichTextEditor({ initialContent = "", onChange, resetKey, autoFocus }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: { openOnClick: false } }),
      TextStyle,
      Color,
      FontSize,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      PasteLineBreaks,
    ],
    content: initialContent,
    autofocus: autoFocus ? "end" : false,
    editorProps: {
      attributes: {
        class: "rich-content min-h-48 px-4 py-3 focus:outline-none",
        "aria-label": "Texto do card",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && resetKey !== undefined) {
      editor.commands.setContent(initialContent);
      onChange(editor.getHTML());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, editor]);

  return (
    <div className="overflow-hidden rounded-xl border border-stone-300 bg-white shadow-sm focus-within:ring-2 focus-within:ring-amber-400 dark:border-stone-700 dark:bg-stone-900">
      {editor ? <Toolbar editor={editor} /> : <div className="h-11 border-b border-stone-200 dark:border-stone-700" />}
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      h1: e.isActive("heading", { level: 1 }),
      h2: e.isActive("heading", { level: 2 }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      left: e.isActive({ textAlign: "left" }),
      center: e.isActive({ textAlign: "center" }),
      right: e.isActive({ textAlign: "right" }),
      justify: e.isActive({ textAlign: "justify" }),
      fontSize: (e.getAttributes("textStyle").fontSize as string | undefined) ?? "",
      color: (e.getAttributes("textStyle").color as string | undefined) ?? "#000000",
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  const chain = () => editor.chain().focus();

  return (
    <div
      role="toolbar"
      aria-label="Formatação"
      className="flex flex-wrap items-center gap-1 border-b border-stone-200 bg-stone-50 px-2 py-1.5 dark:border-stone-700 dark:bg-stone-800/60"
    >
      <select
        aria-label="Tamanho da letra"
        value={s.fontSize}
        onChange={(e) =>
          e.target.value ? chain().setFontSize(e.target.value).run() : chain().unsetFontSize().run()
        }
        className="h-8 rounded-md border border-stone-300 bg-white px-1 text-sm dark:border-stone-600 dark:bg-stone-900"
      >
        <option value="">Tamanho</option>
        {FONT_SIZES.map((size) => (
          <option key={size} value={size}>
            {size.replace("px", "")}
          </option>
        ))}
      </select>

      <Sep />
      <Btn label="Negrito" active={s.bold} onClick={() => chain().toggleBold().run()}>
        <b>B</b>
      </Btn>
      <Btn label="Itálico" active={s.italic} onClick={() => chain().toggleItalic().run()}>
        <i className="font-serif">I</i>
      </Btn>
      <Btn label="Sublinhado" active={s.underline} onClick={() => chain().toggleUnderline().run()}>
        <u>U</u>
      </Btn>
      <Btn label="Tachado" active={s.strike} onClick={() => chain().toggleStrike().run()}>
        <s>S</s>
      </Btn>

      <Sep />
      <label title="Cor do texto" className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-md hover:bg-stone-200 dark:hover:bg-stone-700">
        <span className="text-sm font-bold" style={{ borderBottom: `3px solid ${s.color}` }}>A</span>
        <input
          type="color"
          aria-label="Cor do texto"
          value={toHex(s.color)}
          onChange={(e) => chain().setColor(e.target.value).run()}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
      <label title="Cor de destaque" className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-md hover:bg-stone-200 dark:hover:bg-stone-700">
        <span className="rounded bg-yellow-200 px-1 text-sm font-bold text-stone-900">A</span>
        <input
          type="color"
          aria-label="Cor de destaque"
          defaultValue="#fde68a"
          onChange={(e) => chain().setHighlight({ color: e.target.value }).run()}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
      <Btn label="Remover destaque" onClick={() => chain().unsetHighlight().run()}>
        <span className="text-xs line-through">A</span>
      </Btn>

      <Sep />
      <Btn label="Título" active={s.h1} onClick={() => chain().toggleHeading({ level: 1 }).run()}>
        <span className="text-xs font-bold">H1</span>
      </Btn>
      <Btn label="Subtítulo" active={s.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()}>
        <span className="text-xs font-bold">H2</span>
      </Btn>
      <Btn label="Lista" active={s.bullet} onClick={() => chain().toggleBulletList().run()}>
        •≡
      </Btn>
      <Btn label="Lista numerada" active={s.ordered} onClick={() => chain().toggleOrderedList().run()}>
        <span className="text-xs">1.</span>≡
      </Btn>
      <Btn label="Citação" active={s.quote} onClick={() => chain().toggleBlockquote().run()}>
        ❝
      </Btn>

      <Sep />
      <Btn label="Alinhar à esquerda" active={s.left} onClick={() => chain().setTextAlign("left").run()}>
        <AlignIcon lines={["w-4", "w-3", "w-4", "w-2"]} justify="start" />
      </Btn>
      <Btn label="Centralizar" active={s.center} onClick={() => chain().setTextAlign("center").run()}>
        <AlignIcon lines={["w-4", "w-2", "w-4", "w-2"]} justify="center" />
      </Btn>
      <Btn label="Alinhar à direita" active={s.right} onClick={() => chain().setTextAlign("right").run()}>
        <AlignIcon lines={["w-4", "w-3", "w-4", "w-2"]} justify="end" />
      </Btn>
      <Btn label="Justificar" active={s.justify} onClick={() => chain().setTextAlign("justify").run()}>
        <AlignIcon lines={["w-4", "w-4", "w-4", "w-4"]} justify="start" />
      </Btn>

      <Sep />
      <Btn label="Limpar formatação" onClick={() => chain().unsetAllMarks().clearNodes().run()}>
        <span className="text-xs">Tx</span>
      </Btn>
      <Btn label="Desfazer" disabled={!s.canUndo} onClick={() => chain().undo().run()}>↶</Btn>
      <Btn label="Refazer" disabled={!s.canRedo} onClick={() => chain().redo().run()}>↷</Btn>
    </div>
  );
}

function Btn({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex h-8 min-w-8 items-center justify-center rounded-md px-1.5 text-sm transition-colors disabled:opacity-30 ${
        active
          ? "bg-amber-200 text-amber-950 dark:bg-amber-500/30 dark:text-amber-100"
          : "hover:bg-stone-200 dark:hover:bg-stone-700"
      }`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span aria-hidden className="mx-1 h-5 w-px bg-stone-300 dark:bg-stone-600" />;
}

function AlignIcon({ lines, justify }: { lines: string[]; justify: "start" | "center" | "end" }) {
  const items = { start: "items-start", center: "items-center", end: "items-end" }[justify];
  return (
    <span className={`flex flex-col gap-[2px] ${items}`}>
      {lines.map((w, i) => (
        <span key={i} className={`h-[2px] ${w} rounded bg-current`} />
      ))}
    </span>
  );
}

function toHex(color: string): string {
  if (/^#[0-9a-f]{6}$/i.test(color)) return color;
  const m = color.match(/\d+/g);
  if (color.startsWith("rgb") && m && m.length >= 3) {
    return "#" + m.slice(0, 3).map((n) => Number(n).toString(16).padStart(2, "0")).join("");
  }
  return "#000000";
}

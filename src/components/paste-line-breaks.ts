import { Extension } from "@tiptap/react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { DOMParser, DOMSerializer, Fragment, Slice, type Node } from "@tiptap/pm/model";

/**
 * Preserva as linhas em branco ao colar conteúdo:
 *
 * - Texto puro (ex.: Bloco de Notas): o ProseMirror por padrão junta várias quebras
 *   seguidas em uma só. Aqui cada linha vira um parágrafo e cada linha em branco
 *   vira um parágrafo vazio — igual a apertar Enter no editor.
 * - HTML (ex.: Google Docs): linhas em branco chegam como `<br>` soltos, que viram
 *   parágrafos contendo só quebras de linha e aparecem com o dobro da altura.
 *   Esses parágrafos são trocados por parágrafos vazios (um por quebra).
 */
export const PasteLineBreaks = Extension.create({
  name: "pasteLineBreaks",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("pasteLineBreaks"),
        props: {
          clipboardTextParser(text, $context, _plain, view) {
            const { schema } = view.state;
            const serializer = DOMSerializer.fromSchema(schema);
            const marks = $context.marks();
            const dom = document.createElement("div");
            text
              .replace(/\r\n?/g, "\n")
              .replace(/\n$/, "")
              .split("\n")
              .forEach((line) => {
                const p = dom.appendChild(document.createElement("p"));
                if (line) p.appendChild(serializer.serializeNode(schema.text(line, marks)));
              });
            return DOMParser.fromSchema(schema).parseSlice(dom, {
              preserveWhitespace: true,
              context: $context,
            });
          },

          transformPasted(slice) {
            return new Slice(expandBreakOnlyParagraphs(slice.content), slice.openStart, slice.openEnd);
          },
        },
      }),
    ];
  },
});

function expandBreakOnlyParagraphs(fragment: Fragment): Fragment {
  const nodes: Node[] = [];
  fragment.forEach((node) => {
    if (
      node.type.name === "paragraph" &&
      node.childCount > 0 &&
      Array.from({ length: node.childCount }, (_, i) => node.child(i)).every((c) => c.type.name === "hardBreak")
    ) {
      for (let i = 0; i < node.childCount; i++) nodes.push(node.type.create(node.attrs));
    } else if (!node.isTextblock && node.content.size > 0) {
      nodes.push(node.copy(expandBreakOnlyParagraphs(node.content)));
    } else {
      nodes.push(node);
    }
  });
  return Fragment.from(nodes);
}

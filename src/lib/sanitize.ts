import "server-only";
import sanitizeHtml from "sanitize-html";

const color = [/^#[0-9a-f]{3,8}$/i, /^rgba?\([\d\s.,%]+\)$/i, /^[a-z]+$/i];

export function sanitizeContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "h1", "h2", "h3", "strong", "b", "em", "i", "u", "s",
      "span", "mark", "ul", "ol", "li", "blockquote", "code", "pre", "hr", "a",
    ],
    allowedAttributes: {
      "*": ["style"],
      a: ["href", "target", "rel"],
      mark: ["data-color", "style"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedStyles: {
      "*": {
        color,
        "background-color": color,
        "font-size": [/^\d{1,3}(\.\d+)?(px|rem|em|%)$/],
        "text-align": [/^(left|right|center|justify)$/],
      },
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }),
    },
  });
}

/** Verifica se há texto de fato (ignora parágrafos vazios). */
export function hasText(html: string): boolean {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).trim().length > 0;
}

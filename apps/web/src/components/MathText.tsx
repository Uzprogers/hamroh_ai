import { useMemo } from "react";
import katex from "katex";

const INLINE = /\$([^$]+)\$/;
const MATH_SHAPE = /[\^_=]|(\d\s*\/\s*[a-zA-Z0-9])|([a-zA-Z]\s*\/\s*[a-zA-Z0-9])/;
const MATH_CHARS = /^[\s0-9a-zA-Z^_+\-*/=().,|<>≤≥±√]+$/;
const WORD = /[a-zA-Z]{4,}/;

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

function looksLikeMath(text: string): boolean {
  const value = text.trim();
  if (value.length < 2 || value.length > 120) return false;
  return MATH_CHARS.test(value) && MATH_SHAPE.test(value) && !WORD.test(value);
}

function toLatex(text: string): string {
  return text
    .replace(/\s*\*\s*/g, " \\cdot ")
    .replace(/([a-zA-Z0-9)])\^([a-zA-Z0-9]+)/g, "$1^{$2}")
    .replace(/([a-zA-Z0-9)])_([a-zA-Z0-9]+)/g, "$1_{$2}")
    .replace(/([a-zA-Z0-9)]+)\s*\/\s*([a-zA-Z0-9(]+)/g, "\\frac{$1}{$2}")
    .replace(/≤/g, "\\leq ")
    .replace(/≥/g, "\\geq ")
    .replace(/±/g, "\\pm ")
    .replace(/√/g, "\\sqrt ");
}

function render(expression: string): string {
  return katex.renderToString(expression, {
    throwOnError: false,
    displayMode: false,
    trust: false,
  });
}

function toHtml(text: string): string {
  let rest = text;
  let html = "";
  let match = INLINE.exec(rest);

  while (match) {
    html += escapeHtml(rest.slice(0, match.index)) + render(match[1]);
    rest = rest.slice(match.index + match[0].length);
    match = INLINE.exec(rest);
  }

  return html ? html + escapeHtml(rest) : "";
}

export function MathText({ text, className }: { text: string; className?: string }) {
  const html = useMemo(() => {
    if (!text) return "";
    const inline = toHtml(text);
    if (inline) return inline;
    return looksLikeMath(text) ? render(toLatex(text)) : "";
  }, [text]);

  if (!html) return <span className={className}>{text}</span>;

  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

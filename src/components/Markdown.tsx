"use client";

import { useMemo } from "react";

/**
 * Tiny, dependency-free Markdown renderer good enough for lesson content:
 * fenced code blocks, headings, tables, bullet lists, **bold** and `code`.
 */
function renderMarkdown(raw: string): React.ReactNode[] {
  const lines = raw.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block (fenced with ```)
    if (line.trimStart().startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      nodes.push(
        <pre
          key={`code-${i}`}
          className="bg-[#0b1120] border border-[var(--border)] rounded-lg p-4 my-3 overflow-x-auto font-mono text-sm leading-relaxed text-[#93c5fd]"
        >
          {codeLines.join("\n")}
        </pre>
      );
      continue;
    }

    // Headers
    if (line.startsWith("### ")) {
      nodes.push(
        <h4
          key={`h4-${i}`}
          className="text-base font-semibold text-[var(--accent)] mt-4 mb-1"
        >
          {renderInline(line.slice(4))}
        </h4>
      );
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      nodes.push(
        <h3
          key={`h3-${i}`}
          className="text-lg font-semibold text-[var(--accent)] mt-5 mb-2"
        >
          {renderInline(line.slice(3))}
        </h3>
      );
      i++;
      continue;
    }
    if (line.startsWith("# ")) {
      nodes.push(
        <h2
          key={`h2-${i}`}
          className="text-xl font-bold text-[var(--accent)] mt-5 mb-2"
        >
          {renderInline(line.slice(2))}
        </h2>
      );
      i++;
      continue;
    }

    // Table rows
    if (line.trimStart().startsWith("|")) {
      const tableRows: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith("|")) {
        tableRows.push(lines[i]);
        i++;
      }
      const dataRows = tableRows.filter((r) => !r.match(/^\|[\s\-:|]+\|$/));
      if (dataRows.length > 0) {
        const headerCells = dataRows[0]
          .split("|")
          .filter((c) => c.trim() !== "");
        const bodyRows = dataRows.slice(1);
        nodes.push(
          <div key={`table-${i}`} className="my-3 overflow-x-auto">
            <table className="w-full text-sm border border-[var(--border)] rounded">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--background)]">
                  {headerCells.map((cell, ci) => (
                    <th
                      key={ci}
                      className="px-3 py-2 text-left text-[var(--foreground)]/60 font-semibold"
                    >
                      {renderInline(cell.trim())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((row, ri) => {
                  const cells = row.split("|").filter((c) => c.trim() !== "");
                  return (
                    <tr
                      key={ri}
                      className="border-b border-[var(--border)]/30"
                    >
                      {cells.map((cell, ci) => (
                        <td key={ci} className="px-3 py-2">
                          {renderInline(cell.trim())}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    // List items
    if (line.match(/^\s*[-*]\s/)) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].match(/^\s*[-*]\s/)) {
        listItems.push(lines[i].replace(/^\s*[-*]\s/, ""));
        i++;
      }
      nodes.push(
        <ul
          key={`ul-${i}`}
          className="my-2 ml-4 space-y-1 list-disc list-outside"
        >
          {listItems.map((item, li) => (
            <li key={li} className="text-sm leading-relaxed">
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      nodes.push(<div key={`br-${i}`} className="h-2" />);
      i++;
      continue;
    }

    // Regular paragraph
    nodes.push(
      <p key={`p-${i}`} className="text-sm leading-relaxed">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return nodes;
}

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*)|(`([^`]+?)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
    }

    if (match[2]) {
      parts.push(
        <strong key={key++} className="font-semibold text-[var(--foreground)]">
          {match[2]}
        </strong>
      );
    } else if (match[4]) {
      parts.push(
        <code
          key={key++}
          className="font-mono text-[var(--accent)] bg-[var(--accent)]/10 px-1.5 py-0.5 rounded text-[0.85em]"
        >
          {match[4]}
        </code>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  }

  return parts.length > 0 ? parts : [<span key="empty">{text}</span>];
}

export default function Markdown({ content }: { content: string }) {
  const rendered = useMemo(() => renderMarkdown(content), [content]);
  return <>{rendered}</>;
}

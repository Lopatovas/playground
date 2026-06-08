function inline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

export function Markdown({ source }: { source: string }) {
  const blocks: string[] = [];
  let inCode = false;
  let codeBuf: string[] = [];
  let listBuf: string[] = [];

  const flushList = () => {
    if (listBuf.length) {
      blocks.push(`<ul>${listBuf.map((l) => `<li>${inline(l)}</li>`).join("")}</ul>`);
      listBuf = [];
    }
  };

  for (const line of source.split("\n")) {
    if (line.startsWith("```")) {
      flushList();
      if (inCode) {
        blocks.push(`<pre><code>${codeBuf.join("\n")}</code></pre>`);
        codeBuf = [];
        inCode = false;
      } else {
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeBuf.push(line);
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      continue;
    }

    if (/^[-*] /.test(trimmed)) {
      listBuf.push(trimmed.slice(2));
      continue;
    }

    if (/^\d+\. /.test(trimmed)) {
      listBuf.push(trimmed.replace(/^\d+\. /, ""));
      continue;
    }

    flushList();
    if (trimmed.startsWith("### ")) {
      blocks.push(`<h3>${inline(trimmed.slice(4))}</h3>`);
    } else if (trimmed.startsWith("## ")) {
      blocks.push(`<h2>${inline(trimmed.slice(3))}</h2>`);
    } else {
      blocks.push(`<p>${inline(trimmed)}</p>`);
    }
  }

  flushList();
  if (inCode && codeBuf.length) {
    blocks.push(`<pre><code>${codeBuf.join("\n")}</code></pre>`);
  }

  return (
    <div
      className="markdown"
      dangerouslySetInnerHTML={{ __html: blocks.join("") }}
    />
  );
}

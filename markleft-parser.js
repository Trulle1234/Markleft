// ps: i konw this code is awfull but if it works it works? ;-;

import { emojis } from "./emojis.js";

function escapeHtml(text) {
  return text.replace(/[&<>]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;"
    }[char]));
}

// note that this functon is AI made
function tocGenerator(html, ignoreText = "") {
  const ignoredIds = ignoreText
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.replace(/^#/, ""));

  const headings = [...html.matchAll(/<h([1-6]) id="([^"]+)">([\s\S]*?)<\/h\1>/gi)];

  const items = headings
    .filter((heading) => {
      const id = heading[2];
      return !ignoredIds.includes(id);
    })
    .map((heading) => {
      const level = Number(heading[1]);
      const id = heading[2];
      const text = heading[3].replace(/<[^>]*>/g, "");

      return `<li class="toc-level-${level}"><a href="#${id}">${text}</a></li>`;
    });

  if (items.length === 0) return "";

  return `<nav class="toc"><ul>${items.join("")}</ul></nav>`;
}

export function parseMarkdown(markdown) {
  // metadata
  let metadata = {};

  if (markdown.startsWith("{meta}")) {
    const end = markdown.indexOf("{/meta}");
    if (end !== -1) {
      const metaContent = markdown.substring(7, end);
      const lines = metaContent.split("\n").map(line => line.trim()).filter(line => line);
      for (const line of lines) {
        const colon = line.indexOf(":");
        if (colon !== -1) {
          const key = line.substring(0, colon).trim();
          const value = line.substring(colon + 1).trim();
          metadata[key] = value;
        }
      }
      markdown = markdown.substring(end + 7).trim();
    }
  }

  const codeBlocks = [];

  let html = markdown

    // code block
    .replace(/%\[([\s\S]*?)\]%/g, (_, code) => {
      const index = codeBlocks.length;
      codeBlocks.push(`<pre><code>${escapeHtml(code)}</code></pre>`);
      return `\uE100${index}\uE101`;})
      
    // escaping
    .replace(/\\([\\*\/_\-=~^#[\]():!>%])/gim, (_, char) => {
      return `\uE000${char}\uE001`;})

    // reference metadata
    .replace(/meta\{(.*?)\}/gim, (_, key) => {
      return metadata[key.trim()] || "";})
    // line
    .replace(/^---(.*$)/gim, "<hr>")

    // blankline
    .replace(/^\.\s*$/gim, "<br>")

    // image
    .replace(/#\[([^\]]+)\]\(([^)]+)\)\s*\{(.*?)\}/gim, '<img src="$1" alt="$2" style="width: $3;">')

    .replace(/#\[([^\]]+)\]\(([^)]+)\)/gim, '<img src="$1" alt="$2">')

    // link
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$1">$2</a>')

    // headigs
    .replace(/^###### (.*?) \{#(.*?)\}\s*$/gim, '<h6 id="$2">$1</h6>')
    .replace(/^##### (.*?) \{#(.*?)\}\s*$/gim, '<h5 id="$2">$1</h5>')
    .replace(/^#### (.*?) \{#(.*?)\}\s*$/gim, '<h4 id="$2">$1</h4>')
    .replace(/^### (.*?) \{#(.*?)\}\s*$/gim, '<h3 id="$2">$1</h3>')
    .replace(/^## (.*?) \{#(.*?)\}\s*$/gim, '<h2 id="$2">$1</h2>')
    .replace(/^# (.*?) \{#(.*?)\}\s*$/gim, '<h1 id="$2">$1</h1>')

    .replace(/^###### (.*$)/gim, (_, text) => {
      const id = text.toLowerCase().replace(/\s+/g, "-");
      return `<h6 id="${id}">${text}</h6>`;})
    .replace(/^##### (.*$)/gim, (_, text) => {
      const id = text.toLowerCase().replace(/\s+/g, "-");
      return `<h5 id="${id}">${text}</h5>`;})
    .replace(/^#### (.*$)/gim, (_, text) => {
      const id = text.toLowerCase().replace(/\s+/g, "-");
      return `<h4 id="${id}">${text}</h4>`;})
    .replace(/^### (.*$)/gim, (_, text) => {
      const id = text.toLowerCase().replace(/\s+/g, "-");
      return `<h3 id="${id}">${text}</h3>`;})
    .replace(/^## (.*$)/gim, (_, text) => {
      const id = text.toLowerCase().replace(/\s+/g, "-");
      return `<h2 id="${id}">${text}</h2>`;})
    .replace(/^# (.*$)/gim, (_, text) => {
      const id = text.toLowerCase().replace(/\s+/g, "-");
      return `<h1 id="${id}">${text}</h1>`;})

    // emphasis
    .replace(/[\s\S]*/, (text) => {
      let previous;
      do {
        previous = text;
        text = text
          .replace(/(^|[\s>])\*([^*\n]+?)\*(?=\s|$|[<.,!?;:])/gim, "$1<strong>$2</strong>")
          .replace(/(^|[\s>])\/([^/\n]+?)\/(?=\s|$|[<.,!?;:])/gim, "$1<em>$2</em>")
          .replace(/(^|[\s>])_([^_\n]+?)_(?=\s|$|[<.,!?;:])/gim, "$1<u>$2</u>")
          .replace(/(^|[\s>])\-([^- \n][^-\n]*?)\-(?=\s|$|[<.,!?;:])/gim, "$1<del>$2</del>")

          .replace(/(^|[\s>])=([^=\n]+?)=(?=\s|$|[<.,!?;:])/gim, "$1<mark>$2</mark>")

          .replace(/(^|[\s>])~([^~\s\n][^~\n]*?)~(?=\s|$|[<.,!?;:])/gim, "$1<sub>$2</sub>")
          .replace(/(^|[\s>])\^([^^\s\n][^^\n]*?)\^(?=\s|$|[<.,!?;:])/gim, "$1<sup>$2</sup>")

          .replace(/(^|[\s>])%([^%\s\n][^%\n]*?)%(?=\s|$|[<.,!?;:])/gim, (_, before, code) => {
            return `${before}<code>${escapeHtml(code)}</code>`;});
      } while (text !== previous);

      return text;})

    // collapsible section
    .replace(/^\? (.*?) \[(.*?)\]\s*$/gim, "<details><summary>$2</summary>$1</details>")

    // blockquote
    .replace(/^(?:> .*(?:\r?\n|$))+/gm, (block) => {
      const content = block
        .trimEnd()
        .split(/\r?\n/)
        .map((line) => line.replace(/^> ?/, ""))
        .join("<br>");

      return `<blockquote>${content}</blockquote>`;})
      
    // lists
    .replace(/^(?:\d+\. .*(?:\r?\n|$))+/gm, (block) => {
      const content = block
        .trimEnd()
        .split(/\r?\n/)
        .map((line) => line.replace(/^\d+\. ?/, ""))
        .map((line) => `<li>${line}</li>`)
        .join("");
      return `<ol>${content}</ol>`;})

    .replace(/^(?:- .*(?:\r?\n|$))+/gm, (block) => {
      const content = block
        .trimEnd()
        .split(/\r?\n/)
        .map((line) => line.replace(/^- ?/, ""))
        .map((line) => `<li>${line}</li>`)
        .join("");
      return `<ul>${content}</ul>`;})

    // paragraphs
    .replace(/^(?!<(h[1-6]|hr|ul|ol|li|blockquote|pre|img|code)\b)(.+)$/gim, "<p>$2</p>")

    // emojis
    .replace(/:([a-z0-9_+-]+):/gi, (_, name) => {
      return emojis[name.toLowerCase()] || `:${name}:`;})

    // unescape
    .replace(/\uE000(.?)\uE001/gim, "$1")

    // restore code blocks
    .replace(/\uE100(\d+)\uE101/g, (_, index) => {
      return codeBlocks[Number(index)];});
    
    
  // table of contents
  html = html
  .replace(/<p>\[TOC\](?:\s*\{\!\s*([^}]*)\})?<\/p>/gi, (_, ignoreText = "") => {
    return tocGenerator(html, ignoreText);
  })

  return { metadata, html };
}
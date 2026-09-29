(function (global) {
  "use strict";

  var stashList = [];
  var stashSeq = 0;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function stash(html) {
    var token = "\u0000MDP" + stashSeq + "\u0000";
    stashList[stashSeq] = html;
    stashSeq += 1;
    return token;
  }

  function unstash(text) {
    return text.replace(/\u0000MDP(\d+)\u0000/g, function (_, i) {
      return Object.prototype.hasOwnProperty.call(stashList, i) ? stashList[i] : "";
    });
  }

  function safeUrl(url) {
    var value = String(url).trim();
    if (/^(javascript|vbscript|data):/i.test(value)) return null;
    if (/^[a-z][a-z0-9+.-]*:/i.test(value) && !/^(https?:|mailto:|tel:)/i.test(value)) return null;
    return value;
  }

  function attr(name, value) {
    return name + '="' + escapeHtml(value) + '"';
  }

  function slugify(text) {
    return String(text)
      .toLowerCase()
      .replace(/[`*_~\[\]()#!]/g, "")
      .replace(/[^a-z0-9\u00c0-\u024f]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "section";
  }

  function imageTag(alt, src) {
    var url = safeUrl(src);
    if (!url) return escapeHtml(alt);
    return "<img " + attr("src", url) + " " + attr("alt", alt) + ' loading="lazy">';
  }

  function linkTag(label, href) {
    var url = safeUrl(href);
    if (!url) return label;
    var external = /^https?:/i.test(url);
    return (
      "<a " + attr("href", url) +
      (external ? ' target="_blank" rel="noopener noreferrer"' : "") +
      ">" + label + "</a>"
    );
  }

  function renderInline(text) {
    var out = escapeHtml(text);

    out = out.replace(/`([^`]+)`/g, function (_, code) {
      return stash("<code>" + code.replace(/^ | $/g, "") + "</code>");
    });

    out = out.replace(/!\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\s*\)/g, function (_, alt, src) {
      return stash(imageTag(alt, src));
    });

    out = out.replace(/\[([^\]]+)\]\(\s*([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\s*\)/g, function (_, label, href) {
      return stash(linkTag(label, href));
    });

    out = out.replace(/\[([^\]]+)\]\[([^\]]*)\]/g, function (_, label, ref) {
      return stash(linkTag(label, "#" + slugify(ref || label)));
    });

    out = out.replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>");
    out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,;:!?]|$)/g, "$1<em>$2</em>");
    out = out.replace(/(^|[\s(])_([^_\n]+)_(?=[\s).,;:!?]|$)/g, "$1<em>$2</em>");
    out = out.replace(/~~([^~]+)~~/g, "<del>$1</del>");

    return unstash(out);
  }

  function isBlockStart(line) {
    return /^\s*(#{1,6}\s|>|```|~~~|([-*+]|\d+[.)])\s)/.test(line) ||
      /^\s*(?:[-*_]\s*){3,}$/.test(line);
  }

  function renderTable(rows) {
    var cells = function (row) {
      return row
        .replace(/^\s*\|/, "")
        .replace(/\|\s*$/, "")
        .split("|")
        .map(function (c) {
          return c.trim();
        });
    };

    var head = cells(rows[0]).map(function (c) {
      return "<th>" + renderInline(c) + "</th>";
    }).join("");

    var body = rows.slice(2).map(function (row) {
      return "<tr>" + cells(row).map(function (c) {
        return "<td>" + renderInline(c) + "</td>";
      }).join("") + "</tr>";
    }).join("");

    return "<div class=\"md-table-wrap\"><table><thead><tr>" + head + "</tr></thead><tbody>" + body + "</tbody></table></div>";
  }

  function isTableRow(line) {
    return /\|/.test(line) && line.trim() !== "";
  }

  function isTableDivider(line) {
    return /^\s*\|?[\s:-]*-[\s|:-]*\|?\s*$/.test(line) && line.indexOf("-") !== -1;
  }

  function parseListNodes(block) {
    var root = { indent: -1, children: [] };
    var stack = [root];
    var last = null;

    block.forEach(function (raw) {
      var match = raw.match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
      if (match) {
        var indent = match[1].length;
        var node = { indent: indent, ordered: /\d/.test(match[2]), text: match[3], children: [] };
        while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop();
        stack[stack.length - 1].children.push(node);
        stack.push(node);
        last = node;
        return;
      }
      if (last) last.text += "\n" + raw.trim();
    });

    return root.children;
  }

  function renderListNodes(nodes) {
    var out = [];
    var open = null;
    var tag = null;

    function closeList() {
      if (tag) out.push("</" + tag + ">");
      tag = null;
      open = null;
    }

    nodes.forEach(function (node) {
      var nodeTag = node.ordered ? "ol" : "ul";
      if (tag !== nodeTag) {
        closeList();
        tag = nodeTag;
        out.push("<" + tag + ">");
        open = tag;
      }

      var task = node.text.match(/^\[([ xX])\]\s*([\s\S]*)$/);
      var body = task
        ? '<span class="md-task' + (task[1] === " " ? "" : " is-done") + '" aria-hidden="true"></span>' + renderInline(task[2])
        : renderInline(node.text);

      var nested = node.children.length ? renderListNodes(node.children) : "";
      out.push("<li>" + body + nested + "</li>");
    });

    closeList();
    return out.join("");
  }

  function renderBlocks(lines) {
    var out = [];
    var i = 0;

    while (i < lines.length) {
      var line = lines[i];

      if (!line.trim()) {
        i += 1;
        continue;
      }

      var fence = line.match(/^\s*(```|~~~)\s*([\w+-]*)\s*$/);
      if (fence) {
        var marker = fence[1];
        var lang = fence[2];
        var code = [];
        i += 1;
        while (i < lines.length && !new RegExp("^\\s*" + marker + "\\s*$").test(lines[i])) {
          code.push(lines[i]);
          i += 1;
        }
        i += 1;
        out.push(
          "<pre" + (lang ? ' data-lang="' + escapeHtml(lang) + '"' : "") +
          "><code>" + escapeHtml(code.join("\n")) + "</code></pre>"
        );
        continue;
      }

      var heading = line.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/);
      if (heading) {
        var level = heading[1].length;
        var text = heading[2];
        out.push("<h" + level + ' id="' + escapeHtml(slugify(text)) + '">' +
          '<a class="md-anchor" href="#' + escapeHtml(slugify(text)) + '">#</a>' +
          renderInline(text) + "</h" + level + ">");
        i += 1;
        continue;
      }

      if (/^\s*(?:[-*_]\s*){3,}$/.test(line)) {
        out.push("<hr>");
        i += 1;
        continue;
      }

      if (/^\s*>/.test(line)) {
        var quote = [];
        while (i < lines.length && (/^\s*>/.test(lines[i]) || (quote.length && lines[i].trim() && !isBlockStart(lines[i])))) {
          quote.push(lines[i].replace(/^\s*>\s?/, ""));
          i += 1;
        }
        out.push("<blockquote>" + renderBlocks(quote) + "</blockquote>");
        continue;
      }

      if (isTableRow(line) && i + 1 < lines.length && isTableDivider(lines[i + 1])) {
        var rows = [];
        while (i < lines.length && isTableRow(lines[i])) {
          rows.push(lines[i]);
          i += 1;
        }
        out.push(renderTable(rows));
        continue;
      }

      if (/^\s*([-*+]|\d+[.)])\s+/.test(line)) {
        var listBlock = [];
        while (i < lines.length && (/^\s*([-*+]|\d+[.)])\s+/.test(lines[i]) || (lines[i].trim() && !isBlockStart(lines[i])))) {
          listBlock.push(lines[i]);
          i += 1;
        }
        out.push(renderListNodes(parseListNodes(listBlock)));
        continue;
      }

      var para = [];
      while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) {
        para.push(lines[i].trim());
        i += 1;
      }
      if (para.length) out.push("<p>" + renderInline(para.join("\n")).replace(/\n/g, "<br>") + "</p>");
    }

    return out.join("\n");
  }

  function render(source) {
    stashList = [];
    stashSeq = 0;
    var body = String(source == null ? "" : source).replace(/\r\n?/g, "\n").replace(/\t/g, "  ");
    return renderBlocks(body.split("\n"));
  }

  function wordCount(source) {
    var text = String(source || "").replace(/```[\s\S]*?```/g, " ");
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }

  global.MiniMarkdown = {
    render: render,
    escapeHtml: escapeHtml,
    wordCount: wordCount,
  };
})(typeof window !== "undefined" ? window : this);

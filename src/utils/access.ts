import { commands } from "./commands";
import type { CommandResult } from "./commands";
import { fetchAndParseArticle } from "./wiki-parser";
import { formatScpNumber, sanitizeHTML } from "./helpers";

commands.access = {
    name: "access",
    description: "Retrieve an SCP article from the database.",
    usage: "access [SCP-XXX]",
    execute: async (args): Promise<CommandResult> => {
        if (args.length === 0) {
            return { type: "error", content: "Specify an SCP to access. Usage: access SCP-XXX" };
        }

        const query = args[0];
        const scpNumber = formatScpNumber(query);
        const urlSlug = `scp-${query.replace(/^scp[-\s]?/i, "").replace(/^0+/, "")}`;

        try {
            const article = await fetchAndParseArticle(urlSlug);

            const classColor = (c: string): string => {
                const map: Record<string, string> = {
                    safe: "#0f0", euclid: "#ff0", keter: "#f44",
                    dark: "#0f0", caution: "#0af", warning: "#fa0",
                    critical: "#f44", notice: "#0f0", danger: "#f80",
                    none: "#666", neutralized: "#888", pending: "#888",
                    explained: "#888", amida: "#f44", ekhi: "#f80",
                    keneq: "#fa0", vlam: "#0af",
                };
                return map[c.toLowerCase().trim()] || "#aaa";
            };

            const bar = article.classification;
            const classBarHtml = `
<div class="class-bar">
  <div class="class-bar-title">${sanitizeHTML(article.title)}</div>
  <div class="class-bar-grid">
    <div class="class-bar-item" style="border-left: 4px solid ${classColor(bar.class)}">
      <span class="class-bar-label">Object Class</span>
      <span class="class-bar-value">${sanitizeHTML(bar.class.toUpperCase())}</span>
    </div>
    <div class="class-bar-item" style="border-left: 4px solid ${classColor(bar.containment)}">
      <span class="class-bar-label">Containment</span>
      <span class="class-bar-value">${sanitizeHTML(bar.containment.toUpperCase())}</span>
    </div>
    <div class="class-bar-item" style="border-left: 4px solid ${classColor(bar.disruption)}">
      <span class="class-bar-label">Disruption</span>
      <span class="class-bar-value">${sanitizeHTML(bar.disruption.toUpperCase())}</span>
    </div>
    <div class="class-bar-item" style="border-left: 4px solid ${classColor(bar.risk)}">
      <span class="class-bar-label">Risk</span>
      <span class="class-bar-value">${sanitizeHTML(bar.risk.toUpperCase())}</span>
    </div>
  </div>
</div>`;

            const articleHtml = [
                classBarHtml,
                `<div class="rendered-content">${article.rawHtml}</div>`,
            ].join("\n");

            return { type: "html", content: articleHtml };
        } catch (err) {
            return {
                type: "error",
                content: `Failed to retrieve ${scpNumber}: ${err instanceof Error ? err.message : "Unknown error"}`,
            };
        }
    },
};

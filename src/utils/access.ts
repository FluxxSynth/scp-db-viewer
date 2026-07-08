import { commands } from "./commands";
import type { CommandResult } from "./commands";
import { fetchAndParseArticle } from "./wiki-parser";
import { formatScpNumber } from "./helpers";

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

            // Add a title header for articles without an anomaly class bar
            const hasAnomBar = article.rawHtml.includes("anom-bar-container");
            const titleHeader = hasAnomBar ? "" : `
<div class="article-title-header">
  <div class="article-title-text">${article.title}</div>
</div>`;

            const content = `${titleHeader}
<div class="rendered-content">
${article.rawHtml}
</div>`;

            return { type: "html", content };
        } catch (err) {
            return {
                type: "error",
                content: `Failed to retrieve ${scpNumber}: ${err instanceof Error ? err.message : "Unknown error"}`,
            };
        }
    },
};

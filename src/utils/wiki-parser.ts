import * as cheerio from "cheerio";
import { stripHTML, stripWikidot } from "./helpers";

export interface Classification {
    class: string;
    containment: string;
    disruption: string;
    risk: string;
}

export interface ArticleData {
    title: string;
    number: string;
    rawHtml: string;
    plainText: string;
    classification: Classification;
    imageUrls: string[];
}

function parseClassification($: cheerio.CheerioAPI): Classification {
    const def: Classification = {
        class: "UNCLASSIFIED",
        containment: "N/A",
        disruption: "N/A",
        risk: "N/A",
    };

    $("div.rating-module-panel div.rating-module-tier-row").each((_, row) => {
        const label = $(row).find("div.rating-module-tier-header").text().trim().toLowerCase();
        const value = $(row).find("div.rating-module-tier-value").text().trim();
        if (label.includes("class")) def.class = value;
        else if (label.includes("containment")) def.containment = value;
        else if (label.includes("disruption")) def.disruption = value;
        else if (label.includes("risk")) def.risk = value;
    });

    if (def.class === "UNCLASSIFIED") {
        const infoPanel = $("div.page-info-panel, div.rate-box-with-creditbox");
        if (infoPanel.length) {
            const text = infoPanel.text();
            const classMatch = text.match(/(?:Object\s+)?Class:\s*(.+?)(?:,|\n|$)/i);
            if (classMatch) def.class = classMatch[1].trim();
            const containMatch = text.match(/Containment(?:\s+Class)?:\s*(.+?)(?:,|\n|$)/i);
            if (containMatch) def.containment = containMatch[1].trim();
            const disruptMatch = text.match(/Disruption(?:\s+Class)?:\s*(.+?)(?:,|\n|$)/i);
            if (disruptMatch) def.disruption = disruptMatch[1].trim();
            const riskMatch = text.match(/Risk(?:\s+Class)?:\s*(.+?)(?:,|\n|$)/i);
            if (riskMatch) def.risk = riskMatch[1].trim();
        }
    }

    if (def.class === "UNCLASSIFIED") {
        const creditBox = $("div.rate-box-with-creditbox");
        if (creditBox.length) {
            const text = creditBox.text();
            const classMatch = text.match(/(?:Object\s+)?Class:\s*(.+?)(?:[\n,]|$)/i);
            if (classMatch) def.class = classMatch[1].trim();
        }
    }

    // Fallback: extract from article content (classic format)
    if (def.class === "UNCLASSIFIED") {
        const pageText = $("#page-content").text();
        const classMatch = pageText.match(/Object\s+Class:\s*(.+?)(?:\[|<\/|\.|,|\n|$)/i);
        if (classMatch) {
            def.class = classMatch[1].trim();
            const containMatch = pageText.match(/Containment(?:\s+Class)?:\s*(.+?)(?:\[|<\/|\.|,|\n|$)/i);
            if (containMatch) def.containment = containMatch[1].trim();
            const disruptMatch = pageText.match(/Disruption(?:\s+Class)?:\s*(.+?)(?:\[|<\/|\.|,|\n|$)/i);
            if (disruptMatch) def.disruption = disruptMatch[1].trim();
            const riskMatch = pageText.match(/Risk(?:\s+Class)?:\s*(.+?)(?:\[|<\/|\.|,|\n|$)/i);
            if (riskMatch) def.risk = riskMatch[1].trim();
        }
    }

    return def;
}

function parseImages($: cheerio.CheerioAPI): string[] {
    const urls: string[] = [];
    $("div.scp-image-block img, div#page-content img").each((_, img) => {
        const src = $(img).attr("src");
        if (src) {
            const full = src.startsWith("http") ? src : `https://scp-wiki.wikidot.com${src.startsWith("/") ? "" : "/"}${src}`;
            urls.push(full);
        }
    });
    return urls;
}

function parseContent($: cheerio.CheerioAPI): { rawHtml: string; plainText: string } {
    const content = $("#page-content");
    if (!content.length) return { rawHtml: "", plainText: "" };

    const clone = content.clone();
    clone.find("div.license-area, div.footnotes-footer, div.page-info-panel, div.rating-module-panel").remove();

    const rawHtml = clone.html() || "";

    let clean = rawHtml
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<p[^>]*>/gi, "")
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<li[^>]*>/gi, "  - ")
        .replace(/<\/li>/gi, "\n")
        .replace(/<strong>/gi, "")
        .replace(/<\/strong>/gi, "")
        .replace(/<em>/gi, "")
        .replace(/<\/em>/gi, "")
        .replace(/<a[^>]*>(.*?)<\/a>/gi, "$1")
        .replace(/<[^>]*>/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ")
        .trim();

    clean = stripWikidot(clean);

    return { rawHtml, plainText: clean };
}

export async function fetchAndParseArticle(query: string): Promise<ArticleData> {
    const url = `https://scp-wiki.wikidot.com/${query}`;

    const response = await fetch(url, {
        headers: {
            "User-Agent": "SCP-DB-Viewer/1.0 (Electron; Terminal; Research)",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
    });
    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $("div#page-title").text().trim() || query;
    const number = query;
    const { rawHtml, plainText } = parseContent($);
    const classification = parseClassification($);
    const imageUrls = parseImages($);

    return { title, number, rawHtml, plainText, classification, imageUrls };
}

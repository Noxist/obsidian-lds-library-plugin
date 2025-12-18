import { ConferenceTalkData } from "@/types";

// Added 'createLink' parameter (defaults to false)
export function toCalloutString(talk: ConferenceTalkData, createLink = false) {
    const { url, title, author, content, year, month } = talk;

    const header = `>[!ldslib] [${title}](${url})`;
    const body = content.map((p) => `> ${p}`).join("\n>\n");
    const monthText = [month === 4 ? "April" : "October", year].join(" ");
    
    // Start the byline with standard info
    const bylineData = [author.name, author.role, monthText];

    // IF bidirectional links are enabled, add the connection data
    if (createLink) {
        bylineData.push("---"); // Separator
        bylineData.push(`[[${title} - ${author.name}]]`); // The Graph Node Link
        bylineData.push("#conference"); // The Tag
        bylineData.push("Topic: [[ ]]"); // The Topic Selector
    }

    const byline = ["[!ldslib-byline]", ...bylineData]
        .map((s) => `>> ${s}`)
        .join("\n");

    return [header, body, byline, ""].join("\n");
}

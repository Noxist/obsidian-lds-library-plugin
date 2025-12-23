import { AvailableLanguage } from "@/lang";
import { bookData } from "@/utils/config";
import { fetchScripture } from "@/utils/scripture";

export class VerseSuggestion {
    public text: string;
    public previewText: string;
    private bookTitleInLanguage: string;
    private verseIds: string;
    private url: string;

    private constructor(
        public book: string,
        public chapter: number,
        public verseString: string,
        public lang: AvailableLanguage,
    ) {
        this.verseIds = verseString
            .split(",")
            .map((range) =>
                range.split("-").map((verse) => `p${verse}`).join("-"),
            )
            .join(",");
    }

    static async create(
        book: string,
        chapter: number,
        verseString: string,
        lang: AvailableLanguage,
    ) {
        const suggestion = new VerseSuggestion(book, chapter, verseString, lang);
        await suggestion.loadVerse();
        return suggestion;
    }

    // --- CHANGED: Added createLink parameter (defaults to true) ---
    public getReplacement(createLink = true): string {
        const range = this.verseString.replaceAll(",", ", ");
        
        // 1. The Quote Block Header
        const lines = [
            `> [!ldslib] [${this.bookTitleInLanguage}:${range}](${this.url})`,
            this.text
        ];

        // 2. The Connection Footer (The "Hub" Logic)
        if (createLink) {
            lines.push(">"); // Spacer
            
            // Create the Hub Link: [[1 Nephi 3:7]]
            // Note: If you use Windows, you might prefer `${this.chapter}.${this.verseString}` 
            const link = `[[${this.bookTitleInLanguage} ${this.chapter}:${this.verseString}]]`;
            
            lines.push(`> **Link**: ${link}`);
            lines.push(`> **Tags**: #scripture`);
            lines.push(`> **Topic**: [[ ]]`); 
        }

        lines.push(""); // Trailing newline
        return lines.join("\n");
    }

    private getUrl(volumeTitleShort: string, bookTitleShort: string): string {
        return `https://www.churchofjesuschrist.org/study/scriptures/${volumeTitleShort}/${bookTitleShort}/${this.chapter}?lang=${this.lang}&id=${this.verseIds}`;
    }

    private getShortenedName(bookTitle: string) {
        for (const [name, info] of Object.entries(bookData)) {
            if (info.names.some((name) => name.toLowerCase() === bookTitle.toLowerCase())) {
                const volume = info.volume;
                return [name, volume];
            }
        }
        return ["", ""];
    }

    private async loadVerse(): Promise<void> {
        const [bookTitleShort, volumeTitleShort] = this.getShortenedName(this.book);
        if (bookTitleShort === "" || volumeTitleShort === "")
            throw new Error(`Couldn't find book name ${this.book}`);

        this.url = this.getUrl(volumeTitleShort, bookTitleShort);
        const scriptureData = await fetchScripture(this.url);
        this.bookTitleInLanguage = scriptureData.nativeBookTitle;
        const verses = scriptureData.verses.map((_verse) => {
            const [_, verseNumber, text] = _verse.match(/^(\d+)\s*(.*)$/) ?? [null, "0", ""];
            const verse = Number(verseNumber);
            return { volumeTitleShort, bookTitleShort, chapter: this.chapter, verse, text };
        });

        this.text = verses.map(({ verse, text }) => `> ${verse} ${text}`).join("\n");
        this.previewText = verses.map(({ verse, text }) => `${verse} ${text}`).join("\n");
    }

    public render(el: HTMLElement): void {
        const outer = el.createDiv({ cls: "obr-suggester-container" });
        outer.createDiv({ cls: "obr-shortcode" }).setText(this.previewText);
    }
}

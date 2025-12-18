import * as cheerio from "cheerio";
import {
    App,
    Editor,
    EditorPosition,
    EditorSuggest,
    EditorSuggestContext,
    EditorSuggestTriggerInfo,
    requestUrl,
    TFile,
} from "obsidian";
import LdsLibraryPlugin from "@/LdsLibraryPlugin";
import { AvailableLanguage, isAvailableLanguage } from "@/lang";
import { SpinnerModal } from "@/ui/SpinnerModal";
import { TalkParagraphPicker } from "@/ui/TalkParagraphPicker";
import { TalkSuggestion, TalkSuggestModal } from "@/ui/TalkSuggestModal";
import { BASE_URL, getConferenceTalkListUrl } from "@/utils/api";
import { toCalloutString } from "@/utils/general-conference";
import { SingleSuggestion } from "./SingleSuggestion";

const CONF_REG =
    /^:(?:\[(\w{3})\]\s+)?([aA]pril|[oO]ctober|[aA]pr|[oO]ct)\s+(\d{4}):$/;
type ConferenceInfo = {
    year: number;
    month: 4 | 10;
    language: AvailableLanguage;
};
type ConferencePromptSuggestion = SingleSuggestion<ConferenceInfo>;
export class ConferenceSuggester extends EditorSuggest<ConferencePromptSuggestion> {
    public app: App;

    constructor(public plugin: LdsLibraryPlugin) {
        super(plugin.app);
        this.app = plugin.app;
    }

    onTrigger(
        cursor: EditorPosition,
        editor: Editor,
        _file: TFile | null,
    ): EditorSuggestTriggerInfo | null {
        const currentContent = editor
            .getLine(cursor.line)
            .substring(0, cursor.ch);
        const match = currentContent.match(CONF_REG)?.[0] ?? "";

        if (!match) return null;

        return {
            start: {
                line: cursor.line,
                ch: currentContent.lastIndexOf(match),
            },
            end: cursor,
            query: match,
        };
    }

    // ... existing imports ...
// Only change is in the selectSuggestion method below

    async selectSuggestion(
        suggestion: ConferencePromptSuggestion,
        _evt: MouseEvent | KeyboardEvent,
    ): Promise<void> {
        if (!this.context) return;

        const { editor, start, end } = this.context;
        const { year, month, language } = suggestion.data;
        const url = getConferenceTalkListUrl(year, month, language);
        
        const spinnerModal = new SpinnerModal(this.app);
        spinnerModal.open();

        let talks: TalkSuggestion[];
        try {
            const response = await requestUrl({ url, method: "GET" });
            const $ = cheerio.load(response.json.content.body);
            let talkListElements = $("nav > ul > li > ul > li[data-content-type='general-conference-talk'] > a");

            if (talkListElements.length === 0)
                talkListElements = $("nav > ul > li > ul > li > a");

            talks = talkListElements
                .map((_, el) => {
                    const title = $(el).find("p.title").text();
                    const author = $(el).find("p.primaryMeta").text();
                    const _href = $(el).attr("href") ?? "";
                    const match = _href.match(/\/study(.*)\?.*/);
                    if (match === null) throw new Error(`${_href} is not a valid resource path`);
                    const href = match[1];
                    return { title, author, href };
                })
                .get();
        } catch (e) {
            console.error(e);
            return;
        } finally {
            spinnerModal.close();
        }

        new TalkSuggestModal(this.app, talks, ({ title, href }) => {
            new TalkParagraphPicker(
                this.app,
                href,
                language,
                ({ start: startId, range, content, author }) => {
                    const url = `${BASE_URL}${href}?lang=${language}&id=${range}#${startId}`;
                    
                    // UPDATED: Pass the bidirectionalLinks setting
                    const callout = toCalloutString(
                        { url, title, author, content, year, month },
                        this.plugin.settings.bidirectionalLinks 
                    );

                    editor.replaceRange(callout, start, end);
                },
            ).open();
        }).open();
    }
}

import { AvailableLanguage } from "@/lang";

export interface LdsLibrarySettings {
    language: AvailableLanguage;
    createChapterLink: boolean;
    bidirectionalLinks: boolean;
}

export const DEFAULT_SETTINGS: LdsLibrarySettings = {
    language: "eng",
    createChapterLink: false,
    bidirectionalLinks: true, // <--- CHANGED TO TRUE
};

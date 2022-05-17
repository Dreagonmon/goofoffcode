"use strict"
const backend = require(".");
const fs = require("fs/promises");
const fs_const = require("fs").constants;

const REG_CHAPTER = /^.{0,32}第?\s{0,4}[0-9零一二三四五六七八九十百千万]{1,10}\s{0,4}[章节篇][\s\n\r]{1,4}.{0,32}$/gm;
const FALLBACK_PAGE_SIZE = 5000;

class TxtBook extends backend.AbstractBook {
    /** @type {string} */
    #bookPath;
    /** @type {string} */
    #bookmarkPath;
    /** @type {string} */
    #buffer = "";
    /** @type {string} */
    #pageText = "";
    /** @type {number} */
    #position = 0;
    /** @type {Array<{chapter: string, position: number}>} */
    #chapters = [];
    /** @type {BufferEncoding} */
    #encoding = "utf8";
    /**
     * 
     * @param {string} bookPath 
     * @param {BufferEncoding} encoding 
     */
    constructor(bookPath, encoding="utf8") {
        super();
        this.#bookPath = bookPath;
        this.#bookmarkPath = bookPath+".bmk";
        this.#encoding = encoding;
    }
    async load(maxLength) {
        await fs.access(this.#bookPath, fs_const.R_OK);
        this.#buffer = await fs.readFile(this.#bookPath, { encoding: this.#encoding });
        this.#buffer = this.#buffer.replace(/\r/g, "\n").replace(/\n+/g, "\n");
        // read bookmark
        try {
            await fs.access(this.#bookmarkPath, fs_const.W_OK | fs_const.R_OK);
            const cfgJson = await fs.readFile(this.#bookmarkPath, { encoding: "utf8" });
            const cfg = JSON.parse(cfgJson);
            this.#position = cfg["position"];
        } catch {
            this.#position = 0;
        }
        // devided chapters
        /** @type {RegExpExecArray|null} */
        let res = null;
        this.#chapters.push({
            chapter: this.#bookPath,
            position: 0,
        });
        do {
            //
            res = REG_CHAPTER.exec(this.#buffer);
            if (res){
                this.#chapters.push({
                    chapter: res[0],
                    position: res.index,
                })
            }
        } while (res && res.length > 0)
        // devided by length
        if (this.#chapters.length < 10+1) {
            let chapterName = 1;
            for (let i=0; i<this.#buffer.length; i+=FALLBACK_PAGE_SIZE) {
                this.#chapters.push({
                    chapter: chapterName.toString(),
                    position: i,
                })
                chapterName += 1;
            }
        }
        await this.pageDown(maxLength);
    }
    async save() {
        try {
            const cfg = {
                position: this.#position,
            };
            const cfgJson = JSON.stringify(cfg);
            await fs.writeFile(this.#bookmarkPath, cfgJson, { encoding: "utf8" })
        } catch {
            this.#position = 0;
        }
    }
    async close() {
        await this.save();
    }
    async currentPage() {
        return this.#pageText.trim();
    }
    async pageUp(maxLength) {
        const endOffset = this.#position;
        if (endOffset <= 0) {
            return;
        }
        let startOffset = this.#buffer.lastIndexOf("\n", endOffset - 2) + 1;
        if (startOffset <= 0 || endOffset - startOffset > maxLength){ // last \n + 1, so <= 0
            startOffset = endOffset - maxLength;
        }
        this.#position = Math.max(startOffset, 0);
        this.#pageText = this.#buffer.substring(startOffset, endOffset);
    }
    #loadNextPage(startOffset, maxLength) {
        if (startOffset >= this.#buffer.length) {
            return;
        }
        let endOffset = this.#buffer.indexOf("\n", startOffset) + 1;
        if (endOffset < 0 || endOffset - startOffset > maxLength) {
            endOffset = startOffset + maxLength;
        }
        this.#position = Math.min(startOffset, this.#buffer.length);
        this.#pageText = this.#buffer.substring(startOffset, endOffset);
    }
    async pageDown(maxLength) {
        const startOffset = this.#position + this.#pageText.length;
        return this.#loadNextPage(startOffset, maxLength);
    }
    async getChapterList() {
        return this.#chapters.map((cpt) => cpt.chapter);
    }
    async jumpToChapter(chapterIndex, maxLength) {
        if (chapterIndex < 0 || chapterIndex >= this.#chapters.length) {
            return;
        }
        const startOffset = this.#chapters[chapterIndex].position;
        this.#loadNextPage(startOffset, maxLength);
    }
}

const vscodeOpenTxtBook = async () => {
    const vscode = require('vscode');
    const uri = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        filters: {
            "Text Book": ["txt"],
        },
    });
    if (!uri) {
        return null;
    }
    const filePath = uri[0].fsPath;
    const selectEncoding = await vscode.window.showQuickPick(["utf8", "gb18030", "big5"], {
        canPickMany: false,
        title: "Text File Encoding",
    });
    if (!selectEncoding) {
        return null;
    }
    // @ts-ignore
    return new TxtBook(filePath, selectEncoding);
}

module.exports = {
	TxtBook,
    vscodeOpenTxtBook,
}

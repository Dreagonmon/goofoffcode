"use strict"
const backend = require(".");
const fetch = require("node-fetch");

class LegadoBook extends backend.AbstractBook {
    /** @type {string} */
    #serverPath;
    /** @type {string} */
    #buffer = "";
    /** @type {string} */
    #pageText = "";
    /** @type {Array<{chapter: string, position: number}>} */
    #chapters = [];
    /** @type {{name?: string, author?: string, bookUrl?: string, chapterIndex?: number, chapterPos?: number}} */
    #bookListItem = {};
    /**
     * 
     * @param {string} serverPath 
     */
    constructor(serverPath) {
        super();
        this.#serverPath = serverPath;
    }
    async getBookList() {
        const resp = await (await fetch(`${this.#serverPath}/getBookshelf`, {
            headers: {
                Accept: "application/json",
            },
        })).json();
        /** @type {Array} */
        const bookListRaw = resp.data;
        return bookListRaw.map((bookItem) => {
            return {
                name: bookItem.name,
                author: bookItem.author,
                bookUrl: bookItem.bookUrl,
                chapterIndex: bookItem.durChapterIndex,
                chapterPos: bookItem.durChapterPos,	
            };
        });
    }
    async openBook(bookListItem) {
        this.#bookListItem = bookListItem;
        const url = `${this.#serverPath}/getChapterList?url=`+encodeURIComponent(bookListItem.bookUrl);
        const resp = await (await fetch(url, {
            headers: {
                Accept: "application/json",
            },
        })).json();
        /** @type {Array} */
        const chapterList = resp.data;
        this.#chapters = chapterList.map((chapterItem) => {
            return {
                chapter: chapterItem.title,
                position: chapterItem.index,
            };
        });
        await this.#loadChapter(bookListItem.chapterIndex);
    }
    async load(maxLength) {
        await this.#loadNextPage(this.#bookListItem.chapterPos, maxLength);
    }
    async save() {
        //
    }
    async close() {
        await this.save();
    }
    async currentPage() {
        return this.#pageText.trim();
    }
    async pageUp(maxLength) {
        const endOffset = this.#bookListItem.chapterPos;
        if (endOffset <= 0) {
            return;
        }
        let startOffset = this.#buffer.lastIndexOf("\n", endOffset - 2) + 1;
        if (startOffset <= 0 || endOffset - startOffset > maxLength){ // last \n + 1, so <= 0
            startOffset = endOffset - maxLength;
        }
        this.#bookListItem.chapterPos = Math.max(startOffset, 0);
        this.#pageText = this.#buffer.substring(startOffset, endOffset);
    }
    async #loadNextPage(startOffset, maxLength) {
        if (startOffset >= this.#buffer.length) {
            return;
        }
        let endOffset = this.#buffer.indexOf("\n", startOffset) + 1;
        if (endOffset < 0 || endOffset - startOffset > maxLength) {
            endOffset = startOffset + maxLength;
        }
        this.#bookListItem.chapterPos = Math.min(startOffset, this.#buffer.length);
        this.#pageText = this.#buffer.substring(startOffset, endOffset);
    }
    async pageDown(maxLength) {
        const startOffset = this.#bookListItem.chapterPos + this.#pageText.length;
        return await this.#loadNextPage(startOffset, maxLength);
    }
    async getChapterList() {
        return this.#chapters.map((cpt) => cpt.chapter);
    }
    async #loadChapter(index) {
        const url = `${this.#serverPath}/getBookContent?url=`+encodeURIComponent(this.#bookListItem.bookUrl)+"&index="+encodeURIComponent(index);
        const resp = await (await fetch(url, {
            headers: {
                Accept: "application/json",
            },
        })).json();
        this.#bookListItem.chapterIndex = index;
        this.#bookListItem.chapterPos = 0;
        this.#buffer = resp.data;
    }
    async jumpToChapter(chapterIndex, maxLength) {
        if (chapterIndex < 0 || chapterIndex >= this.#chapters.length) {
            return;
        }
        const index = this.#chapters[chapterIndex].position;
        await this.#loadChapter(index);
        await this.#loadNextPage(this.#bookListItem.chapterPos, maxLength);
    }
}

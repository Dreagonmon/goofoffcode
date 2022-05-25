"use strict"
const backend = require("./backend");
const fetch = require("node-fetch");

class LegadoBook extends backend.AbstractBook {
    /** @type {string} */
    #serverPath;
    /** @type {string} */
    #buffer = "";
    /** @type {string} */
    #pageText = "";
    /** @type {number} */
    #pageTextSize = 0;
    /** @type {Array<{chapter: string, position: number}>} */
    #chapters = [];
    /** @type {{name?: string, author?: string, bookUrl?: string, chapterIndex?: number, chapterPos?: number, chapterTitle?: string}} */
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
                "Accept": "application/json",
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
                chapterTitle: bookItem.durChapterTitle,
            };
        });
    }
    async openBook(bookListItem) {
        this.#bookListItem = bookListItem;
        const url = `${this.#serverPath}/getChapterList?url=`+encodeURIComponent(bookListItem.bookUrl);
        const resp = await (await fetch(url, {
            headers: {
                "Accept": "application/json",
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
        await this.#loadChapter(bookListItem.chapterIndex, bookListItem.chapterTitle);
    }
    async load(maxLength) {
        await this.#loadNextPage(this.#bookListItem.chapterPos, maxLength);
    }
    async save() {
        await fetch(`${this.#serverPath}/saveBookProgress`, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                author: this.#bookListItem.author,
                durChapterIndex: this.#bookListItem.chapterIndex,
                durChapterPos: this.#bookListItem.chapterPos,
                durChapterTime:	new Date().getTime(),
                durChapterTitle: this.#bookListItem.chapterTitle,
                name: this.#bookListItem.name,
            }),
        });
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
            if (this.#bookListItem.chapterIndex <= 0) {
                return;
            }
            const chapterIndex = this.#bookListItem.chapterIndex - 1;
            await this.#loadChapter(chapterIndex, await this.#getChapterTitle(chapterIndex));
            this.#bookListItem.chapterPos = this.#buffer.length;
            this.#pageText = await this.#getChapterTitle(chapterIndex);;
            this.#pageTextSize = 0;
            return;
        }
        let startOffset = this.#buffer.lastIndexOf("\n", endOffset - 2) + 1;
        if (startOffset <= 0 || endOffset - startOffset > maxLength){ // last \n + 1, so <= 0
            startOffset = endOffset - maxLength;
        }
        this.#bookListItem.chapterPos = Math.max(startOffset, 0);
        this.#pageText = this.#buffer.substring(startOffset, endOffset);
        this.#pageTextSize = this.#pageText.length;
    }
    async #loadNextPage(startOffset, maxLength) {
        if (startOffset >= this.#buffer.length) {
            const chapterIndex = this.#bookListItem.chapterIndex + 1;
            if (chapterIndex >= this.#chapters.length) {
                return;
            }
            await this.#loadChapter(chapterIndex, await this.#getChapterTitle(chapterIndex));
            this.#pageText = await this.#getChapterTitle(chapterIndex);
            this.#pageTextSize = 0;
            return;
        }
        let endOffset = this.#buffer.indexOf("\n", startOffset) + 1;
        if (endOffset <= 0 || endOffset - startOffset > maxLength) {
            endOffset = Math.min(startOffset + maxLength, this.#buffer.length);
        }
        this.#bookListItem.chapterPos = Math.min(startOffset, this.#buffer.length);
        this.#pageText = this.#buffer.substring(startOffset, endOffset);
        this.#pageTextSize = this.#pageText.length;
    }
    async pageDown(maxLength) {
        const startOffset = this.#bookListItem.chapterPos + this.#pageTextSize;
        return await this.#loadNextPage(startOffset, maxLength);
    }
    async getChapterList() {
        return this.#chapters.map((cpt) => cpt.chapter);
    }
    async #getChapterTitle(index) {
        if (index >= 0 && index < this.#chapters.length) {
            // fast search
            const chapter = this.#chapters[index];
            if (chapter.position === index) {
                return chapter.chapter;
            }
        }
        for (const chapter of this.#chapters) {
            if (chapter.position === index) {
                return chapter.chapter;
            }
        }
        return index.toString();
    }
    async #loadChapter(index, title) {
        const url = `${this.#serverPath}/getBookContent?url=`+encodeURIComponent(this.#bookListItem.bookUrl)+"&index="+encodeURIComponent(index);
        const resp = await (await fetch(url, {
            headers: {
                "Accept": "application/json",
            },
        })).json();
        this.#bookListItem.chapterIndex = index;
        this.#bookListItem.chapterPos = 0;
        this.#bookListItem.chapterTitle = title;
        this.#buffer = resp.data;
    }
    async jumpToChapter(chapterIndex, maxLength) {
        if (chapterIndex < 0 || chapterIndex >= this.#chapters.length) {
            return;
        }
        const index = this.#chapters[chapterIndex].position;
        const title = this.#chapters[chapterIndex].chapter;
        await this.#loadChapter(index, title);
        await this.#loadNextPage(this.#bookListItem.chapterPos, maxLength);
    }
}

// test script
const main = async () => {
    const readline = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout
    });
    const input = (qst) => {
        return new Promise((resolve) => {
            readline.question(qst, (ans) => {resolve(ans)});
        });
    }
    const book = new LegadoBook("http://192.168.31.87:8088");
    const bookList = await book.getBookList();
    await book.openBook(bookList[6]);
    await book.load();
    let loop = true;
    while (loop) {
        const cmd = await input("(q)uit|(s)how|(j)ump|(<)PageUp|(>)PageDown|");
        switch (cmd) {
            case "q":
                loop = false;
                break;
            case "s":
                console.log(await book.currentPage());
                break;
            case "j":
                const lst = await book.getChapterList();
                const index = Number.parseInt(await input(`select chapter between 0 ~ ${lst.length-1}: `));
                console.log(`jumping: ${lst[index]}`);
                await book.jumpToChapter(index, 80);
                console.log(await book.currentPage());
                break;
            case "<":
                await book.pageUp(80);
                console.log(await book.currentPage());
                break;
            case ">":
                await book.pageDown(80);
                console.log(await book.currentPage());
                break;
        }
    }
    await book.save();
    await book.close();
    console.log("======== end ========");
    readline.close();
}
main();

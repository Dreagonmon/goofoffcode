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
                Accept: "application/json",
            },
        })).json();
        /** @type {Array} */
        const bookListRaw = resp.data;
        console.log(bookListRaw[0])
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
        this.#bookListItem.chapterTitle = ""; // TODO: 在章节列表里面搜索index -> title
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

// test script
const main = async () => {
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    const input = (qst) => {
        return new Promise((resolve) => {
            readline.question(qst, (ans) => {resolve(ans)});
        });
    }
    const book = new LegadoBook("http://192.168.86.100:8088");
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

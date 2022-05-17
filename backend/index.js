
class AbstractBook {
    constructor() {}
    /**
     * @return {Promise<string>}
     */
    async currentPage() { return ""; }
    /**
     * @param {number} maxLength 
     */
    async pageUp(maxLength) {}
    /**
     * @param {number} maxLength 
     */
    async pageDown(maxLength) {}
    /**
     * @return {Promise<Array<string>>}
     */
    async getChapterList() { return []; }
    /**
     * @param {number} chapterIndex
     * @param {number} maxLength 
     */
    async jumpToChapter(chapterIndex, maxLength) {}
    /**
     * @param {number} maxLength 
     */
    async load(maxLength) {}
    async save() {}
    async close() {}
}

module.exports = {
	AbstractBook,
}

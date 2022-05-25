// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const AbstractBook = require("./backend").AbstractBook;
const { vscodeOpenTxtBook } = require("./backend/txtbook");
const { vscodeOpenLegadoBook } = require('./backend/legado');

const TEXT_LENGTH_LIMIT = 1024 * 1024 * 1024;
/** @type {AbstractBook | null} */
let book = null;

const getPageContent = async () => {
	if (book){
		return await book.currentPage();
	}
	return "Please open a book.";
}

/**
 * replace text in the current editor
 * @param {vscode.TextEditor} textEditor 
 * @param {string | null} [replaceText=null]
 */
const replaceContent = async (textEditor, replaceText=null, showWarning=true) => {
	const conf = vscode.workspace.getConfiguration("goofoffcode");
	if (!conf.get("enable")) {
		return;
	}
	const goofoffPrefix = conf.get("marker.prefix");
	const goofoffPostfix = conf.get("marker.postfix");
	if (textEditor.document.getText().length > TEXT_LENGTH_LIMIT) {
		if (showWarning) {
			vscode.window.showWarningMessage("This document is too big, please use a smaller one.");
		}
		return;
	}
	if (replaceText === null) {
		replaceText = await getPageContent();
	}
	const text = textEditor.document.getText();
	const startIndex = text.indexOf(goofoffPrefix) + goofoffPrefix.length;
	const endIndex = text.indexOf(goofoffPostfix);
	if (startIndex < goofoffPrefix.length || endIndex < 0 || startIndex > endIndex) {
		if (showWarning) {
			vscode.window.showWarningMessage(`Please place the marker "${goofoffPrefix}" and "${goofoffPostfix}" correctly`);
		}
		return;
	}
	const start = textEditor.document.positionAt(startIndex);
	const end = textEditor.document.positionAt(endIndex);
	await textEditor.edit((edit) => edit.replace(new vscode.Range(start, end), replaceText));
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	context.subscriptions.push(vscode.commands.registerTextEditorCommand('goofoffcode.show', async function (textEditor, edit) {
		await replaceContent(textEditor);
	}));
	context.subscriptions.push(vscode.commands.registerTextEditorCommand('goofoffcode.clear', async function (textEditor, edit) {
		const clearText = vscode.workspace.getConfiguration("goofoffcode").get("clearText");
		await replaceContent(textEditor, clearText);
	}));
	context.subscriptions.push(vscode.commands.registerTextEditorCommand('goofoffcode.pageup', async function (textEditor, edit) {
		const conf = vscode.workspace.getConfiguration("goofoffcode");
		if (!conf.get("enable")) {
			return;
		}
		if (book) {
			await book.pageUp(conf.get("maxTextLength"));
			await replaceContent(textEditor);
		}
	}));
	context.subscriptions.push(vscode.commands.registerTextEditorCommand('goofoffcode.pagedown', async function (textEditor, edit) {
		const conf = vscode.workspace.getConfiguration("goofoffcode");
		if (!conf.get("enable")) {
			return;
		}
		if (book) {
			await book.pageDown(conf.get("maxTextLength"));
			await replaceContent(textEditor);
		}
	}));
	context.subscriptions.push(vscode.commands.registerTextEditorCommand('goofoffcode.jump', async function (textEditor, edit) {
		const conf = vscode.workspace.getConfiguration("goofoffcode");
		if (!conf.get("enable")) {
			return;
		}
		if (book) {
			const chapterList = await book.getChapterList();
			const pickOptions = chapterList.map((chapter, index) => {
				return {
					label: chapter,
					indexInChapterList: index,
				};
			});
			const selectChapter = await vscode.window.showQuickPick(pickOptions, {
				canPickMany: false,
				title: "Jump To Chapter",
			});
			if (!selectChapter) {
				return;
			}
			await book.jumpToChapter(selectChapter.indexInChapterList, conf.get("maxTextLength"));
			await replaceContent(textEditor, null, false);
		}
	}));
	context.subscriptions.push(vscode.commands.registerCommand("goofoffcode.open.txt", async function () {
		const conf = vscode.workspace.getConfiguration("goofoffcode");
		if (!conf.get("enable")) {
			return;
		}
		const bookOrNot = await vscodeOpenTxtBook();
		if (!bookOrNot) {
			return;
		}
		book = bookOrNot;
		await book.load(conf.get("maxTextLength"));
		await vscode.window.showInformationMessage("Book opened successfully.")
	}));
	context.subscriptions.push(vscode.commands.registerCommand("goofoffcode.open.legado", async function () {
		const conf = vscode.workspace.getConfiguration("goofoffcode");
		if (!conf.get("enable")) {
			return;
		}
		const bookOrNot = await vscodeOpenLegadoBook();
		if (!bookOrNot) {
			return;
		}
		book = bookOrNot;
		await book.load(conf.get("maxTextLength"));
		await vscode.window.showInformationMessage("Book opened successfully.")
	}));
}

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate,
}

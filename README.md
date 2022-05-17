# goofoffcode README

This extension insert the text into your code between a pair of special markers, which means you can read novels anywhere in your code.

## Features

* Read novels in your code.
* You can customize the replace markers. 
* Open .txt novels.
* Jump to chapter.

## Commands

Open the vscode commands panel (`Ctrl + Shift + P` by default), and use it directly.

Tips: you can change the keybindings in your vscode settings.

* `GooOffCode: Open TXT Book`: open your .txt book
* `GooOffCode: Jump To Chapter`: jump to chapter
* `GooOffCode: Page Up`: Page Up (`Ctrl + Alt + -` by default)
* `GooOffCode: Page Down`: Page Down (`Ctrl + Alt + =` by default)
* `GooOffCode: Show`: replace the marked area with book content (`Ctrl + Alt + [Insert]` by default)
* `GooOffCode: Clear`: clear the marked area with fake text (`Ctrl + Alt + [Delete]` by default)

## Extension Settings

This extension contributes the following settings:

* `goofoffcode.enable`: enable/disable this extension
* `goofoffcode.clearText`: this text will be used to clear the marked area
* `goofoffcode.maxTextLength`: max text length whthin a line
* `goofoffcode.marker.prefix`: begin marker
* `goofoffcode.marker.postfix`: end marker

## Known Issues

* lack of many features

## Release Notes

### 1.0.0

Initial release of goofoffcode

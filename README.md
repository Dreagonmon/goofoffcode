# goofoffcode README

This extension insert the text into your code between a pair of special markers, which means you can read novels anywhere in your code.

这个拓展插件能够将代码里一对特殊标记中的内容替换为特定文本，你可以在自己的代码里面看小说。

## Useage Example
* set the keybindings (at least bind for 「Clear」, 「PageUp」, 「PageDown」 commands)
* 设置快捷键（至少为「Clear」, 「PageUp」, 「PageDown」命令分配快捷键）
* open a book
* 打开一本书
* put ```a pair of``` special markers in your code (default is "|>>" and "<<|")
* 在代码里放置```一对```特殊标记（默认是"|>>" 和 "<<|"）
* use the commands and keybindings to read your book
* 使用命令和快捷键阅读


## Features

* Read novels in your code.
* You can customize the replace markers. 
* Open .txt novels.
* Jump to chapter.

## Commands

Open the vscode commands panel (`Ctrl + Shift + P` by default), and use it directly.

Tips: you can change the keybindings in your vscode settings.

* `GooOffCode: Open TXT Book`: open your .txt book
* `GooOffCode: Open Legado Book`: open your [legado](https://github.com/gedoor/legado) book on your phone (using web service)
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

### 0.0.1

Initial release of goofoffcode

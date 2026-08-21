---
author: monointerferenz
categories: Notes
date: 2026-08-22
layout: post
tags:
- macos
- terminal
title: Userdefined path in CodeKit
---

Somehow the guys over at CodeKit have managed to develop an app which uses your home directory as default with no way to change it.

So you have to do it manually.

`defaults write com.krill.CodeRunner FileViewDirectory "YOUR_PATH"`
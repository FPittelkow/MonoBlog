---
author: monointerferenz
categories: Notes
date: 2026-08-22
layout: post
tags:
- macos
- terminal
title: Userdefined path in CodeRunner
---

Somehow the guys have managed to develop an app which uses your home directory as default with no way to change it.

So you have to change the setting directly.

`defaults write com.krill.CodeRunner FileViewDirectory "YOUR_PATH"`
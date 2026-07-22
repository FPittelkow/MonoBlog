---
author: monointerferenz
categories: notes
date: 2026-07-22
layout: post
tags:
- gpg
- macos
- mail
title: GPG with Apple Mail free
---

Encrypting mails is awesome; the way is annoying.

You can use the GPGSuite with the bundled plugin, but it is only available in the Support-Plan. 
You support the project that way. 
It's really cool, do that if you can.
However, if you prefer an alternative free setup, you will need a different plugin for mail.

## Requirements
- Apple Mail (duh)
- [GPG Suite](https://gpgtools.org/) (We only use the Keychain, it's included without cost)
- [MailGPG](https://github.com/mahaupt/mailgpg)
  - [Homebrew](https://brew.sh/)

## Setup
Install all the requirements, you know the spiel. You may need to allow the MailGPG-Plugin and activate it.

Do not use the Mail-Plugin from the GPG Suite.

Use the GPG Keychain to generate your Key and to manage your keys. Upload them.

## Usage
In the Mail-Composer, you'll see a new icon. There is your new plugin.

{% picture default assets/gpg-with-apple-mail-free/GPGMail.png alt="" %}

When you use it for the first time, click in `Diagnostic` to set up the paths to your GPG installation. There is a guide.

The plugin uses the shared keys on your Mac, managed by the GPGKeychain.

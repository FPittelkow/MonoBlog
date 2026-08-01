---
author: monointerferenz
categories: notes
date: 2026-07-22
layout: post
tags:
- gpg
- macos
- mail
title: GPG with Apple Mail
---
# Encrypting Mails is Awesome 

Encrypting your email is *great* (in theory).

---

## Requirements (because “duh” just isn’t enough)

- **Apple Mail** – you already have this, so no points for effort.  
- **[GPG Suite](https://gpgtools.org/)** – we’ll pretend the bundled plugin is a *nice* bonus, even though it’s locked behind the “Support‑Plan”. Pay up if you want the easy route; otherwise, congratulations on your free‑spirit.  
- **[MailGPG](https://github.com/mahaupt/mailgpg)** – an alternative that actually works with a free setup. It needs **Homebrew** to install 

> *TL;DR*: If you’re happy paying for a “Support‑Plan”, feel free to use the GPG Suite plugin. Otherwise, you’ll need MailGPG and Homebrew.

---

## Setup (the fun part)

1. **Install everything** – AppleMail (obviously), GPG Suite (if you’re into subscription models), MailGPG via Homebrew (`brew install --cask mailgpg` or whatever the brew formula is called).  
2. **Allow & activate** the MailGPG plugin
3. **Do NOT use** the “Mail‑Plugin” that ships with GPG Suite.
4. **Key management**: generate your key (or import an existing one) using the GPG Keychain that ships with GPG Suite. Upload the public key somewhere, because strangers on the internet love receiving unsolicited encrypted blobs.  

---

## Usage

When you fire up a new message in AppleMail, you’ll notice a fresh little icon sitting pretty in the composer toolbar – that’s your newly‑installed plugin.

![GPG Mail Icon]({% picture default assets/gpg-with-apple-mail-free/GPGMail.png alt="" %})

- **First‑time setup**: hit `Diagnostic` inside the plugin, follow the guide to point it at your GPG installation.  
- The plugin will then use the **shared keys** stored in your Mac’s GPG Keychain.

---
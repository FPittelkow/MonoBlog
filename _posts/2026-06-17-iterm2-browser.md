---
layout: post
ate: 2026-05-14 Europe/Brussel
short_description: Setting a default browser for opening links in iTerm2.
categories: notes
title: Using a different browser for links in iTerm2 
---
Just a note for myself.

iTerm2 allows to easily open links with a browser. Obviously, the default browser is used.

## iTerm settings

Settings > Advanced > Put in the Bundle ID

```
Bundle ID of browser to open URLs with.
Leave empty to use system default.
```


## get Bunde ID of your browser
Quck way via Finder: Right-click on the app > Show Package Contents > Info.plist > CFBundleIdentifier

Done.

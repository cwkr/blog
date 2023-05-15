# Ein Blog mit GitHub Pages

Ich spiele seit einiger Zeit mit dem Gedanken ein Blog zu schreiben und in unregelmäßigen Abständen Artikel zu veröffentlichen. Allerdings möchte ich keine Software wie beispielsweise [WordPress](https://de.wordpress.org/) betreiben, da ich mir den administrativen Aufwand nicht antun möchte. Es gäbe natürlich die Möglichkeit einfach einen der unzähligen Blogging-Dienste zu nutzen, aber das ist mir zu gewöhnlich.

Als Softwareentwickler stellt sich mir die Frage, ob ich eine wartungsarme Lösung einfach selber entwickeln kann. Die Idee ist die Artikel in Form von [Markdown](https://commonmark.org/)-Dateien in einem [Git](https://git-scm.com/)-Repository auf [GitHub](https://github.com/) zu verwalten und mit [GitHub Pages](https://pages.github.com/) das Blog zu hosten. Ich werde ein Script schreiben müssen das die Markdown-Dateien in den HTML-Code des Blogs umwandelt bevor dieses veröffentlicht wird. Zur Veröffentlichung werde ich [GitHub Actions](https://github.com/features/actions) nutzen.

## Erste Version

Ich habe jetzt ein Script in [TypeScript](https://www.typescriptlang.org/) geschrieben, das [CommonMark.js](https://github.com/commonmark/commonmark.js/) und noch ein paar weitere JavaScript-Bibliotheken nutzt um das Blog aus den Markdown-Dateien generiert. Ausgeführt wird das Script mit [Deno](https://deno.land/) innerhalb eines GitHub Actions Workflows bei jedem Push auf den Main-Branch. Der Workflow veröffentlicht das Blog als finalen Schritt auf GitHub Pages.

Das Ergebnis eines Tages an Entwicklungsaufwand ist nun in [github.com/cwkr/blog](https://github.com/cwkr/blog) zu finden und dieser Artikel hier ist der erste meines neuen Blogs: [blog.cwkr.de](https://blog.cwkr.de/).

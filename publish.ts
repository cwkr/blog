// @deno-types="./commonmark.d.ts"
import { Parser, Node } from 'commonmark';
import Handlebars from 'handlebars';
// @deno-types="@types/csso"
import { minify } from 'csso';
import { CustomHtmlRenderer } from './custom-html-renderer.ts';


function plainText(node: Node): string {
  let text = '';
  const walker = node.walker();
  let event;
  while ((event = walker.next())) {
    if (event.entering === true && event.node.type === 'text') {
      text += event.node.literal;
    }
  }
  return text;
}

function getTitle(root: Node): string {
  const walker = root.walker();
  let event;
  while ((event = walker.next())) {
    if (event.entering === true && event.node.type === 'heading' && event.node.level === 1) {
      return plainText(event.node);
    }
  }
  return '';
}

class Article {
  constructor(public name: string,
              public title: string,
              public body: Node,
              public published: Date,
              public lastModified: Date) {

  }
}

Handlebars.registerHelper('fullDate', (date: Date) => date.toLocaleDateString('de-DE', { dateStyle: 'full' }));
Handlebars.registerHelper('isoDate', (date: Date) => date.toISOString());
Handlebars.registerHelper('shortDate', (date: Date) => date.toLocaleDateString('de-DE', { dateStyle: 'medium' }));

const articleTemplate = Handlebars.compile(await Deno.readTextFile('templates/article.hbs'));
const pageTemplate = Handlebars.compile(await Deno.readTextFile('templates/page.hbs'));

async function writePage(src: string, dst: string, title?: string): Promise<void> {
  const text = await Deno.readTextFile(src);
  const htmlBody = renderer.render(parser.parse(text));
  await Deno.writeTextFile(dst, pageTemplate({htmlBody, title}));
}

const parser = new Parser();
const renderer = new CustomHtmlRenderer();
const articles: Article[] = [];

for await (const f of Deno.readDir('.')) {
  if (f.isFile === true && f.name.endsWith('.md') === true) {
    const [published, name] = f.name.substring(0, f.name.length - 3).split('_', 2);
    if (published && name) {
      const ptime = new Date(published);
      const text = await Deno.readTextFile(f.name);
      const {mtime} = await Deno.stat(f.name);
      const body = parser.parse(text);
      const title = getTitle(body);
      const article = new Article(name, title, body, ptime, mtime ?? ptime);
      articles.push(article);
      //console.log(article);
    }
  }
}

// sort by published date descending
articles.sort((a, b) => b.published.getTime() - a.published.getTime());

for (const a of articles) {
  const targetDir = `public/${a.name}`;
  await Deno.mkdir(targetDir, { recursive: true, mode: 0o755 });
  const htmlBody = renderer.render(a.body);
  await Deno.writeTextFile(`${targetDir}/index.html`, articleTemplate({htmlBody, ...a}));
}

const cssFiles: string[] = [];
const styles: string[] = [];

for await (const f of Deno.readDir('styles')) {
  if (f.isFile === true && f.name.endsWith('.css') === true) {
    cssFiles.push(f.name);
  }
}
cssFiles.sort();
for (const filename of cssFiles) {
  styles.push(await Deno.readTextFile(`styles/${filename}`));
}

await Deno.mkdir('public/fonts', { recursive: true, mode: 0o755 });
for await (const f of Deno.readDir('fonts')) {
  if (f.isFile === true && f.name.endsWith('.woff') === true) {
    await Deno.copyFile(`fonts/${f.name}`, `public/fonts/${f.name}`);
  }
}
await Deno.mkdir('public/styles', { recursive: true, mode: 0o755 });
await Deno.writeTextFile(`public/styles/bundle.min.css`, minify(styles.join('\n'), {comments: 'exclamation'}).css);

await Deno.copyFile('favicon.ico', 'public/favicon.ico');

await writePage('impressum.md', 'public/impressum.html', 'Impressum und Datenschutz');

const htmlBody = Handlebars.compile(await Deno.readTextFile('templates/index.hbs'))(articles);
await Deno.writeTextFile('public/index.html', pageTemplate({htmlBody}));

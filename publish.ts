// @deno-types="./commonmark.d.ts"
import { Parser, Node } from 'commonmark';
import Handlebars from 'handlebars';
// @deno-types="@types/csso"
import { minify } from 'csso';
import { CustomHtmlRenderer } from './custom-html-renderer.ts';
const { stat, mkdir, readDir, readTextFile, writeTextFile, copyFile } = Deno;

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

const articleTemplate = Handlebars.compile(await readTextFile('templates/article.hbs'));
const pageTemplate = Handlebars.compile(await readTextFile('templates/page.hbs'));

async function writePage(src: string, dst: string, title?: string): Promise<void> {
  const text = await readTextFile(src);
  const htmlBody = renderer.render(parser.parse(text));
  await writeTextFile(dst, pageTemplate({htmlBody, title}));
}

const parser = new Parser();
const renderer = new CustomHtmlRenderer();
const articles: Article[] = [];

for await (const f of readDir('articles')) {
  if (f.isFile === true && f.name.endsWith('.md') === true) {
    const [published, name] = f.name.substring(0, f.name.length - 3).split('_', 2);
    if (published && name) {
      const ptime = new Date(published);
      const text = await readTextFile(`articles/${f.name}`);
      const {mtime} = await stat(`articles/${f.name}`);
      const body = parser.parse(text);
      const title = getTitle(body);
      const article = new Article(name, title, body, ptime, mtime ?? ptime);
      articles.push(article);
    }
  }
}

// sort by published date descending
articles.sort((a, b) => b.published.getTime() - a.published.getTime());

for (const a of articles) {
  const targetDir = `public/${a.name}`;
  await mkdir(targetDir, { recursive: true, mode: 0o755 });
  const htmlBody = renderer.render(a.body);
  await writeTextFile(`${targetDir}/index.html`, articleTemplate({htmlBody, ...a}));
}

const cssFiles: string[] = [];
const styles: string[] = [];

for await (const f of readDir('styles')) {
  if (f.isFile === true && f.name.endsWith('.css') === true) {
    cssFiles.push(f.name);
  }
}
cssFiles.sort();
for (const filename of cssFiles) {
  styles.push(await readTextFile(`styles/${filename}`));
}

await mkdir('public/fonts', { recursive: true, mode: 0o755 });
for await (const f of readDir('fonts')) {
  if (f.isFile === true && f.name.endsWith('.woff') === true) {
    await copyFile(`fonts/${f.name}`, `public/fonts/${f.name}`);
  }
}
await mkdir('public/styles', { recursive: true, mode: 0o755 });
await writeTextFile(`public/styles/bundle.min.css`, minify(styles.join('\n'), {comments: 'exclamation'}).css);

await copyFile('favicon.ico', 'public/favicon.ico');

await writePage('impressum.md', 'public/impressum.html', 'Impressum und Datenschutz');

const htmlBody = Handlebars.compile(await readTextFile('templates/index.hbs'))(articles);
await writeTextFile('public/index.html', pageTemplate({htmlBody}));

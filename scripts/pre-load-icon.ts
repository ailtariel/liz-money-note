import { readFileSync, readdirSync } from 'node:fs';
import type { IndexHtmlTransformContext, Plugin } from 'vite';

let idPerfix = '';
const svgTitle = /<svg([^>+].*?)>/;
const clearHeightWidth = /\s(width|height|fill|fillopacity)[\s]*=[\s]*"([^>+].*?)"/gi;
const clearFill = /\s(fill|fill-opacity)[\s]*=[\s]*"([^"]+)"/gi;
const hasViewBox = /(viewBox="[^>+].*?")/g;
const clearReturn = /(\r)|(\n)/g;

// find svg file
function svgFind(directory: string): string[] {
  const arr: string[] = [];
  const dirents = readdirSync(directory, { withFileTypes: true });
  for (const dirent of dirents) {
    if (dirent.isDirectory()) arr.push(...svgFind(directory + dirent.name + '/'));
    else {
      const svg = readFileSync(directory + dirent.name)
        .toString()
        .replace(clearReturn, '')
        .replace(svgTitle, (_match: string, attributes: string) => {
          let width = 0,
            height = 0,
            content = attributes.replace(
              clearHeightWidth,
              (_source: string, key: string, value: string) => {
                if (key === 'width') width = Number(value);
                else if (key === 'height') height = Number(value);
                return '';
              }
            );
          if (!hasViewBox.test(attributes)) content += `viewBox="0 0 ${width} ${height}"`;
          return `<symbol id="${idPerfix}-${dirent.name.replace('.svg', '')}" ${content}>`;
        })
        .replace('</svg>', '</symbol>')
        .replace(clearFill, '');
      arr.push(svg);
    }
  }
  return arr;
}

// create svg
export const createSvg = (path: string, perfix = 'icon'): Plugin | undefined => {
  if (path === '') return;
  idPerfix = perfix;
  const res = svgFind(path);
  return {
    name: 'svg-transform',
    transformIndexHtml(dom: string, _ctx?: IndexHtmlTransformContext) {
      return dom.replace(
        '<body>',
        `<body><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="position: absolute; width: 0; height: 0">${res.join(
          ''
        )}</svg>`
      );
    }
  };
};

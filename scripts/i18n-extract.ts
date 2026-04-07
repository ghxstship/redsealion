import { Project, SyntaxKind, JsxElement, StringLiteral } from 'ts-morph';
import * as fs from 'fs';
import * as path from 'path';

const project = new Project({
  tsConfigFilePath: process.cwd() + '/tsconfig.json',
});

const dir = process.cwd() + '/src/components/admin/my-tasks';
const filePaths = [dir + '/**/*.tsx', dir + '/**/*.ts'];
const sourceFiles = project.addSourceFilesAtPaths(filePaths);

for (const sf of sourceFiles) {
  console.log(`Processing: ${sf.getBaseName()}`);
  
  const jsxTextNodes = sf.getDescendantsOfKind(SyntaxKind.JsxText);
  for (const node of jsxTextNodes) {
    const text = node.getText().trim();
    if (text && text.length > 0 && !text.startsWith('{')) {
      console.log(`[JSX TEXT] Found string: "${text}"`);
    }
  }

  const stringLiterals = sf.getDescendantsOfKind(SyntaxKind.StringLiteral);
  for (const node of stringLiterals) {
    const parent = node.getParent();
    if (parent) {
      if (parent.getKind() === SyntaxKind.JsxAttribute) {
        console.log(`[JSX ATTRIBUTE] Found string: "${node.getText()}"`);
      }
    }
  }
}

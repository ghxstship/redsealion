#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

let files;
try {
  files = execSync(
    `grep -rl 'text-2xl font-semibold tracking-tight text-foreground' src/app/app/ --include="page.tsx" --include="*.tsx"`,
    { cwd: ROOT, encoding: 'utf-8' }
  ).trim().split('\n').filter(Boolean);
} catch (e) {
  files = e.stdout ? e.stdout.trim().split('\n').filter(Boolean) : [];
}

// Filter out files that already import PageHeader
files = files.filter(f => {
  const content = fs.readFileSync(path.resolve(ROOT, f), 'utf-8');
  return !content.includes("import PageHeader from");
});

console.log(`Processing ${files.length} files...\n`);

let success = 0, skipped = 0;

for (const relFile of files) {
  const file = path.resolve(ROOT, relFile);
  let content = fs.readFileSync(file, 'utf-8');
  const original = content;

  // Step 1: Add PageHeader import after the last existing import line
  const lines = content.split('\n');
  let lastImportLine = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^import\s/.test(lines[i]) || (lines[i].startsWith("import ") || lines[i].includes(" from '"))) {
      if (lines[i].includes('from ')) lastImportLine = i;
    }
  }
  
  if (lastImportLine === -1) {
    console.log(`⏭  ${relFile} (no imports found)`);
    skipped++;
    continue;
  }
  
  lines.splice(lastImportLine + 1, 0, "import PageHeader from '@/components/shared/PageHeader';");
  content = lines.join('\n');

  // Step 2: Replace the header patterns
  // The patterns all have an h1 with this specific class. We match possible containing divs.
  
  let changed = false;

  // Pattern 1: Flex wrapper with div > h1 + p + </div> + action elements + </div>
  // This is the most common: flex wrapper with title area and action buttons
  const p1 = /(?:[ \t]*{\/\*\s*Header\s*\*\/}\s*\n)?[ \t]*<div className="(?:flex[^"]*(?:mb-8|mb-6)[^"]*|(?:mb-8|mb-6)[^"]*flex[^"]*)">\s*\n\s*<div>\s*\n\s*<h1 className="text-2xl font-semibold tracking-tight text-foreground">\s*\n?\s*([\s\S]*?)\s*<\/h1>\s*\n(\s*<p className="mt-1 text-sm text-text-secondary">\s*\n?\s*([\s\S]*?)\s*<\/p>\s*\n)?\s*<\/div>\s*\n([\s\S]*?)<\/div>/g;
  
  content = content.replace(p1, (match, title, _pBlock, subtitle, actions) => {
    title = title.trim();
    subtitle = subtitle ? subtitle.trim() : '';
    actions = actions ? actions.trim() : '';
    
    // Remove wrapper divs around actions like <div className="flex gap-3">...</div>
    const actionWrapperMatch = actions.match(/^<div className="flex[^"]*">\s*\n?([\s\S]*?)\s*<\/div>$/);
    if (actionWrapperMatch) {
      actions = actionWrapperMatch[1].trim();
    }
    
    changed = true;
    
    // Build subtitle prop - handle JSX expressions
    let subtitleProp = '';
    if (subtitle) {
      if (subtitle.includes('{') || subtitle.includes('·')) {
        subtitleProp = `\n        subtitle={\`${subtitle.replace(/&middot;/g, '·').replace(/`/g, '\\`')}\`}`;
      } else {
        subtitleProp = `\n        subtitle="${subtitle}"`;
      }
    }
    
    if (actions) {
      return `<PageHeader\n        title="${title}"${subtitleProp}\n      >\n        ${actions}\n      </PageHeader>`;
    }
    return `<PageHeader\n        title="${title}"${subtitleProp}\n      />`;
  });

  // Pattern 2: Simple mb-8 div with h1 + p (no flex, no actions)
  const p2 = /(?:[ \t]*{\/\*\s*Header\s*\*\/}\s*\n)?[ \t]*<div className="(?:mb-8|mb-6)">\s*\n\s*<h1 className="text-2xl font-semibold tracking-tight text-foreground">\s*\n?\s*([\s\S]*?)\s*<\/h1>\s*\n(\s*<p className="mt-1 text-sm text-text-secondary">\s*\n?\s*([\s\S]*?)\s*<\/p>\s*\n)?\s*<\/div>/g;
  
  content = content.replace(p2, (match, title, _pBlock, subtitle) => {
    title = title.trim();
    subtitle = subtitle ? subtitle.trim() : '';
    changed = true;
    
    let subtitleProp = '';
    if (subtitle) {
      if (subtitle.includes('{') || subtitle.includes('·')) {
        subtitleProp = `\n        subtitle={\`${subtitle.replace(/&middot;/g, '·').replace(/`/g, '\\`')}\`}`;
      } else {
        subtitleProp = `\n        subtitle="${subtitle}"`;
      }
    }
    return `<PageHeader\n        title="${title}"${subtitleProp}\n      />`;
  });

  // Pattern 3: mb-8 flex on same line, DIFFERENT from pattern 1 variant
  const p3 = /[ \t]*<div className="mb-8 flex items-center justify-between">\s*\n\s*<div>\s*\n\s*<h1 className="text-2xl font-semibold tracking-tight text-foreground">([\s\S]*?)<\/h1>\s*\n(\s*<p className="mt-1 text-sm text-text-secondary">\s*\n?\s*([\s\S]*?)\s*<\/p>\s*\n)?\s*<\/div>\s*\n([\s\S]*?)<\/div>/g;

  content = content.replace(p3, (match, title, _pBlock, subtitle, actions) => {
    title = title.trim();
    subtitle = subtitle ? subtitle.trim() : '';
    actions = actions ? actions.trim() : '';
    changed = true;
    
    let subtitleProp = '';
    if (subtitle) {
      if (subtitle.includes('{') || subtitle.includes('·')) {
        subtitleProp = `\n        subtitle={\`${subtitle.replace(/&middot;/g, '·').replace(/`/g, '\\`')}\`}`;
      } else {
        subtitleProp = `\n        subtitle="${subtitle}"`;
      }
    }
    
    if (actions) {
      return `<PageHeader\n        title="${title}"${subtitleProp}\n      >\n        ${actions}\n      </PageHeader>`;
    }
    return `<PageHeader\n        title="${title}"${subtitleProp}\n      />`;
  });

  // Pattern 4: Standalone h1 (no wrapper div, just an h1 sitting alone)
  if (content.includes('text-2xl font-semibold tracking-tight text-foreground')) {
    const p4 = /[ \t]*<h1 className="text-2xl font-semibold tracking-tight text-foreground">\s*([\s\S]*?)\s*<\/h1>/g;
    content = content.replace(p4, (match, title) => {
      title = title.trim();
      changed = true;
      // Detect JSX titles like {item.name}
      if (title.startsWith('{') && title.endsWith('}')) {
        return `<PageHeader title={${title.slice(1, -1)}} />`;
      }
      if (title.includes('{')) {
        // Complex JSX expression in title
        return `<PageHeader title={<>${title}</>} />`;
      }
      return `<PageHeader title="${title}" />`;
    });
  }

  if (!changed) {
    // Revert the import addition
    fs.writeFileSync(file, original);
    console.log(`⏭  ${relFile} (no pattern matched)`);
    skipped++;
    continue;
  }

  fs.writeFileSync(file, content);
  success++;
  console.log(`✅ ${relFile}`);
}

console.log(`\nDone: ${success} canonized, ${skipped} skipped`);

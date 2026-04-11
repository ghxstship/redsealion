const fs = require('fs');
const path = require('path');

const root = '/Users/julianclarkson/claude-code/xpb/redsealion/src/app/app';

function traverse(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath, callback);
    } else if (fullPath.endsWith('.tsx')) {
      callback(fullPath);
    }
  });
}

// Allow <div key=... className=...>
const REGEX1 = /<div([^>]*)className="[^"]*rounded-xl border border-border bg-background p-4[^"]*"([^>]*)>\s*<p\s+className="text-xs\s+text-text-muted">([^<]+)<\/p>\s*<p\s+className="mt-1\s+text-2xl\s+font-semibold\s+tabular-nums\s+([^"]+)">([^<]+)<\/p>\s*<\/div>/g;

const REGEX2 = /<div([^>]*)className="[^"]*rounded-xl border border-border bg-background p-4[^"]*"([^>]*)>\s*<p\s+className="text-xs\s+text-text-muted">(\{([^}]+)\}|[^<]+)<\/p>\s*<p\s+className=\{`mt-1\s+text-2xl\s+font-semibold\s+tabular-nums\s+\$\{\s*([^}]+)\s*\}\`\}>([^<]+|\{[^}]+\})<\/p>\s*<\/div>/g;

// Fallback for cases missing `mt-1`
const REGEX3 = /<div([^>]*)className="[^"]*rounded-xl border border-border bg-background p-4[^"]*"([^>]*)>\s*<p\s+className="text-xs\s+text-text-muted">([^<]+)<\/p>\s*<p\s+className="text-2xl\s+font-semibold\s+tabular-nums\s+([^"]+)">([^<]+)<\/p>\s*<\/div>/g;

function getJsxSafeValue(str) {
  if (str.startsWith('{') && str.endsWith('}')) {
    return str.substring(1, str.length - 1);
  }
  return `"${str}"`;
}

let modifiedFiles = 0;

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  // Case 1
  content = content.replace(REGEX1, (match, prefix, suffix, labelStr, colorClass, valueStr) => {
    const label = getJsxSafeValue(labelStr);
    const value = getJsxSafeValue(valueStr);
    const otherProps = [prefix.trim(), suffix.trim()].filter(Boolean).join(' ');
    
    let extraClass = '';
    if (colorClass !== 'text-foreground') {
      extraClass = ` className="[&_.text-foreground]:${colorClass}"`;
    }
    
    return `<MetricCard ${otherProps} label={${label}} value={${value}}${extraClass} />`.replace(/  +/g, ' ');
  });

  // Case 2
  content = content.replace(REGEX2, (match, prefix, suffix, fullLabelStr, dynamicLabel, colorExpr, fullValueStr) => {
    let label = dynamicLabel ? dynamicLabel : `"${fullLabelStr}"`;
    let value = fullValueStr.startsWith('{') ? fullValueStr.substring(1, fullValueStr.length - 1) : `"${fullValueStr}"`;
    const otherProps = [prefix.trim(), suffix.trim()].filter(Boolean).join(' ');

    let extraClass = '';
    if (colorExpr.includes('??')) {
      const parts = colorExpr.split('??').map(s => s.trim());
      const varName = parts[0];
      extraClass = ` className={${varName} ? \`[&_.text-foreground]:\${${varName}}\` : ''}`;
    } else {
      extraClass = ` className={\`${colorExpr}\` !== 'text-foreground' && ${colorExpr} ? \`[&_.text-foreground]:\${${colorExpr}}\` : ''}`;
    }

    return `<MetricCard ${otherProps} label={${label}} value={${value}}${extraClass} />`.replace(/  +/g, ' ');
  });

  // Case 3 (like 1 but missing mt-1)
  content = content.replace(REGEX3, (match, prefix, suffix, labelStr, colorClass, valueStr) => {
    const label = getJsxSafeValue(labelStr);
    const value = getJsxSafeValue(valueStr);
    const otherProps = [prefix.trim(), suffix.trim()].filter(Boolean).join(' ');
    
    let extraClass = '';
    if (colorClass !== 'text-foreground') {
      extraClass = ` className="[&_.text-foreground]:${colorClass}"`;
    }
    
    return `<MetricCard ${otherProps} label={${label}} value={${value}}${extraClass} />`.replace(/  +/g, ' ');
  });

  if (content !== originalContent) {
    if (!content.includes("import MetricCard")) {
      const lines = content.split('\n');
      const lastImportIdx = lines.reduce((acc, line, idx) => line.startsWith('import ') ? idx : acc, -1);
      
      if (lastImportIdx >= 0) {
        lines.splice(lastImportIdx + 1, 0, "import MetricCard from '@/components/ui/MetricCard';");
        content = lines.join('\n');
      }
    }
    
    fs.writeFileSync(filePath, content, 'utf-8');
    modifiedFiles++;
    console.log(`Updated ${filePath}`);
  }
}

traverse(root, processFile);
console.log(`Total files modified: ${modifiedFiles}`);

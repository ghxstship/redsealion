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

const REGEX1 = /<div\s+className="rounded-xl border border-border bg-background p-4">\s*<p\s+className="text-xs\s+text-text-muted">([^<]+)<\/p>\s*<p\s+className="mt-1\s+text-2xl\s+font-semibold\s+tabular-nums\s+([^"]+)">([^<]+)<\/p>\s*<\/div>/g;

const REGEX2 = /<div\s+className="rounded-xl border border-border bg-background p-4">\s*<p\s+className="text-xs\s+text-text-muted">(\{([^}]+)\}|[^<]+)<\/p>\s*<p\s+className=\{`mt-1\s+text-2xl\s+font-semibold\s+tabular-nums\s+\$\{\s*([^}]+)\s*\}\`\}>([^<]+|\{[^}]+\})<\/p>\s*<\/div>/g;

// To handle pure text vs expressions in JSX
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

  // Case 1: Simple static class names
  // e.g. <p className="mt-1... text-foreground">{value}</p>
  content = content.replace(REGEX1, (match, labelStr, colorClass, valueStr) => {
    const label = getJsxSafeValue(labelStr);
    const value = getJsxSafeValue(valueStr);
    
    let extraClass = '';
    // if colorClass is not text-foreground, add logical styling
    if (colorClass !== 'text-foreground') {
      extraClass = ` className="[&_.text-foreground]:${colorClass}"`;
    }
    
    return `<MetricCard label={${label}} value={${value}}${extraClass} />`;
  });

  // Case 2: Dynamic class names
  // e.g. <p className={`mt-1... ${stat.color ?? 'text-foreground'}`}>{stat.value}</p>
  content = content.replace(REGEX2, (match, fullLabelStr, dynamicLabel, colorExpr, fullValueStr) => {
    let label = dynamicLabel ? dynamicLabel : `"${fullLabelStr}"`;
    let value = fullValueStr.startsWith('{') ? fullValueStr.substring(1, fullValueStr.length - 1) : `"${fullValueStr}"`;

    let extraClass = '';
    
    // We try to make className map dynamically: className={colorExpr ? `[&_.text-foreground]:${colorExpr}` : ''}
    // But colorExpr is often `stat.color ?? 'text-foreground'` or `stat.color`
    // Let's just use it as is if we can build a template literal.
    
    // If it's something like stat.color ?? 'text-foreground'
    if (colorExpr.includes('??')) {
      const parts = colorExpr.split('??').map(s => s.trim());
      const varName = parts[0];
      extraClass = ` className={${varName} ? \`[&_.text-foreground]:\${${varName}}\` : ''}`;
    } else {
      // Just use the variable itself
      extraClass = ` className={\`${colorExpr}\` !== 'text-foreground' && ${colorExpr} ? \`[&_.text-foreground]:\${${colorExpr}}\` : ''}`;
    }

    return `<MetricCard label={${label}} value={${value}}${extraClass} />`;
  });

  if (content !== originalContent) {
    // Add import statement if it doesn't exist
    if (!content.includes('MetricCard')) {
      // Wait, if it replaced, it definitely has MetricCard now. Check for import format.
      // If no import, add it after other imports.
    }
    
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

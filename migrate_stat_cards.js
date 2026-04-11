const fs = require('fs');
const path = require('path');

const root = '/Users/julianclarkson/claude-code/xpb/redsealion/src';

function traverse(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath, callback);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      callback(fullPath);
    }
  });
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  // Replace StatCard imports
  content = content.replace(/import StatCard from '@\/components\/ui\/StatCard';/g, "import MetricCard from '@/components/ui/MetricCard';");

  // Regex to match StatCard usage
  // Note: StatCard has label, value, color, className
  const statCardRegex = /<StatCard\s+([^>]+)\/>/g;
  
  content = content.replace(statCardRegex, (match, props) => {
    let result = match.replace('<StatCard', '<MetricCard');
    
    // Extract color prop if it exists
    const colorMatch = props.match(/color="([^"]+)"/);
    if (colorMatch) {
      const color = colorMatch[1];
      // Need to add to className, or create className if it doesn't exist
      const classNameMatch = result.match(/className="([^"]+)"/);
      if (classNameMatch) {
        result = result.replace(/className="([^"]+)"/, `className="$1 [&_.text-foreground]:${color}"`);
      } else {
        result = result.replace('/>', `className="[&_.text-foreground]:${color}" />`);
      }
      result = result.replace(/\s*color="([^"]+)"/, '');
    }

    // Now check for dynamic color props like color={'text-blue-600'} or color={someVar}
    const dynamicColorMatch = props.match(/color=\{([^}]+)\}/);
    if (dynamicColorMatch) {
      const color = dynamicColorMatch[1];
      // Similar logic, but more complex since it's dynamic
      // We might need to wrap in backticks: className={`... ${color ? `[&_.text-foreground]:${color}` : ''}`}
      // This is a bit tricky, let's keep it simple for now, maybe manual fix for dynamic
      console.log(`Manual check needed for dynamic color in ${filePath}: ${match}`);
    }

    return result;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${filePath}`);
  }
}

traverse(root, processFile);

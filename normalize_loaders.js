const fs = require('fs');
const glob = require('glob');
// Wait, glob might not be installed globally, can just use find directly using standard child_process or just standard fs.readdirSync recursively.

// Actually, doing it via bash is easier:

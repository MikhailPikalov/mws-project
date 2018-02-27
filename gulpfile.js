const requireDir = require('require-dir');

requireDir('./gulp/subtasks/', { recurse: true });
requireDir('./gulp/tasks/', { recurse: true });
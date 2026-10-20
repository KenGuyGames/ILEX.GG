const fs=require('fs'),path=require('path'),vm=require('vm');
let s=fs.readFileSync(path.join(__dirname,'swsh-shared-regressions.cjs'),'utf8').replaceAll('swsh-regression-','sv-current-regression-').replaceAll('swsh-shared-regressions.json','sv-current-shared-regressions.json');
vm.runInThisContext('(function(require,__dirname){'+s+'})',{filename:__filename})(require,__dirname);

process.env.ILEX_CUBE_FINAL_CHECKS='1';process.env.ILEX_CUBE_REGRESSION_DIR=require('path').resolve(__dirname,'../../verification/fresh-source-tests');require('./run-cube-regressions.cjs');

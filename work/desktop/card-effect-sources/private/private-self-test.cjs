const fs=require('fs'),path=require('path');
module.exports=async(win,dir)=>{if(process.env.ILEX_PRIVATE_FULL==='1')await require('./sv-self-test.cjs')(win,dir);await require('./private-native-tests.cjs')(win,dir);};

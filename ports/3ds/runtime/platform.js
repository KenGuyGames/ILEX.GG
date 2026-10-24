/* Minimal host services required by the shared browser-targeted engine. No timers or DOM are faked. */
var IlexPlatform={warnings:[]};
globalThis.console={log(){},debug(){},info(){},warn(...args){if(IlexPlatform.warnings.length<16)IlexPlatform.warnings.push(args.map(String).join(' '));},error(...args){if(IlexPlatform.warnings.length<16)IlexPlatform.warnings.push(args.map(String).join(' '));}};

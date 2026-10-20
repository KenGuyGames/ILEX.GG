const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'../..'),folder=path.join(root,'work/cube-candidate'),android=path.join(root,'work/android-build');
let java=fs.readFileSync(path.join(android,'MainActivity.java'),'utf8');const methods=String.raw`
 private String cubeJson(String path)throws Exception{
  if(!path.matches("/api/cubes/(cube/[a-zA-Z0-9_-]{1,100}|[0-9]+/cards)"))throw new IOException("Invalid cube endpoint");
  HttpURLConnection conn=(HttpURLConnection)new URL("https://cubekoga.net"+path).openConnection();conn.setConnectTimeout(15000);conn.setReadTimeout(20000);conn.setInstanceFollowRedirects(false);conn.setRequestProperty("Accept","application/json");
  try{if(conn.getResponseCode()!=200)throw new IOException("Cube not available");try(InputStream in=conn.getInputStream();ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] buffer=new byte[32768];int n;while((n=in.read(buffer))!=-1){if(out.size()+n>8*1024*1024)throw new IOException("Cube response too large");out.write(buffer,0,n);}return new String(out.toByteArray(),"UTF-8");}}finally{conn.disconnect();}
 }
 private JSONObject importCube(String value)throws Exception{
  if(value.length()>1000)throw new IOException("Invalid cube link");Uri u=Uri.parse(value);if(!"https".equals(u.getScheme())||!Arrays.asList("cubekoga.net","www.cubekoga.net").contains(u.getHost())||u.getPort()!=-1||u.getUserInfo()!=null)throw new IOException("Invalid cube host");
  String key=null;java.util.regex.Matcher match=java.util.regex.Pattern.compile("^/cube/([a-zA-Z0-9_-]+)(?:/[a-zA-Z-]+)?/?$",java.util.regex.Pattern.CASE_INSENSITIVE).matcher(u.getPath());if(match.matches())key=match.group(1);else key=u.getQueryParameter("cubeid");if(key==null||!key.matches("[a-zA-Z0-9_-]{1,100}"))throw new IOException("Invalid cube identifier");
  JSONObject meta=new JSONObject(cubeJson("/api/cubes/cube/"+key));long id=meta.optLong("cube_ID",0);if(id<1||!meta.optBoolean("publicity",true))throw new IOException("Cube not public");JSONArray cards=new JSONArray(cubeJson("/api/cubes/"+id+"/cards"));if(cards.length()>20000)throw new IOException("Cube too large");return new JSONObject().put("metadata",meta).put("cards",cards);
 }
`;
const point=' private JSONObject status()';if(!java.includes(point))throw Error('Android status anchor');java=java.replace(point,methods+'\n'+point);const dispatch='if(method.equals("export"))';if(!java.includes(dispatch))throw Error('Android host action anchor');java=java.replace(dispatch,'if(method.equals("importCube")){reply(id,importCube(args.getString(0)),null);return;}'+dispatch);fs.writeFileSync(path.join(folder,'MainActivity.java'),java);
let host=fs.readFileSync(path.join(android,'mobile-host.js'),'utf8').replace('window.desktop={exportJSON:',"window.desktop={importCube:url=>call('importCube',[url]),exportJSON:");fs.writeFileSync(path.join(folder,'mobile-host.js'),host);
const manifest=fs.readFileSync(path.join(root,'work/combined-bot-release/AndroidManifest.xml'),'utf8').replace(/android:versionCode="\d+"/,'android:versionCode="34"').replace(/android:versionName="[^"]+"/,'android:versionName="1.22.0-android.34"');fs.writeFileSync(path.join(folder,'AndroidManifest.xml'),manifest);
console.log('Android cube import source and code34 manifest prepared');

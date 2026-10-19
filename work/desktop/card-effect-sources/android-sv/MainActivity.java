package gg.ilex.app;

import android.app.*;
import android.os.*;
import android.content.*;
import android.net.Uri;
import android.view.*;
import android.webkit.*;
import android.widget.*;
import org.json.*;
import java.io.*;
import java.net.*;
import java.security.*;
import java.util.*;
import java.util.concurrent.*;

public final class MainActivity extends Activity {
 private static final String HOST="appassets.androidplatform.net", HOME="https://"+HOST+"/assets/ui/index.html";
 private boolean foreground=true; private WebView web; private ValueCallback<Uri[]> chooser; private int exportId; private byte[] exportBytes;
 private final ExecutorService workers=Executors.newFixedThreadPool(4); private final Object catalogLock=new Object();
 private final ConcurrentHashMap<String,Object> locks=new ConcurrentHashMap<>(); private Map<String,JSONObject> manifest;
 private volatile boolean downloading=false; private volatile int checked=0,failed=0,cacheEpoch=0;
 private final Set<String> hosts=new HashSet<>(Arrays.asList("assets.tcgdex.net","pkmncards.com","images.pokemontcg.io","cdn.malie.io","img.tcgscreener.com","limitlesstcg.nyc3.cdn.digitaloceanspaces.com","product-images.tcgplayer.com","static.dextcg.com","www.pokebeach.com"));
 @Override public void onCreate(Bundle state){super.onCreate(state); getWindow().setStatusBarColor(0xff102c22);getWindow().setNavigationBarColor(0xff102c22);
  FrameLayout root=new FrameLayout(this);root.setBackgroundColor(0xff102c22);web=new WebView(this);root.addView(web,new FrameLayout.LayoutParams(-1,-1));setContentView(root);
  root.setOnApplyWindowInsetsListener((v,insets)->{if(Build.VERSION.SDK_INT>=30){android.graphics.Insets x=insets.getInsets(WindowInsets.Type.systemBars()|WindowInsets.Type.displayCutout()|WindowInsets.Type.ime());v.setPadding(x.left,x.top,x.right,x.bottom);}else v.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());return insets;});
  WebSettings s=web.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setAllowFileAccess(false);s.setAllowContentAccess(true);s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);s.setMediaPlaybackRequiresUserGesture(true);s.setSupportZoom(true);s.setBuiltInZoomControls(true);s.setDisplayZoomControls(false);s.setTextZoom(100);
  android.webkit.CookieManager.getInstance().setAcceptThirdPartyCookies(web,false);web.addJavascriptInterface(new Bridge(),"IlexAndroid");
  web.setOnLongClickListener(v->{int type=web.getHitTestResult().getType();return type==WebView.HitTestResult.IMAGE_TYPE||type==WebView.HitTestResult.SRC_IMAGE_ANCHOR_TYPE;});
  web.setWebViewClient(new WebViewClient(){
   @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){Uri uri=request.getUrl();if(!HOST.equals(uri.getHost())||!"https".equals(uri.getScheme()))return null;String path=uri.getPath();try{if(path==null||!path.startsWith("/assets/ui/")||path.contains(".."))return response(403,"Forbidden");String local=path.substring(8);if(local.startsWith("ui/scans/")){String name=local.substring(9);if(!name.matches("[a-f0-9]{24}\\.(webp|jpg|png)"))return response(404,"Missing image");try{return asset(local);}catch(IOException absent){File f=scan(name);if(f!=null)return new WebResourceResponse(mime(name),null,new FileInputStream(f));return response(503,"Image needs an internet connection");}}return asset(local);}catch(Exception e){return response(404,"Unavailable");}}
   @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest req){Uri u=req.getUrl();if(HOST.equals(u.getHost())&&"https".equals(u.getScheme())&&u.getPath().startsWith("/assets/ui/"))return false;if(req.isForMainFrame()&&"https".equals(u.getScheme()))try{startActivity(new Intent(Intent.ACTION_VIEW,u));}catch(Exception ignored){}return true;}
  });
  web.setWebChromeClient(new WebChromeClient(){
   @Override public boolean onJsAlert(WebView v,String url,String message,JsResult result){new AlertDialog.Builder(MainActivity.this).setMessage(message).setPositiveButton("OK",(d,w)->result.confirm()).setOnCancelListener(d->result.cancel()).show();return true;}
   @Override public boolean onJsConfirm(WebView v,String url,String message,JsResult result){new AlertDialog.Builder(MainActivity.this).setMessage(message).setPositiveButton("Continue",(d,w)->result.confirm()).setNegativeButton("Cancel",(d,w)->result.cancel()).setOnCancelListener(d->result.cancel()).show();return true;}
   @Override public boolean onJsPrompt(WebView v,String url,String message,String value,JsPromptResult result){EditText input=new EditText(MainActivity.this);input.setText(value);new AlertDialog.Builder(MainActivity.this).setMessage(message).setView(input).setPositiveButton("Save",(d,w)->result.confirm(input.getText().toString())).setNegativeButton("Cancel",(d,w)->result.cancel()).setOnCancelListener(d->result.cancel()).show();return true;}
   @Override public boolean onShowFileChooser(WebView v,ValueCallback<Uri[]> callback,FileChooserParams params){if(chooser!=null)chooser.onReceiveValue(null);chooser=callback;try{Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT);i.addCategory(Intent.CATEGORY_OPENABLE);i.setType("application/json");startActivityForResult(i,11);return true;}catch(Exception e){chooser=null;return false;}}@Override public boolean onCreateWindow(WebView v,boolean dialog,boolean user,Message result){return false;}});
  if(Build.VERSION.SDK_INT>=33)getOnBackInvokedDispatcher().registerOnBackInvokedCallback(android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT,()->handleBack());
  web.loadUrl(HOME);
 }
 private WebResourceResponse asset(String path)throws IOException{return new WebResourceResponse(mime(path),path.endsWith(".json")||path.endsWith(".js")||path.endsWith(".html")||path.endsWith(".css")?"UTF-8":null,getAssets().open(path));}
 private WebResourceResponse response(int code,String message){return new WebResourceResponse("text/plain","UTF-8",code,code==503?"Unavailable":code==403?"Forbidden":"Not Found",Collections.singletonMap("Cache-Control","no-store"),new ByteArrayInputStream(message.getBytes(java.nio.charset.StandardCharsets.UTF_8)));}
 private static String mime(String p){if(p.endsWith(".html"))return "text/html";if(p.endsWith(".js"))return "application/javascript";if(p.endsWith(".json"))return "application/json";if(p.endsWith(".css"))return "text/css";if(p.endsWith(".svg"))return "image/svg+xml";if(p.endsWith(".webp"))return "image/webp";if(p.endsWith(".png"))return "image/png";if(p.endsWith(".jpg"))return "image/jpeg";if(p.endsWith(".mp3"))return "audio/mpeg";if(p.endsWith(".ttf"))return "font/ttf";return "application/octet-stream";}
 private static byte[] read(InputStream stream)throws IOException{try(InputStream in=stream;ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] b=new byte[32768];int n;while((n=in.read(b))!=-1)out.write(b,0,n);return out.toByteArray();}}
 private Map<String,JSONObject> catalog()throws Exception{synchronized(catalogLock){if(manifest==null){JSONObject data=new JSONObject(new String(read(getAssets().open("ui/scan-manifest.json")),"UTF-8"));Map<String,JSONObject> m=new LinkedHashMap<>();Iterator<String> it=data.keys();while(it.hasNext()){JSONObject entry=data.optJSONObject(it.next());if(entry!=null&&entry.has("file"))m.put(entry.getString("file").replace("scans/",""),entry);}manifest=m;}return manifest;}}
 private File scan(String name)throws Exception{Object lock=locks.computeIfAbsent(name,k->new Object());synchronized(lock){JSONObject meta=catalog().get(name);if(meta==null)return null;File folder=new File(getFilesDir(),"card-cache");folder.mkdirs();File finalFile=new File(folder,name);if(valid(finalFile,meta))return finalFile;Uri url=Uri.parse(meta.getString("sourceUrl"));if(!"https".equals(url.getScheme())||!hosts.contains(url.getHost()))return null;File temp=new File(folder,name+".part");try{URL address=new URL(url.toString());HttpURLConnection conn=null;for(int redirects=0;redirects<6;redirects++){if(!"https".equals(address.getProtocol())||!hosts.contains(address.getHost()))throw new IOException("Image source rejected");conn=(HttpURLConnection)address.openConnection();conn.setConnectTimeout(12000);conn.setReadTimeout(20000);conn.setInstanceFollowRedirects(false);conn.setRequestProperty("User-Agent","ILEX.GG Android/1.0");int code=conn.getResponseCode();if(code>=300&&code<400){String next=conn.getHeaderField("Location");conn.disconnect();address=new URL(address,next);conn=null;continue;}if(code!=200)throw new IOException("Image unavailable");break;}if(conn==null)throw new IOException("Redirect limit");long expected=meta.getLong("bytes"),total=0;try(InputStream in=conn.getInputStream();FileOutputStream out=new FileOutputStream(temp)){byte[] b=new byte[32768];int n;while((n=in.read(b))!=-1){total+=n;if(total>expected)throw new IOException("Unexpected image size");out.write(b,0,n);}}finally{conn.disconnect();}if(!valid(temp,meta))throw new IOException("Image verification failed");if(finalFile.exists())finalFile.delete();if(!temp.renameTo(finalFile))throw new IOException("Cannot save image");return finalFile;}finally{temp.delete();}}}
 private boolean valid(File f,JSONObject m)throws Exception{if(!f.isFile()||f.length()!=m.getLong("bytes"))return false;MessageDigest sha=MessageDigest.getInstance("SHA-256");try(InputStream in=new FileInputStream(f)){byte[] b=new byte[32768];int n;while((n=in.read(b))!=-1)sha.update(b,0,n);}StringBuilder h=new StringBuilder();for(byte x:sha.digest())h.append(String.format(Locale.ROOT,"%02x",x&255));return h.toString().equals(m.getString("sha256"));}
 private JSONObject status()throws Exception{return new JSONObject().put("total",catalog().size()).put("checked",checked).put("failed",failed).put("running",downloading);}
 private void js(String code){runOnUiThread(()->{if(web!=null)web.evaluateJavascript(code,null);});}
 private void reply(int id,Object result,String error){js("window.__ilexNativeReply&&window.__ilexNativeReply("+id+","+(result==null?"null":result.toString())+","+(error==null?"null":JSONObject.quote(error))+")");}
 private void progress(){try{js("window.__ilexCacheStatus&&window.__ilexCacheStatus("+status()+")");}catch(Exception ignored){}}
 private void pauseDownloads(){synchronized(catalogLock){downloading=false;cacheEpoch++;}}
 private void startDownloads(){
  synchronized(catalogLock){
   if(downloading)return;
   final int epoch=++cacheEpoch;downloading=true;checked=0;failed=0;
   workers.execute(()->{
    try{
     for(String name:catalog().keySet()){
      if(!downloading||epoch!=cacheEpoch)break;
      boolean bad=false;
      try{try(InputStream bundled=getAssets().open("ui/scans/"+name)){}catch(IOException missing){bad=scan(name)==null;}}catch(Exception e){bad=true;}
      synchronized(catalogLock){if(epoch!=cacheEpoch)break;checked++;if(bad)failed++;}
      if(checked%5==0)progress();
     }
    }catch(Exception ignored){}finally{synchronized(catalogLock){if(epoch==cacheEpoch){downloading=false;progress();}}}
   });
  }
 }
 public final class Bridge{@JavascriptInterface public void postMessage(String message){if(message.length()>32000000)return;workers.execute(()->{int id=0;try{JSONObject request=new JSONObject(message);id=request.getInt("id");String method=request.getString("method");JSONArray args=request.optJSONArray("args");if(method.equals("export")){final int requestId=id;final String name=args.getString(0).replaceAll("[^a-zA-Z0-9._-]","_");final byte[] bytes=args.get(1).toString().getBytes("UTF-8");runOnUiThread(()->{if(exportBytes!=null){reply(requestId,null,"An export is already open");return;}exportId=requestId;exportBytes=bytes;try{Intent i=new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("application/json").putExtra(Intent.EXTRA_TITLE,name);startActivityForResult(i,12);}catch(Exception e){exportBytes=null;reply(requestId,null,"No file picker available");}});return;}if(method.equals("pause"))pauseDownloads();if(method.equals("download"))startDownloads();if(!Arrays.asList("status","download","pause").contains(method))throw new IOException("Unknown host action");reply(id,status(),null);}catch(Exception e){reply(id,null,"Android action failed: "+e.getClass().getSimpleName());}});}}
 @Override protected void onActivityResult(int req,int result,Intent data){super.onActivityResult(req,result,data);if(req==11&&chooser!=null){chooser.onReceiveValue(result==RESULT_OK&&data!=null&&data.getData()!=null?new Uri[]{data.getData()}:null);chooser=null;}if(req==12){final byte[] bytes=exportBytes;final int id=exportId;exportBytes=null;if(result!=RESULT_OK||data==null){reply(id,false,null);return;}final Uri target=data.getData();workers.execute(()->{try(OutputStream out=getContentResolver().openOutputStream(target)){out.write(bytes);reply(id,true,null);}catch(Exception e){reply(id,null,"Could not save the workspace");}});}}
 private void handleBack(){web.evaluateJavascript("window.IlexMobile?IlexMobile.back():false",r->{if(!"true".equals(r))moveTaskToBack(true);});}
 @Override public void onBackPressed(){handleBack();}
 @Override protected void onPause(){foreground=false;pauseDownloads();if(web!=null){web.evaluateJavascript("try{if(typeof save==='function')save();window.IlexMobile?.setHostPaused?.(true)}catch(e){}",r->{if(web!=null&&!foreground)web.pauseTimers();});web.onPause();}super.onPause();}
 @Override protected void onResume(){foreground=true;super.onResume();if(web!=null){web.resumeTimers();web.onResume();web.evaluateJavascript("window.IlexMobile?.setHostPaused?.(false)",null);}}
 @Override protected void onDestroy(){pauseDownloads();workers.shutdownNow();if(web!=null){web.removeJavascriptInterface("IlexAndroid");web.destroy();web=null;}super.onDestroy();}
}

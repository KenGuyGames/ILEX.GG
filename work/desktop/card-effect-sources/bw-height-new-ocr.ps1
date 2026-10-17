$ErrorActionPreference='Stop'
[Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType=WindowsRuntime] | Out-Null
[Windows.Storage.StorageFile, Windows.Storage, ContentType=WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.BitmapDecoder, Windows.Foundation, ContentType=WindowsRuntime] | Out-Null
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$awaitTask=([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {$_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'})[0]
function Wait-WinRt($op,$resultType){$task=$awaitTask.MakeGenericMethod($resultType).Invoke($null,@($op)); $task.GetAwaiter().GetResult()}
$engine=[Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
$index=Get-Content work/rules-research/bw-height-new-index.json -Raw | ConvertFrom-Json
$output=New-Object System.Collections.Generic.List[Object]
foreach($item in $index){
 $memory=New-Object System.IO.MemoryStream
 $bytes=[System.IO.File]::ReadAllBytes((Join-Path (Get-Location) ('work/rules-research/bw-height-crops/'+$item.id+'.png')))
 $memory.Write($bytes,0,$bytes.Length);$memory.Position=0
 $stream=[System.IO.WindowsRuntimeStreamExtensions]::AsRandomAccessStream($memory)
 $decoder=Wait-WinRt ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
 $bitmap=Wait-WinRt ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
 $result=Wait-WinRt ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
 $output.Add(@{id=$item.id;text=$result.Text;lines=@($result.Lines | ForEach-Object {$_.Text})})
 $bitmap.Dispose();$stream.Dispose();$memory.Dispose()
 if($output.Count%100 -eq 0){Write-Output ('Scans read: '+$output.Count)}
}
$output | ConvertTo-Json -Depth 5 | Set-Content work/rules-research/bw-height-new-ocr-results.json -Encoding UTF8

param(
  [string]$Url = 'http://127.0.0.1:5173/',
  [int]$TimeoutSec = 90
)

$ErrorActionPreference = 'Continue'
$deadline = (Get-Date).AddSeconds($TimeoutSec)
$uri = [Uri]$Url
$hostName = $uri.Host
$port = if ($uri.Port -gt 0) { $uri.Port } else { 80 }
$curl = Get-Command curl.exe -ErrorAction SilentlyContinue

Write-Host "Aguardando TCP ${hostName}:${port} ..."

while ((Get-Date) -lt $deadline) {
  try {
    $client = New-Object System.Net.Sockets.TcpClient
    $iar = $client.BeginConnect($hostName, $port, $null, $null)
    $ok = $iar.AsyncWaitHandle.WaitOne(800, $false)
    if ($ok -and $client.Connected) {
      $client.EndConnect($iar) | Out-Null
      $client.Close()
      break
    }
    $client.Close()
  } catch { }
  Start-Sleep -Milliseconds 400
}

if ((Get-Date) -ge $deadline) {
  Write-Host "Timeout aguardando porta ${port}."
  exit 1
}

Write-Host "Porta aberta. Aguardando HTTP em $Url ..."

while ((Get-Date) -lt $deadline) {
  if ($curl) {
    & curl.exe -sS -o NUL -w "%{http_code}" --connect-timeout 2 --max-time 5 $Url 2>$null | Tee-Object -Variable code | Out-Null
    if ($code -match '^[23]\d\d$') {
      Write-Host "HTTP $code - servidor pronto."
      exit 0
    }
  } else {
    try {
      $req = [System.Net.HttpWebRequest]::Create($Url)
      $req.Method = 'GET'
      $req.Timeout = 5000
      $req.ReadWriteTimeout = 5000
      $req.Proxy = [System.Net.GlobalProxySelection]::GetEmptyWebProxy()
      $req.UserAgent = 'GuiaAgileQA-wait-vite'
      $resp = $req.GetResponse()
      $status = [int]$resp.StatusCode
      $resp.Close()
      if ($status -ge 200 -and $status -lt 500) {
        Write-Host "HTTP $status - servidor pronto."
        exit 0
      }
    } catch { }
  }
  Start-Sleep -Milliseconds 500
}

Write-Host "Timeout aguardando resposta HTTP."
exit 1

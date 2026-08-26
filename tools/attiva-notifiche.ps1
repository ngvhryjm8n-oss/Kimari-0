# Distribuisce la parte server delle notifiche. Versione per PowerShell.
#
# REGOLA DI QUESTO FILE: solo caratteri ASCII, niente accentate.
# PowerShell 5.1 legge i file con la codifica di sistema se non trova il
# marcatore in testa. Le accentate diventano byte strani, il parser perde il
# filo e segnala errori su righe che non c'entrano niente. E' successo il
# 27/8/2026: si lamentava di un simbolo dentro un COMMENTO, e la causa vera
# era tre righe piu' su.
#
#   cd D:\Kimari\Kimari-0
#   powershell -ExecutionPolicy Bypass -File tools\attiva-notifiche.ps1
#
# Prima serve essere entrati una volta sola:  npx supabase login

$ErrorActionPreference = "Stop"

$Progetto = "fnafzokgkbhhjircrogy"
$Segreti  = "D:\Kimari\segreti\vapid.txt"

if (-not (Test-Path $Segreti)) {
  Write-Host "Non trovo $Segreti - le chiavi VAPID sono del 26/8/2026." -ForegroundColor Red
  exit 1
}

# Ogni riga e' "NOME    chiave": si prende l'ultimo pezzo.
$righe = Get-Content $Segreti
$pub = ($righe | Where-Object { $_ -match "^PUBBLICA" }) -split "\s+" | Select-Object -Last 1
$pri = ($righe | Where-Object { $_ -match "^PRIVATA"  }) -split "\s+" | Select-Object -Last 1
$cron = ($righe | Where-Object { $_ -match "^CRON" }) -split "\s+" | Select-Object -Last 1

if ([string]::IsNullOrWhiteSpace($pub) -or [string]::IsNullOrWhiteSpace($pri)) {
  Write-Host "Il file dei segreti non ha il formato atteso (PUBBLICA / PRIVATA)." -ForegroundColor Red
  exit 1
}

# Controllo prima di spedire: se la chiave pubblica nel file non e' quella
# dentro l'app, le notifiche partirebbero firmate con una chiave che i telefoni
# non riconoscono, e fallirebbero TUTTE in silenzio, senza un errore visibile.
$riga = Select-String -Path "app\data.js" -Pattern "const VAPID = '([^']*)'"
$nellApp = $riga.Matches[0].Groups[1].Value
if ($pub -ne $nellApp) {
  Write-Host "FERMO: la chiave pubblica nel file non e' quella dentro app/data.js." -ForegroundColor Red
  Write-Host "Le notifiche fallirebbero tutte senza dire perche'."
  exit 1
}
Write-Host "OK  la chiave pubblica nel file e quella nell'app combaciano" -ForegroundColor Green

Write-Host ""
Write-Host "1/2 - metto i segreti su Supabase..." -ForegroundColor Cyan
npx --yes supabase secrets set "VAPID_PUBBLICA=$pub" "VAPID_PRIVATA=$pri" "VAPID_CONTATTO=mailto:kimariapp@gmail.com" "CRON_SEGRETO=$cron" --project-ref $Progetto
if ($LASTEXITCODE -ne 0) { Write-Host "non riuscito" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "2/2 - distribuisco la funzione che consegna..." -ForegroundColor Cyan
npx --yes supabase functions deploy svuota-coda --project-ref $Progetto --no-verify-jwt
if ($LASTEXITCODE -ne 0) { Write-Host "non riuscito" -ForegroundColor Red; exit 1 }

Write-Host ""
# Si scrive il SQL gia' pronto invece di far modificare il modello a mano:
# Blocco note salva in UTF-16 e il database legge caratteri separati da byte
# nulli. Il sintomo non ha niente a che vedere con la causa, e ci si perde
# mezz'ora. Il file pronto contiene un segreto, quindi non entra nel repo.
# Si legge in UTF-8 esplicito: se il modello fosse salvato in UTF-16 (Blocco
# note lo fa), Get-Content senza -Encoding lo leggerebbe come caratteri
# separati da byte nulli, il segnaposto non si troverebbe, e il file uscirebbe
# con dentro la scritta __SEGRETO__ invece del segreto vero. Il cron poi
# risponderebbe 401 per sempre senza spiegare perche.
$modello = Get-Content "tools\cron-notifiche.sql" -Raw -Encoding UTF8
if ($modello -notmatch "__SEGRETO__") {
  Write-Host "FERMO: nel modello SQL manca il segnaposto __SEGRETO__." -ForegroundColor Red
  Write-Host "Probabile codifica sbagliata di tools\\cron-notifiche.sql."
  exit 1
}
$pronto = $modello -replace "__SEGRETO__", $cron
if ($pronto -match "__SEGRETO__") {
  Write-Host "FERMO: la sostituzione del segreto non e riuscita." -ForegroundColor Red
  exit 1
}
[System.IO.File]::WriteAllText("$PWD\tools\cron-notifiche-pronto.sql", $pronto, (New-Object System.Text.UTF8Encoding $false))

Write-Host "Fatto. Resta un passo solo, nel SQL Editor di Supabase." -ForegroundColor Green
Write-Host "Apri tools\cron-notifiche-pronto.sql e incolla TUTTO nel SQL Editor."
Write-Host "Il segreto e' gia' dentro: non va modificato niente a mano."

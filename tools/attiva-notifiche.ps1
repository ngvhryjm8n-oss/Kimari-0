# Distribuisce la parte server delle notifiche. Versione per PowerShell.
#
# Esiste perché Vincenzo lavora in PowerShell e la versione .sh gli dava
# errori di sintassi: in PowerShell "&&" non è un separatore valido e i
# percorsi non si scrivono /d/Kimari. Dare comandi per la shell sbagliata fa
# perdere tempo e sembra che sia rotto qualcosa.
#
#   cd D:\Kimari\Kimari-0
#   powershell -ExecutionPolicy Bypass -File tools\attiva-notifiche.ps1
#
# Prima serve essere entrati una volta sola:
#   npx supabase login

$ErrorActionPreference = 'Stop'

$Progetto = 'fnafzokgkbhhjircrogy'
$Segreti  = 'D:\Kimari\segreti\vapid.txt'

if (-not (Test-Path $Segreti)) {
  Write-Host "Non trovo $Segreti — le chiavi VAPID sono state generate il 26/8/2026." -ForegroundColor Red
  exit 1
}

# Le righe sono "PUBBLICA  <chiave>": si prende l'ultimo pezzo.
$righe = Get-Content $Segreti
$pub = ($righe | Where-Object { $_ -match '^PUBBLICA' }) -split '\s+' | Select-Object -Last 1
$pri = ($righe | Where-Object { $_ -match '^PRIVATA'  }) -split '\s+' | Select-Object -Last 1

if ([string]::IsNullOrWhiteSpace($pub) -or [string]::IsNullOrWhiteSpace($pri)) {
  Write-Host "Il file dei segreti non ha il formato atteso (PUBBLICA / PRIVATA)." -ForegroundColor Red
  exit 1
}

# Un controllo prima di spedire: se la chiave pubblica nel file non è quella
# dentro l'app, le notifiche partirebbero firmate con una chiave che i telefoni
# non riconoscono — e fallirebbero TUTTE, in silenzio, senza un errore visibile.
$nellApp = (Select-String -Path 'app\data.js' -Pattern "const VAPID = '([^']*)'").Matches[0].Groups[1].Value
if ($pub -ne $nellApp) {
  Write-Host "FERMO: la chiave pubblica nel file non e' quella dentro app/data.js." -ForegroundColor Red
  Write-Host "Le notifiche partirebbero firmate con una chiave che i telefoni rifiutano,"
  Write-Host "e fallirebbero tutte senza dire perche'."
  exit 1
}
Write-Host "OK  la chiave pubblica nel file e quella nell'app combaciano" -ForegroundColor Green

Write-Host ""
Write-Host "1/2 - metto i segreti su Supabase..." -ForegroundColor Cyan
npx --yes supabase secrets set "VAPID_PUBBLICA=$pub" "VAPID_PRIVATA=$pri" "VAPID_CONTATTO=mailto:kimariapp@gmail.com" --project-ref $Progetto
if ($LASTEXITCODE -ne 0) { Write-Host "non riuscito" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "2/2 - distribuisco la funzione che consegna..." -ForegroundColor Cyan
npx --yes supabase functions deploy svuota-coda --project-ref $Progetto --no-verify-jwt
if ($LASTEXITCODE -ne 0) { Write-Host "non riuscito" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "Fatto. Resta un passo solo, nel SQL Editor di Supabase." -ForegroundColor Green
Write-Host "Il comando sta in tools\cron-notifiche.sql: apri quel file, sostituisci"
Write-Host "la chiave service_role dove indicato, e incollalo."

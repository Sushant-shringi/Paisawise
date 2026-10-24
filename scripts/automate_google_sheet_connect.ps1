Add-Type -AssemblyName System.Windows.Forms

$formula = '=IMPORTDATA("https://paisawise-two.vercel.app/api/public/sheets-csv")'
$sheetUrl = 'https://docs.google.com/spreadsheets/d/1hgC9wdhGU68c7xdxBdltEFrBEJtXS2F1MCNJawKQ2lA/edit?gid=0#gid=0'

Write-Host "1. Setting Windows clipboard to live database formula..."
Set-Clipboard -Value $formula

Write-Host "2. Opening Google Sheet in browser..."
Start-Process $sheetUrl

Write-Host "3. Waiting for Google Sheet to load..."
Start-Sleep -Seconds 7

$wshell = New-Object -ComObject wscript.shell

$activated = $wshell.AppActivate("Google Sheets")
if (-not $activated) {
    $activated = $wshell.AppActivate("Chrome")
}
if (-not $activated) {
    $activated = $wshell.AppActivate("Edge")
}

Write-Host "Window activated: $activated"

if ($activated) {
    Start-Sleep -Milliseconds 1000
    Write-Host "4. Focusing cell A1 and pasting formula..."
    [System.Windows.Forms.SendKeys]::SendWait("{ESC}")
    Start-Sleep -Milliseconds 400
    [System.Windows.Forms.SendKeys]::SendWait("^{HOME}")
    Start-Sleep -Milliseconds 600
    [System.Windows.Forms.SendKeys]::SendWait("^v")
    Start-Sleep -Milliseconds 600
    [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
    Start-Sleep -Milliseconds 800
    Write-Host "SUCCESS: Pasted database formula into cell A1!"
} else {
    Write-Host "Notice: Window activation bypassed. Formula is ready in clipboard for Ctrl+V."
}

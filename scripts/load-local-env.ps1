param([Parameter(Mandatory = $true)][string]$Root)
$taskEnvPath = Join-Path $Root '.env'
if (Test-Path -LiteralPath $taskEnvPath) {
    $taskLineNumber = 0
    foreach ($taskEnvLine in Get-Content -LiteralPath $taskEnvPath -Encoding UTF8) {
        $taskLineNumber++
        $taskEnvLine = $taskEnvLine.Trim()
        if (-not $taskEnvLine -or $taskEnvLine.StartsWith('#')) { continue }
        if ($taskEnvLine -notmatch '^([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$') {
            throw "Invalid .env entry on line $taskLineNumber. Use NAME=value."
        }
        $taskEnvName = $Matches[1]
        $taskEnvValue = $Matches[2].Trim()
        if ($taskEnvValue.StartsWith('"') -or $taskEnvValue.StartsWith("'")) {
            if ($taskEnvValue.Length -lt 2 -or $taskEnvValue[-1] -ne $taskEnvValue[0]) {
                throw "Unclosed quote in .env on line $taskLineNumber."
            }
            $taskEnvValue = $taskEnvValue.Substring(1, $taskEnvValue.Length - 2)
        }
        # Literal values only: never evaluate shell expressions or expand variables.
        [Environment]::SetEnvironmentVariable($taskEnvName, $taskEnvValue, 'Process')
    }
    Write-Output 'Loaded local .env configuration (values hidden).'
}

# Reuse the encryption key saved during the existing GitHub setup.
if ([string]::IsNullOrWhiteSpace($env:GITHUB_TOKEN_KEY) -and $env:LOCALAPPDATA) {
    $taskSavedKeyPath = Join-Path $env:LOCALAPPDATA 'DevSim\github-token-key.xml'
    if (Test-Path -LiteralPath $taskSavedKeyPath) {
        try {
            $taskSavedSecret = Import-Clixml -LiteralPath $taskSavedKeyPath
            if ($taskSavedSecret -isnot [Security.SecureString]) { throw 'Unexpected key format' }
            $env:GITHUB_TOKEN_KEY = [System.Net.NetworkCredential]::new('', $taskSavedSecret).Password
            if ([Convert]::FromBase64String($env:GITHUB_TOKEN_KEY).Length -ne 32) { throw 'Invalid key length' }
            Write-Output 'Loaded saved GitHub token encryption key (value hidden).'
        } catch {
            throw 'Cannot load saved GitHub encryption key. Use the original Windows account or set the original GITHUB_TOKEN_KEY in .env.'
        }
    }
}

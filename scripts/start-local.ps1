param([switch]$Build, [switch]$RestartBackend, [switch]$CheckBackendOwner)
$ErrorActionPreference = 'Stop'
$taskRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$taskLogs = Join-Path $taskRoot '.local'
New-Item -ItemType Directory -Path $taskLogs -Force | Out-Null
$taskJarPath = Join-Path $taskRoot 'backend/target/virtualcompany-backend-0.0.1-SNAPSHOT.jar'
if (-not $CheckBackendOwner) {
    $taskBuildInputs = @(Get-ChildItem -LiteralPath (Join-Path $taskRoot 'backend/src') -Recurse -File; Get-Item -LiteralPath (Join-Path $taskRoot 'backend/pom.xml'))
    $taskLatestInput = $taskBuildInputs | Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 1
    $taskJarInfo = Get-Item -LiteralPath $taskJarPath -ErrorAction SilentlyContinue
    if (-not $taskJarInfo -or $taskLatestInput.LastWriteTimeUtc -gt $taskJarInfo.LastWriteTimeUtc) {
        Write-Output 'Backend source is newer than the local JAR. Building and restarting DevSim automatically.'
        $Build = $true
        $RestartBackend = $true
    }
}
$taskListener = Get-NetTCPConnection -State Listen -LocalPort 8080 -ErrorAction SilentlyContinue | Select-Object -First 1
if ($taskListener -and ($RestartBackend -or $Build -or $CheckBackendOwner)) {
    $taskProcess = Get-CimInstance Win32_Process -Filter "ProcessId=$($taskListener.OwningProcess)"
    $taskExpectedJar = [System.IO.Path]::GetFullPath((Join-Path $taskRoot 'backend/target/virtualcompany-backend-0.0.1-SNAPSHOT.jar'))
    $taskCommand = $taskProcess.CommandLine.Replace('/', '\')
    $taskOwnsBackend = $taskCommand.Contains($taskExpectedJar)
    # Relative JAR launches must be verified against the JVM's actual working directory.
    if (-not $taskOwnsBackend -and $taskCommand -match '-jar\s+"?target\\virtualcompany-backend-0\.0\.1-SNAPSHOT\.jar') {
        $taskJcmd = Join-Path (Split-Path $taskProcess.ExecutablePath -Parent) 'jcmd.exe'
        if (Test-Path -LiteralPath $taskJcmd) {
            $taskPreviousPreference = $ErrorActionPreference
            try {
                $ErrorActionPreference = 'Continue'
                $taskDirectoryLine = & $taskJcmd $taskProcess.ProcessId VM.system_properties 2>$null | Where-Object { $_ -like 'user.dir=*' } | Select-Object -First 1
            } finally { $ErrorActionPreference = $taskPreviousPreference }
            if ($taskDirectoryLine) {
                $taskWorkingDirectory = $taskDirectoryLine.Substring('user.dir='.Length).Replace('\:', ':').Replace('\\', '\').Replace('/', '\')
                $taskOwnsBackend = $taskWorkingDirectory -eq (Join-Path $taskRoot 'backend')
            }
        }
    }
    $taskMavenParent = $null
    if (-not $taskOwnsBackend -and $taskCommand.Contains('com.virtualcompany.VirtualCompanyApplication')) {
        $taskParent = Get-CimInstance Win32_Process -Filter "ProcessId=$($taskProcess.ParentProcessId)"
        $taskExpectedModule = '-Dmaven.multiModuleProjectDirectory=' + (Join-Path $taskRoot 'backend')
        if ($taskParent -and $taskParent.CommandLine -and $taskParent.CommandLine.Contains($taskExpectedModule) -and $taskParent.CommandLine.Contains('spring-boot:run')) {
            $taskOwnsBackend = $true
            $taskMavenParent = $taskParent.ProcessId
        }
    }
    if (-not $taskOwnsBackend) { throw 'Port 8080 belongs to another process. Stop it manually or choose another port.' }
    if ($CheckBackendOwner) { Write-Output 'Verified: port 8080 belongs to this workspace DevSim backend. No process was stopped.'; exit 0 }
    if ($taskMavenParent) { Stop-Process -Id $taskMavenParent -Force }
    Stop-Process -Id $taskListener.OwningProcess -Force
    $taskListener = $null
}
if ($Build) {
    & mvn.cmd "-Dmaven.repo.local=$taskRoot/.m2/repository" -f "$taskRoot/backend/pom.xml" -q test package
    if ($LASTEXITCODE -ne 0) { throw 'Backend build/tests failed.' }
}
if (-not $taskListener) {
    $taskJar = Join-Path $taskRoot 'backend/target/virtualcompany-backend-0.0.1-SNAPSHOT.jar'
    if (-not (Test-Path -LiteralPath $taskJar)) { throw 'Run this script with -Build first.' }
    Start-Process -FilePath (Get-Command java.exe).Source -ArgumentList @('-jar', $taskJar, '--server.address=127.0.0.1') -WorkingDirectory "$taskRoot/backend" -WindowStyle Hidden -RedirectStandardOutput "$taskLogs/backend.log" -RedirectStandardError "$taskLogs/backend-error.log" | Out-Null
}
if (-not (Get-NetTCPConnection -State Listen -LocalPort 3000 -ErrorAction SilentlyContinue)) {
    Start-Process -FilePath (Get-Command node.exe).Source -ArgumentList @("$taskRoot/frontend/node_modules/next/dist/bin/next", 'dev', '-p', '3000', '-H', '127.0.0.1') -WorkingDirectory "$taskRoot/frontend" -WindowStyle Hidden -RedirectStandardOutput "$taskLogs/frontend.log" -RedirectStandardError "$taskLogs/frontend-error.log" | Out-Null
}
Write-Output 'Frontend: http://localhost:3000'
Write-Output 'Onboarding: http://localhost:3000/onboarding'
Write-Output 'Admin: http://localhost:3000/super-admin'
Write-Output "Local logs: $taskLogs"

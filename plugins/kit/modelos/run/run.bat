<# :
@echo off
rem Padrao do kit: ver docs/padroes/RUN.md. Nao edite este arquivo; edite run.config.
setlocal
set "RUN_ARQUIVO=%~f0"
set "RUN_RAIZ=%~dp0"
set "RUN_ARGS=%*"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-Expression ([System.IO.File]::ReadAllText($env:RUN_ARQUIVO))"
exit /b %ERRORLEVEL%
#>

# ---------------------------------------------------------------------------
# run.bat - sobe, encerra e consulta os servicos do projeto listados em run.config
#   run.bat                  encerra instancias antigas e sobe tudo
#   run.bat start [nome]     o mesmo, para um servico
#   run.bat stop [nome]      encerra
#   run.bat restart [nome]   encerra e sobe
#   run.bat status           mostra o que esta rodando
#   run.bat logs <nome>      acompanha o log de um servico
#   --forcar                 encerra tambem processo de fora que ocupa a porta
# ---------------------------------------------------------------------------
$ErrorActionPreference = 'Stop'
$raiz = $env:RUN_RAIZ.TrimEnd('\')
$itens = @()
if ($env:RUN_ARGS) { $itens = @($env:RUN_ARGS -split '\s+' | Where-Object { $_ }) }
$forcar = $itens -contains '--forcar'
$itens = @($itens | Where-Object { $_ -ne '--forcar' })
$acao = 'start'
if ($itens.Count -ge 1) { $acao = $itens[0].ToLower() }
$alvo = $null
if ($itens.Count -ge 2) { $alvo = $itens[1] }
$pastaRun = Join-Path $raiz '.run'
$pastaLogs = Join-Path $raiz 'logs'

function Sair($codigo, $mensagem) {
    if ($mensagem) { Write-Host $mensagem }
    exit $codigo
}

function Ler-Config {
    $arquivo = Join-Path $raiz 'run.config'
    if (-not (Test-Path -LiteralPath $arquivo)) { Sair 1 'run.config nao encontrado ao lado do run.bat.' }
    $lista = @()
    $n = 0
    foreach ($linha in [System.IO.File]::ReadAllLines($arquivo)) {
        $n++
        $t = $linha.Trim()
        if (-not $t -or $t.StartsWith('#')) { continue }
        $partes = $t -split '\|', 3
        if ($partes.Count -lt 3) { Sair 1 "run.config linha ${n}: use  nome | porta | comando" }
        $nome = $partes[0].Trim()
        if ($nome -notmatch '^[A-Za-z0-9_-]+$') { Sair 1 "run.config linha ${n}: nome invalido '$nome' (use letras, numeros, - e _)" }
        $porta = 0
        $p = $partes[1].Trim()
        if ($p -and $p -ne '-') {
            if ($p -notmatch '^\d+$') { Sair 1 "run.config linha ${n}: porta invalida '$p' (use um numero ou -)" }
            $porta = [int]$p
        }
        $comando = $partes[2].Trim()
        if (-not $comando) { Sair 1 "run.config linha ${n}: comando vazio" }
        $lista += New-Object PSObject -Property @{ Nome = $nome; Porta = $porta; Comando = $comando }
    }
    if ($lista.Count -eq 0) { Sair 1 'run.config nao tem nenhum servico.' }
    return ,$lista
}

function Arquivo-Pid($nome) { Join-Path $pastaRun "$nome.pid" }

# Devolve o processo gravado no .pid, somente se ainda for o mesmo (PID e hora de inicio).
function Processo-Do-Servico($nome) {
    $arquivo = Arquivo-Pid $nome
    if (-not (Test-Path -LiteralPath $arquivo)) { return $null }
    try {
        $dados = ([System.IO.File]::ReadAllText($arquivo)).Trim() -split '\|'
        $proc = Get-Process -Id ([int]$dados[0]) -ErrorAction SilentlyContinue
        if (-not $proc) { return $null }
        if ($proc.StartTime.Ticks -ne [long]$dados[1]) { return $null }
        return $proc
    } catch {
        return $null
    }
}

function Encerrar-Pid($id) {
    cmd /c "taskkill /PID $id /T /F >nul 2>&1"
    for ($i = 0; $i -lt 20; $i++) {
        if (-not (Get-Process -Id $id -ErrorAction SilentlyContinue)) { return }
        Start-Sleep -Milliseconds 250
    }
}

function Dono-Da-Porta($porta) {
    if ($porta -le 0) { return 0 }
    try {
        $c = Get-NetTCPConnection -LocalPort $porta -State Listen -ErrorAction Stop | Select-Object -First 1
        if ($c) { return [int]$c.OwningProcess }
    } catch { }
    foreach ($l in (cmd /c "netstat -ano -p tcp 2>nul")) {
        if ($l -match "[:.]$porta\s+\S+\s+LISTENING\s+(\d+)\s*$") { return [int]$Matches[1] }
    }
    return 0
}

function Parar($svc) {
    $proc = Processo-Do-Servico $svc.Nome
    if ($proc) {
        Encerrar-Pid $proc.Id
        Write-Host "[$($svc.Nome)] encerrado (PID $($proc.Id))."
    } else {
        Write-Host "[$($svc.Nome)] nao estava rodando."
    }
    $arquivo = Arquivo-Pid $svc.Nome
    if (Test-Path -LiteralPath $arquivo) { Remove-Item -LiteralPath $arquivo -Force }
}

function Mostrar-Fim-Do-Log($log) {
    if (Test-Path -LiteralPath $log) {
        Write-Host '--- ultimas linhas do log ---'
        Get-Content -LiteralPath $log -Tail 15 | ForEach-Object { Write-Host $_ }
        Write-Host '-----------------------------'
    }
}

function Iniciar($svc) {
    $nome = $svc.Nome
    $antigo = Processo-Do-Servico $nome
    if ($antigo) {
        Encerrar-Pid $antigo.Id
        Write-Host "[$nome] instancia antiga encerrada (PID $($antigo.Id))."
    }
    $dono = Dono-Da-Porta $svc.Porta
    if ($dono -gt 0) {
        $quem = (Get-Process -Id $dono -ErrorAction SilentlyContinue).ProcessName
        if ($forcar) {
            Encerrar-Pid $dono
            Write-Host "[$nome] porta $($svc.Porta) liberada: encerrado PID $dono ($quem)."
        } else {
            Write-Host "[$nome] NAO INICIADO: a porta $($svc.Porta) esta ocupada por PID $dono ($quem), que nao e deste projeto."
            Write-Host "       Encerre esse processo ou rode: run.bat start $nome --forcar"
            return $false
        }
    }
    New-Item -ItemType Directory -Force -Path $pastaRun, $pastaLogs | Out-Null
    $log = Join-Path $pastaLogs "$nome.log"
    Add-Content -LiteralPath $log -Value "==== inicio $((Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')) ===="
    $comando = $svc.Comando
    if (Test-Path -LiteralPath (Join-Path $raiz '.venv\Scripts\activate.bat')) {
        $comando = 'call ".venv\Scripts\activate.bat" && ' + $comando
    }
    $linha = "$comando >> `"logs\$nome.log`" 2>&1"
    $proc = Start-Process -FilePath $env:ComSpec -ArgumentList "/d /s /c `"$linha`"" -WorkingDirectory $raiz -WindowStyle Hidden -PassThru
    [System.IO.File]::WriteAllText((Arquivo-Pid $nome), "$($proc.Id)|$($proc.StartTime.Ticks)")

    $respondeu = $false
    for ($i = 0; $i -lt 20; $i++) {
        Start-Sleep -Milliseconds 500
        if ($proc.HasExited) {
            Write-Host "[$nome] FALHOU: o processo encerrou logo apos iniciar."
            Mostrar-Fim-Do-Log $log
            Remove-Item -LiteralPath (Arquivo-Pid $nome) -Force -ErrorAction SilentlyContinue
            return $false
        }
        if ($svc.Porta -le 0) { if ($i -ge 3) { $respondeu = $true; break } }
        elseif ((Dono-Da-Porta $svc.Porta) -gt 0) { $respondeu = $true; break }
    }
    if ($svc.Porta -gt 0 -and $respondeu) {
        Write-Host "[$nome] rodando (PID $($proc.Id), porta $($svc.Porta)). Log: logs\$nome.log"
    } elseif ($svc.Porta -gt 0) {
        Write-Host "[$nome] iniciado (PID $($proc.Id)), mas a porta $($svc.Porta) ainda nao respondeu. Veja: run.bat logs $nome"
    } else {
        Write-Host "[$nome] rodando (PID $($proc.Id)). Log: logs\$nome.log"
    }
    return $true
}

function Estado($svc) {
    $proc = Processo-Do-Servico $svc.Nome
    $texto = 'parado'
    if ($proc) { $texto = "rodando (PID $($proc.Id))" }
    if ($svc.Porta -gt 0) {
        $dono = Dono-Da-Porta $svc.Porta
        if ($dono -gt 0) { $texto += ", porta $($svc.Porta) em uso por PID $dono" } else { $texto += ", porta $($svc.Porta) livre" }
    }
    Write-Host "[$($svc.Nome)] $texto"
}

$servicos = Ler-Config
if ($alvo) {
    $servicos = @($servicos | Where-Object { $_.Nome -eq $alvo })
    if ($servicos.Count -eq 0) { Sair 1 "Servico '$alvo' nao esta no run.config." }
}

switch ($acao) {
    { $_ -eq 'start' -or $_ -eq 'restart' } {
        $falhas = 0
        foreach ($s in $servicos) { if (-not (Iniciar $s)) { $falhas++ } }
        if ($falhas -gt 0) { Sair 1 "$falhas servico(s) nao iniciaram." }
        Sair 0 $null
    }
    'stop' {
        foreach ($s in $servicos) { Parar $s }
        Sair 0 $null
    }
    'status' {
        foreach ($s in $servicos) { Estado $s }
        Sair 0 $null
    }
    'logs' {
        if (-not $alvo) { Sair 1 'Use: run.bat logs <nome>' }
        $log = Join-Path $pastaLogs "$alvo.log"
        if (-not (Test-Path -LiteralPath $log)) { Sair 1 "Ainda nao ha log para '$alvo'." }
        Get-Content -LiteralPath $log -Tail 30 -Wait
    }
    default {
        Sair 1 'Use: run.bat [start|stop|restart|status] [nome] [--forcar]  ou  run.bat logs <nome>'
    }
}

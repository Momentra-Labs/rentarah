# Generates a SCRATCH voice-over with the built-in Windows speech engine so the
# edit can be timed and reviewed. Replace assets/vo/line*.wav with a
# professional recording (same file names) before publishing, then re-export.
#
#   powershell -ExecutionPolicy Bypass -File promo/coming-soon/tools/make-scratch-vo.ps1
param([string]$Voice = 'Microsoft David Desktop', [int]$Rate = 0)

Add-Type -AssemblyName System.Speech
$out = Join-Path $PSScriptRoot '..\assets\vo'
New-Item -ItemType Directory -Force $out | Out-Null

# start = seconds into the 45 s cut. "Rentarah" is spelled phonetically for the engine.
$lines = @(
  @{ file = 'line1.wav'; start = 0.8;  text = "Finding the perfect ride shouldn't be complicated." },
  @{ file = 'line2.wav'; start = 8.3;  text = 'Introducing Renta-rah. A new way to discover your next ride.' },
  @{ file = 'line3.wav'; start = 15.4; text = 'For everyday drives, weekend escapes, and every adventure in between.' },
  @{ file = 'line4.wav'; start = 25.8; text = 'Because every destination holds a story. And every journey begins with a choice.' },
  @{ file = 'line5.wav'; start = 37.6; rate = 2; text = 'Renta-rah. Your journey. Your choice. Coming soon. By Momentra Labs.' }
)

$fmt = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(48000, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)
$manifest = @()
foreach ($l in $lines) {
  $s = New-Object System.Speech.Synthesis.SpeechSynthesizer
  $s.SelectVoice($Voice)
  $s.Rate = $(if ($l.rate) { $l.rate } else { $Rate })
  $path = Join-Path $out $l.file
  $s.SetOutputToWaveFile($path, $fmt)
  $s.Speak($l.text)
  $s.Dispose()
  $bytes = (Get-Item $path).Length
  $secs = [math]::Round(($bytes - 44) / 96000, 2)
  Write-Output ("{0}  start {1,5}s  length {2,5}s  ends {3,5}s" -f $l.file, $l.start, $secs, ($l.start + $secs))
  $manifest += [ordered]@{ file = $l.file; start = $l.start; text = $l.text }
}
[ordered]@{ note = 'SCRATCH voice-over (Windows speech). Replace the WAVs with a professional recording, same names/timings.'; lines = $manifest } |
  ConvertTo-Json -Depth 4 | Out-File -Encoding utf8 (Join-Path $out 'manifest.json')

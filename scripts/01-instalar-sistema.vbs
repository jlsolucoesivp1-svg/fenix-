Set shell = CreateObject("WScript.Shell")
scriptDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
rootDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(scriptDir)
powerShellExe = shell.ExpandEnvironmentStrings("%SystemRoot%") & "\System32\WindowsPowerShell\v1.0\powershell.exe"
command = Chr(34) & powerShellExe & Chr(34) & " -ExecutionPolicy Bypass -NoProfile -STA -File " & Chr(34) & rootDir & "\ferramentas\fenix-actions.ps1" & Chr(34) & " -Action install"
shell.Run command, 1, False

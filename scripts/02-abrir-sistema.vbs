Set shell = CreateObject("WScript.Shell")
scriptDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
rootDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(scriptDir)
command = "powershell -ExecutionPolicy Bypass -NoProfile -STA -File " & Chr(34) & rootDir & "\ferramentas\fenix-actions.ps1" & Chr(34) & " -Action open"
shell.Run command, 0, False

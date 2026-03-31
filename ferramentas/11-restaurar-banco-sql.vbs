Set shell = CreateObject("WScript.Shell")
scriptDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
command = "powershell -ExecutionPolicy Bypass -NoProfile -STA -File " & Chr(34) & scriptDir & "\fenix-actions.ps1" & Chr(34) & " -Action restore"
shell.Run command, 0, False

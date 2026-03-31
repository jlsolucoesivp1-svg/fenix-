Set shell = CreateObject("WScript.Shell")
scriptDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
rootDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(scriptDir)
command = Chr(34) & rootDir & "\ferramentas\00-abrir-fenix-app.bat" & Chr(34)
shell.Run command, 0, False

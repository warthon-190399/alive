' Arranca el servidor de alive sin abrir ninguna ventana.
' El registro queda en data\alive-server.log
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
root = fso.GetParentFolderName(fso.GetParentFolderName(WScript.ScriptFullName))
sh.CurrentDirectory = root
If Not fso.FolderExists(root & "\data") Then fso.CreateFolder(root & "\data")
sh.Run "cmd /c npm start -- -p 3333 > data\alive-server.log 2>&1", 0, False

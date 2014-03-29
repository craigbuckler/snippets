<%
dim file, filepath, filename, ext, mime, thistype, fso, fileexists, p
file = trim(Request("file"))
fileexists = false

if file <> "" then

	' find file location from root
	p = instr(file, "://")
	if (p > 0) then	file = right(file, len(file)-instr(p+3, file, "/")+1)

	' find file system name
	filepath = Server.MapPath(file)

	' find filename
	filename = right(file, len(file)-instrrev(file, "/"))

	' find extension
	ext = lcase(right(filename, len(filename)-instrrev(filename, ".")))

	' does file exist?
	set fso = CreateObject("Scripting.FileSystemObject")
	fileexists = fso.FileExists(filepath)
	set fso = nothing

	' define MIME types
	set mime = CreateObject("Scripting.Dictionary")
	mime.Add "mp3", "audio/mp3"
	mime.Add "wav", "audio/x-wav"
	mime.Add "wma", "audio/x-ms-wma"
	mime.Add "ogg", "audio/x-ogg"
	mime.Add "mid", "audio/x-midi"
	mime.Add "mpg", "video/mpeg"
	mime.Add "mpeg", "video/mpeg"
	mime.Add "avi", "video/x-msvideo"
	mime.Add "wmv", "video/x-ms-wmv"
	mime.Add "mov", "video/quicktime"
	mime.Add "qt", "video/quicktime"
	
	mime.Add "pdf", "application/pdf"
	mime.Add "doc", "application/msword"
	mime.Add "xls", "application/ms-excel"
	mime.Add "ppt", "application/ms-powerpoint"
	mime.Add "txt", "text/plain"
	mime.Add "rtf", "application/rtf"
	
	mime.Add "exe", "application/octet-stream"
	mime.Add "msi", "application/octet-stream"
	mime.Add "iso", "application/octet-stream"
	mime.Add "zip", "application/zip"
	mime.Add "tar", "application/x-tar"
	mime.Add "gz", "application/x-gzip"
	mime.Add "rar", "application/rar"
	mime.Add "lha", "application/lha"
	mime.Add "jar", "application/x-java-archive"

	' find mime type
	if mime.Exists(ext) then thistype = mime.Item(ext)
	else thistype = "application/force-download"

end if

' debug
'Response.Write("<p>File to download: " & file)
'Response.Write("<p>location: " & filepath)
'Response.Write("<p>filename: " & filename)
'Response.Write("<p>ext: " & ext & " = " & thistype)
'Response.End

if fileexists then

	Response.Addheader "Pragma","no-cache"
	Response.Addheader "Expires","0"
	Response.Addheader "Content-Disposition","attachment; filename=""" & filename &""""
	Response.ContentType = thistype
	Response.CacheControl = "public, must-revalidate"
	
	' send file
	Dim fStream
	Set fStream = Server.CreateObject("ADODB.Stream")
	fStream.Open
	fStream.Type = 1
	fStream.LoadFromFile filepath
	Response.BinaryWrite fStream.read
	Set fStream = Nothing

else

	' file not found
	Response.Status="404 Not Found"
	response.write "<!DOCTYPE html PUBLIC ""-//W3C//DTD XHTML 1.1//EN"" ""http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"">"
	response.write "<html xmlns=""http://www.w3.org/1999/xhtml"" xml:lang=""en""><head><meta http-equiv=""content-type"" content=""application/xhtml+xml; charset=iso-8859-1"" /><title>file not found</title></head><body>"
	response.write "<h1>file not found</h1><p>Sorry, but the file you requested could not be found.</p><p>Please click back to return to the page you were viewing.</p>"
	response.write "</body></html>"

end if

Response.End
%>
<%
' Implements a web service that sums any parameters passed on the querystring (GET only)
Option Explicit
Response.Buffer = true

' fetch all arguments
Dim args
args = Array(0)
dim arg, thisarg

for each arg in Request.QueryString
	On Error Resume Next
	thisarg = cint(Request.QueryString(arg))
	if Err.Number = 0 then
		redim preserve args(UBound(args)+1)
		args(UBound(args)) = thisarg
	end if
	Err.Clear
next

' output XML response
Response.ContentType = "text/xml"
Response.Write "<" & "?xml version=""1.0"" ?" & ">" & vbCrLf
Response.Write "<Sum>" & vbCrLf
Response.Write vbTab & "<Arguments>" & vbCrLf
dim i, total
total = 0
for i = 1 to UBound(args)
	total = total + args(i)
	Response.Write vbTab & vbTab & "<Arg>" & args(i) & "</Arg>" & vbCrLf
next
Response.Write vbTab & "</Arguments>" & vbCrLf
Response.Write vbTab & "<Total>" & total & "</Total>" & vbCrLf
Response.Write "</Sum>" & vbCrLf

' pause
dim WaitObj
Set WaitObj = Server.CreateObject ("WaitFor.Comp")
WaitObj.WaitForSeconds 0
Set WaitObj = nothing

Response.Flush
%>
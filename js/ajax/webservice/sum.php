<?
// Implements a web service that sums any parameters passed on the querystring (GET only)
ob_start();

// fetch all arguments
$args = Array();
foreach ($_GET as $arg) {
	if (get_magic_quotes_gpc()) $arg=stripslashes($arg);
	if (is_numeric($arg)) $args[] = $arg;
}

// output XML response
header('Content-type: text/xml');
print '<'.'?xml version="1.0" ?'.">\n";
print "<Sum>\n";
print "\t<Arguments>\n";
$total = 0;
foreach($args as $arg) {
	print "\t\t<Arg>$arg</Arg>\n";
	$total += $arg;
}
print "\t</Arguments>\n";
print "\t<Total>$total</Total>\n";
print "</Sum>\n";

ob_end_flush();

// output headers to log
/*
if ($fp=fopen('log.txt', 'w')) {
	foreach($_SERVER as $key => $value) fwrite($fp, "$key : $value\n");
	fclose($fp);
}
*/
?>
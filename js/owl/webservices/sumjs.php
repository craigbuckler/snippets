<?php
// Implements a web service that sums any parameters passed on the querystring (GET only)
// returns a JavaScript response
ob_start();

// fetch all GET arguments
$args = Array();
foreach ($_GET as $name => $value) {
	if ($name != 'ajax') {
		if (get_magic_quotes_gpc()) $value = stripslashes($value);
		if (is_numeric($value)) $args[] = intval($value);
	}
}

sleep(2);

// output XML response
header('Content-type: text/javascript');
$total = 0;
$ap = '';
foreach($args as $arg) {
	$ap .= $arg.',';
	$total += $arg;
}
print 'var argpassed = ['.substr($ap, 0, -1)."];\n";
print "var argtotal = $total;\n";

ob_end_flush();

// output headers to log
/*
if ($fp=fopen('log.txt', 'w')) {
	foreach($_SERVER as $key => $value) fwrite($fp, "$key : $value\n");
	fclose($fp);
}
*/
?>
<?php
// get filename
$file = $_GET['file'];
$fileexists = false;

if (strlen($file) > 0) {

	// find file location from root
	$p = strpos($file, '://');
	if ($p > 0) $file = substr($file, strpos($file, '/', $p+3)+1);

	// find physical file location
	$filepath = str_repeat('../', substr_count($_SERVER["PHP_SELF"], '/')-1).$file;
	$filepath = realpath($filepath);

	// find filename
	$filename = substr(strrchr($file,'/'),1);

	// find extension
	$ext = strtolower(substr(strrchr($file,'.'),1));

	// does file exist
	$fileexists = file_exists($filepath);
	
	// determine mime type
	switch($ext)
	{
		case "mp3": $mime="audio/mp3"; break;
		case "wav": $mime="audio/x-wav"; break;
		case "wma": $mime="audio/x-ms-wma"; break;
		case "ogg": $mime="audio/x-ogg"; break;
		case "mid": $mime="audio/x-midi"; break;
		case "mpg": $mime="video/mpeg"; break;
		case "mpeg": $mime="video/mpeg"; break;
		case "avi": $mime="video/x-msvideo"; break;
		case "wmv": $mime="video/x-ms-wmv"; break;
		case "mov": $mime="video/quicktime"; break;
		case "qt": $mime="video/quicktime"; break;
		
		case "pdf": $mime="application/pdf"; break;
		case "doc": $mime="application/msword"; break;
		case "xls": $mime="application/ms-excel"; break;
		case "ppt": $mime="application/ms-powerpoint"; break;
		case "txt": $mime="text/plain"; break;
		case "rtf": $mime="application/rtf"; break;
		
		case "exe": $mime="application/octet-stream"; break;
		case "msi": $mime="application/octet-stream"; break;
		case "iso": $mime="application/octet-stream"; break;
		case "zip": $mime="application/zip"; break;
		case "tar": $mime="application/x-tar"; break;
		case "gz": $mime="application/x-gzip"; break;
		case "rar": $mime="application/rar"; break;
		case "lha": $mime="application/lha"; break;
		case "jar": $mime="application/x-java-archive"; break;

		default: $mime="application/force-download"; break;
	}

}

/*
// debug
echo("<p>file: $file</p>");
echo("<p>filepath: $filepath</p>");
echo("<p>filename: $filename</p>");
echo("<p>ext: $ext</p>");
echo("<p>fileexists: $fileexists</p>");
echo("<p>mime: $mime</p>");
*/

if ($fileexists) {

	if(ini_get('zlib.output_compression')) ini_set('zlib.output_compression', 'Off');
	header('Pragma: public');
	header('Expires: 0');
	header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
	header('Cache-Control: private',false);
	header("Content-Type: $mime");
	header("Content-Disposition: attachment; filename=\"$filename\"");
	header("Content-Transfer-Encoding: binary");
	header("Content-Length: ".filesize($filepath));
	readfile($filepath);

}
else {

	// file not found
	header('HTTP/1.0 404 Not Found');
	echo('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">');
	echo('<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en"><head><meta http-equiv="content-type" content="application/xhtml+xml; charset=iso-8859-1" /><title>file not found</title></head><body>');
	echo('<h1>file not found</h1><p>Sorry, but the file you requested could not be found.</p><p>Please click back to return to the page you were viewing.</p>');
	echo('</body></html>');

}

exit();
?>
    
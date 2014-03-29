<?php
date_default_timezone_set('Europe/London');

require("ow-twitter-feed.php");

function add_shortcode($name, $func) { }

$t = new TwitterStatus('craigbuckler', 5);
$feed = $t->Render();

echo $feed;
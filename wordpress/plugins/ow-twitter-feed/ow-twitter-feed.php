<?php
/*
Plugin Name: OptimalWorks Twitter Feed
Plugin URI: http://optimalworks.net/
Description: Adds latest tweets via a shortcode.
Version: 1.2
Author: Craig Buckler
Author URI: http://optimalworks.net/
License: OptimalWorks
*/

class TwitterStatus
{

	// Twitter OAuth
	private $Tconsumerkey = "n5iUC8mNUgwuZuCXIoAAQ";
	private $Tconsumersecret = "giUqCugYGXS4niN5tIZMKOXXYPEtX12G4XqMRRKi6DE";
	private $Taccesstoken = "18670151-R6xHDixPxvKjn538C2nydhwmibdraJqU9JBpeiHvK";
	private $Taccesstokensecret = "jkxAByaLt97B8VRV56V2LQLpB5WCxK78aOYxPkMRetE";

	public $ID;				// twitter user name
	public $Count;				// tweets to fetch
	public $WidgetTemplate;	// widget template
	public $TweetTemplate;		// template for each tweet
	public $ParseLinks;		// parse links in Twitter status
	public $DateFormat;		// PHP or "friendly" dates
	public $CacheFor;			// number of seconds to cache feed

	private $cache;			// location of cache files


	// ______________________________________________
	// constructor
	public function __construct($id = null, $count = 0) {

		// constants
		$this->cache = __DIR__ . '/cache/';	// cache location
		$this->CacheFor = 1800;					// cache feed for 30 minutes

		$this->ID = $id;
		$this->Count = $count;
		$this->ParseLinks = true;
		$this->DateFormat = 'friendly';

		// default widget template
		$this->WidgetTemplate =
			'<div class="twitterstatus">' .
			'<a href="http://twitter.com/{screen_name}"><img src="{profile_image_url}" /><h2>Latest from {name} <em>@{screen_name}</em></h2></a>' .
			'<ul>{TWEETS}</ul>' .
			'</div>';

		// default tweet template
		$this->TweetTemplate =
			'<li><p>{text}</p>' .
			'<p class="twittercontrols"><a href="https://twitter.com/intent/tweet?in_reply_to={id_str}" class="reply">reply</a> ' .
			'<a href="https://twitter.com/intent/retweet?tweet_id={id_str}" class="retweet">retweet</a> ' .
			'<a href="https://twitter.com/intent/favorite?tweet_id={id_str}" class="favourite">favourite</a> ' .
			'<em>{created_at}</em>' .
			'</p></li>';

	}


	// ______________________________________________
	// returns formatted feed widget
	public function Render() {

		// returned HTML string
		$render = '';

		// cached file available?
		$cache = $this->cache . $this->ID . '-' . $this->Count . '.html';
		$cacheage = (file_exists($cache) ? time() - filemtime($cache) : -1);

		if ($cacheage < 0 || $cacheage > $this->CacheFor) {

			// fetch feed
			$json = $this->FetchFeed();
			if ($json) {

				$widget = '';
				$status = '';

				// examine all tweets
				for ($t = 0, $tl = count($json); $t < $tl; $t++) {

					// parse widget template
					if ($t == 0) {
						$widget .= $this->ParseStatus($json[$t], $this->WidgetTemplate);
					}

					// parse tweet
					$status .= $this->ParseStatus($json[$t], $this->TweetTemplate);
				}

				// parse Twitter links
				$render = str_replace('{TWEETS}', $status, $widget);

				// rendering failure?
				if (strpos($render, $this->WidgetTemplate) !== false || strpos($render, $this->TweetTemplate) !== false) {

					// log error data
					file_put_contents($this->cache . $this->ID . '-' . $this->Count . '.log', date('Y-m-d H:i:s') . "\n$render\n" . var_export($json, true) . "\n\n", FILE_APPEND);

					// read current cache file
					if ($cacheage > 0) $render = file_get_contents($cache);
					else $render = '';

				}

				// update cache file
				$render = trim($render);
				file_put_contents($cache, $render);

			}

		}

		// fetch from cache
		if ($render == '' && $cacheage > 0) {
			$render = file_get_contents($cache);
		}

		return ($render ? $this->ParseDates($render) : '');

	}


	// ______________________________________________
	// returns JSON-formatted status feed or false on failure
	private function FetchFeed() {

		$r = false;
		if ($this->ID != '' && $this->Count > 0) {

			// OAuth functionality
			require("oauth/twitteroauth.php");
			$connection = new TwitterOAuth($this->Tconsumerkey, $this->Tconsumersecret, $this->Taccesstoken, $this->Taccesstokensecret);

			// fetch JSON feed as array
			$r = $connection->get("https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name=" . $this->ID . '&include_rts=1&count=' . $this->Count);

		}

		return $r;
	}


	// ______________________________________________
	// parses tweet data
	private function ParseStatus($data, $template) {

		// replace all {tags}
		preg_match_all('/{(.+)}/U', $template, $m);
		for ($i = 0, $il = count($m[0]); $i < $il; $i++) {

			$name = $m[1][$i];

			// Twitter value found?
			$d = false;

			if (isset($data[$name])) {
				$d = $data[$name];
			}
			else if (isset($data['user'][$name])) {
				$d = $data['user'][$name];
			}

			// replace data
			if ($d) {

				switch ($name) {

					// parse status links
					case 'text':
						if ($this->ParseLinks) {
							$d = $this->ParseTwitterLinks($d);
						}
						break;

					// tweet date
					case 'created_at':
						$d = "{DATE:$d}";
						break;

				}

				$template = str_replace($m[0][$i], $d, $template);

			}

		}

		return $template;

	}


	// ______________________________________________
	// parses Twitter links
	private function ParseTwitterLinks($str) {

		// parse URL
		$str = preg_replace('/(https{0,1}:\/\/[\w\-\.\/#?&=]*)/', '<a href="$1">$1</a>', $str);

		// parse @id
		$str = preg_replace('/@(\w+)/', '@<a href="http://twitter.com/$1" class="at">$1</a>', $str);

		// parse #hashtag
		$str = preg_replace('/\s#(\w+)/', ' <a href="http://twitter.com/#!/search?q=%23$1" class="hashtag">#$1</a>', $str);

		return $str;

	}


	// ______________________________________________
	// parses Tweet dates
	private function ParseDates($str) {

		// current datetime
		$now = new DateTime();

		preg_match_all('/{DATE:(.+)}/U', $str, $m);
		for ($i = 0, $il = count($m[0]); $i < $il; $i++) {

			$stime = new DateTime($m[1][$i]);

			if ($this->DateFormat == 'friendly') {

				// friendly date format
				$ival = $now->diff($stime);

				$yr = $ival->y;
				$mh = $ival->m + ($ival->d > 15);
				if ($mh > 11) $yr = 1;
				$dy = $ival->d + ($ival->h > 15);
				$hr = $ival->h;
				$mn = $ival->i + ($ival->s > 29);

				if ($yr > 0) {
					if ($yr == 1) $date = 'last year';
					else $date = $yr . ' years ago';
				}
				else if ($mh > 0) {
					if ($mh == 1) $date = 'last month';
					else $date = $mh . ' months ago';
				}
				else if ($dy > 0) {
					if ($dy == 1) $date = 'yesterday';
					else if ($dy < 8) $date = $dy . ' days ago';
					else if ($dy < 15) $date = 'last week';
					else $date = round($dy / 7) . ' weeks ago';
				}
				else if ($hr > 0) {
					$hr += ($ival->i > 29);
					$date = $hr . ' hour' . ($hr == 1 ? '' : 's') . ' ago';
				}
				else {
					if ($mn < 3) $date = 'just now';
					else $date = $mn . ' minutes ago';
				}

			}
			else {
				// standard PHP date format
				$date = $stime->format($this->DateFormat);
			}

			// replace date
			$str = str_replace($m[0][$i], $date, $str);

		}

		return $str;
	}

}


// ________________________________________________________
// add twitter feed
// show news
function GetTwitterFeed($params = array()) {

	extract(shortcode_atts(array(
		'id' => '',
		'count' => 5
	), $params));

	if ($id) {
		$t = new TwitterStatus($id, $count);
		$feed = $t->Render();
	}
	else $feed = '';

	return $feed;

}
add_shortcode('twitter', 'GetTwitterFeed');
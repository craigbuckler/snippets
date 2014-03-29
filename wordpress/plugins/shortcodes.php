<?php
/*
Plugin Name: Shortcodes
Plugin URI: http://optimalworks.net/
Description: Adds useful shortcodes to WordPress.
Version: 1.0
Author: Craig Buckler
Author URI: http://optimalworks.net/
License: OptimalWorks
*/


// return latest posts
function OW_ShowPosts($params = array()) {

	// page ID
	global $id;

	extract(shortcode_atts(array(
		'start' => 1,
	    'articles' => 3,
		'catid' => '',
		'tagid' => '',
		'exclude' => '',
		'maxlength' => 250,
		'wrapper' => 'li',
		'titletag' => 'strong',
		'paratag' => 'span',
		'datetag' => 'p',
		'dateclass' => 'date',
		'exclass' => 'ex',
		'showdate' => true,
		'imagefirst' => false,
		'imagealt' => ''
	), $params));

	$p = array();
	$p['showposts'] = ($start+$articles-1);
	if ($catid) $p['cat__in'] = $catid;
	if ($tagid) $p['tag__in'] = $tagid;
	if ($exclude) $p['post__not_in'] = $exclude;
	
	// find posts
	$q = new WP_Query($p);
	$posts = '';
	$item = 0;

	// the loop
	while ($q->have_posts()) {

		$q->the_post();
		$item++;
		if ($post->ID != $id && $item >= $start) {

			$ex = str_replace(array('<br />', ' [...]'), array('', ''), get_the_excerpt());
			$nex = trim(wordwrap($ex, $maxlength)) . "\n";
			$nex = substr($nex, 0, strpos($nex, "\n"));
			$ex = $nex . (strlen($ex) == strlen($nex) ? '' : '&hellip;');

			// thumbnail
			$img = OW_GetThumbnail();
			if (!$img) $img = $imagealt;
			$img .= "\n";

			// time
			$time = ($datetag == 'time' ? ' datetime="' . get_the_date('Y-m-d') . '"' : '');
			
			$posts .= "<$wrapper>" .
				'<a href="' . get_permalink() . "\">\n" .
				($imagefirst ? $img : '') .
				"<$titletag>" . the_title('','',false) . "</$titletag>\n" .
				($imagefirst ? '' : $img) .
				($showdate ? "<$datetag" . $time . ($dateclass ? " class=\"$dateclass\">" : '>') . get_the_date() . "</$datetag>\n" : '') .
				"<$paratag" . ($exclass ? " class=\"$exclass\">" : '>') . $ex . "</$paratag>\n" .
				"</a></$wrapper>\n";

		}
	}

	return str_replace(BLOGURL, '', $posts);
}


// page link
function OW_PageExcerpt($params = array()) {

	extract(shortcode_atts(array(
		'slug' => '',
		'imagetop' => false,
		'imagefirst' => true,
		'imagealt' => '',
		'container' => '',
		'class' => ''
	), $params));
	
	$ret = '';
	if ($slug == '') return $ret;

	// container
	if ($class != '' && $container == '') $container = 'div';
	$cstart = '';
	$cend = '';
	if ($container) {
		$cstart = '<' . $container . ($class ? ' class="' . $class . '"' : '') . '>';
		$cend = '</' . $container . '>';
	}
	
	// find page/post from slug
	$q = new WP_Query("pagename=$slug");
	if (!$q->have_posts()) {
		$q = new WP_Query("name=$slug");
	}

	// the loop
	while ($q->have_posts()) {

		$q->the_post();
		$ispost = has_excerpt();

		// link
		$link = get_permalink();
		
		// title
		$title = the_title('','',false);

		// thumbnail
		$img = OW_GetThumbnail();
		if (!$img) $img = $imagealt;
		
		// excerpt
		$ex = '';
		if (!$ispost) $ex = trim(get_post_meta(get_the_ID(), 'description', true));
		if ($ex == '') $ex = get_the_excerpt();
		$ex = str_replace(array('<br />', ' [...]'), array('', '&hellip;'), $ex);

		// date
		$date = the_date('','','',false);
		
		// output
		if (function_exists('CustomPageExcerpt')) {
			$ret = CustomPageExcerpt($link, $title, $ex, $img, $date);
		}
		else {
			if ($img) $img = "<a href=\"$link\">$img</a>";
			$ret =
				$cstart .
				($imagetop ? $img : '') .
				'<h2><a href="' . $link . '" title="read the full article">' .
				$title .
				"</a></h2>\n" .
				(!$imagetop && $imagefirst ? $img : '') .
				($ispost ? '<p class="info">News article; ' . $date . "</p>\n" : '') .
				"<p>$ex <a href=\"$link\" class=\"more\">View &raquo;</a></p>\n" .
				(!$imagetop && !$imagefirst ? $img : '') .
				$cend;
		}

	}

	return str_replace(BLOGURL, '', $ret);

}


// format a thumbnail
function OW_GetThumbnail() {

	if (has_post_thumbnail()) {
		$img = preg_replace(array(
				'/\s*width="\d+"/i',
				'/\s*height="\d+"/i',
				'/\s*class="[^"]+"/i'
			),
			array(
				'',
				'',
				''
			),
			str_replace(BLOGURL, '', get_the_post_thumbnail())
		);
	}

	return $img;
}


// create sitemap
function OW_SiteMap($params = array()) {

	extract(shortcode_atts(array(
	    'id' => 'sitemap',
		'append' => '',
		'depth' => 2
	), $params));

	$sitemap = preg_replace(array(
			'/\t/',
			'/'.str_replace('//','\/\/',BLOGURL).'/i',
			'/page_item_has_children\s*/i',
			'/current_page_item\s*/i',
			'/current_page_ancestor\s*/i',
			'/current_page_parent\s*/i',
			'/page_item\s+/i',
			'/page-item-\d+\s*/i',
			'/children\s*/i',
			'/\s*class=(""|\'\')/i',
			'/\s*title="[^"]+"/i',
			'/href=""/i',
			'/<a href="\/">[^<]+<\/a>/i',
			'/<li(| class="\w+")><a href="\/sitemap">\w+<\/a><\/li>\n/i',
			'/<li(| class="\w+")><a href="\/terms">[^<]+<\/a><\/li>\n/i'
		),
		array(
			'',
			'',
			'',
			'active',
			'open',
			'',
			'',
			'',
			'',
			'',
			'',
			'href="/"',
			'<a href="/">Home</a>',
			'',
			''
		),
		wp_list_pages("depth=$depth&title_li=&sort_column=menu_order&echo=0"));

	// special classes
	if (function_exists('ApplyPageClasses')) $sitemap = ApplyPageClasses($sitemap, $depth);

	// home page active (WP bug fix?)
	if ($_SERVER['REQUEST_URI'] == '/') $sitemap = preg_replace('/<li><a href="\/">/i', '<li class="active"><a href="/">', $sitemap);

	// add outer UL
	if ($sitemap != '') $sitemap = '<ul' . ($id != '' ? " id=\"$id\"" : '') . ">\n" . $sitemap . $append . "</ul>\n";

	return $sitemap;
}


// create page sub-menu
function OW_SubMenu($params = array()) {

	extract(shortcode_atts(array(
	    'id' => 'submenu',
		'append' => ''
	), $params));

	global $post;
	$submenu = '';

	if (is_page()) {

		$rootID = ($post->post_parent ? $post->post_parent : $post->ID);

		$submenu = preg_replace(array(
			'/\t/',
			'/'.str_replace('//','\/\/',BLOGURL).'/i',
			'/page-item-\d+\s*/i',
			'/current_page_item\s*/i',
			'/page_item\s*/i',
			'/\s*class=""/i',
			'/\s*title="[^"]+"/i'
		),
		array(
			'',
			'',
			'',
			'active',
			'',
			'',
			''
		),
		wp_list_pages("title_li=&child_of=$rootID&depth=1&sort_column=menu_order&echo=0"));

		// special classes
		if (function_exists('ApplyPageClasses')) $submenu = ApplyPageClasses($submenu);

		if ($submenu != '') $submenu = '<ul' . ($id != '' ? " id=\"$id\"" : '') . ">\n" . $submenu . $append . "</ul>\n";
	}

	return $submenu;
}


// generate tag cloud
function OW_Tags($params = array()) {

	extract(shortcode_atts(array(
		'orderby' => 'name',
		'number' => '',
		'wrapper' => '',
		'sizeclass' => 'tagged',
		'sizemin' => 1,
		'sizemax' => 5
	), $params));

	$ret = '';
	$min = 99999; $max = 0;
	$tags = get_tags(array('orderby' => $orderby, 'number' => $number));
	
	// get minimum and maximum number of articles
	foreach ($tags as $tag) {
		$min = min($min, $tag->count);
		$max = max($max, $tag->count);
	}
	
	// generate tag list
	foreach ($tags as $tag) {
		$url = get_tag_link($tag->term_id);
		$title = $tag->count . ' article' . ($tag->count == 1 ? '' : 's');
		if ($max > $min) {
			$class = $sizeclass . floor((($tag->count - $min) / ($max - $min)) * ($sizemax - $sizemin) + $sizemin);
		}
		else {
			$class = $sizeclass;
		}
		$ret .= 
			($wrapper ? "<$wrapper>" : '') . 
			"<a href=\"$url\" class=\"$class\" title=\"$title\">{$tag->name}</a>" .
			($wrapper ? "</$wrapper>" : '')
			. "\n";
	}
	
	return str_replace(BLOGURL, '', $ret);

}


// show paged navigation
function OW_PagedNav($params = array()) {

	extract(shortcode_atts(array(
	    'maxpagelinks' => 7,
		'id' => 'pagenav'
	), $params));

	global $wp_query;

	$postsperpage = intval(get_query_var('posts_per_page'));
	$numposts = $wp_query->found_posts;
	$numpages = floor(($numposts-1) / $postsperpage)+1;
	$pagednav = '';

	if ($numpages > 1) {

		$thispage = intval(get_query_var('paged'));
		if (!$thispage) $thispage = 1;

		$pagednav .= '<ol' . ($id ? " id=\"$id\"" : '') . ">\n";

		// back link
		$pagednav .= '<li class="control">';
		if ($thispage > 1) $pagednav .= '<a href="' . str_replace(BLOGURL, '', clean_url(get_pagenum_link($thispage-1))) . "\" title=\"previous page\">&laquo; back</a>\n";
		else $pagednav .= '<span>&laquo; back</span>';
		$pagednav .= "</li>\n";

		// page links
		$sp = 1;
		$ep = $numpages;
		if ($ep - $sp + 1 > $maxpagelinks) {
			$sp = max(1, $thispage - floor($maxpagelinks/2));
			$ep = min($numpages, $thispage + floor(($maxpagelinks-1)/2));
		}

		if ($sp > 1) $pagednav .= "<li>&hellip;</li>\n";

		for ($i = $sp; $i <= $ep; $i++) {
			$pagednav .= '<li>';
			if ($i == $thispage) $pagednav .= "<strong>$i</strong>";
			else $pagednav .= '<a href="' . str_replace(BLOGURL, '', clean_url(get_pagenum_link($i))) . '" title="page ' . $i . '">' . $i . '</a>';
			$pagednav .= "</li>\n";
		}

		if ($ep < $numpages) $pagednav .= "<li>&hellip;</li>\n";

		// next link
		$pagednav .= '<li class="control">';
		if ($thispage < $numpages) $pagednav .= '<a href="' . str_replace(BLOGURL, '', clean_url(get_pagenum_link($thispage+1))) . "\" title=\"next page\">next &raquo;</a>\n";
		else $pagednav .= '<span>next &raquo;</span>';
		$pagednav .= "</li>\n";

		$pagednav .= "</ol>\n";
	}

	return $pagednav;

}


// generate breadcrumb trail
function OW_BreadCrumbs($params = array()) {

	extract(shortcode_atts(array(
		'home' => 'Home',
	    'delimiter' => '&raquo;',
		'showtitle' => true
	), $params));
	
	$crumbs = '';
	
	if (!is_home() && !is_front_page()) {
	
		global $post;
		$crumbs = '<a href="/">' . $home . '</a> ' . $delimiter . ' ';
		
		if (is_single() || is_category()) {
			$cat = get_the_category();
			$crumbs .= get_category_parents($cat[0], true, ' ' . $delimiter . ' ');
		}
		else if (is_page() && $post->post_parent) {
			$p = array();
			$parent = $post->post_parent;
			while ($parent) {
				$page = get_page($parent);
				$url = get_permalink($page->ID);
				if ($url != BLOGURL . '/') $p[] = '<a href="' . $url . '">' . get_the_title($page->ID) . '</a> ' . $delimiter . ' ';
				$parent = $page->post_parent;
				$i++;
			}
			for ($i = count($p)-1; $i >= 0; $i--) {
				$crumbs .= $p[$i];
			}
		}
		else if (is_search()) {
			$crumbs .= 'Search Results';
		}
		
		if ($showtitle && (is_single() || is_page())) $crumbs .= the_title('','',false);
	}
	
	return str_replace(BLOGURL, '', $crumbs);

}


// include specific file
function OW_Include($params = array()) {

	extract(shortcode_atts(array(
	    'file' => 'contact'
	), $params));

	ob_start();
	include(get_theme_root() . '/' . get_template() . "/$file.php");
	return ob_get_clean();
}


// create element with specific ID
function OW_Div($params = array()) {

	extract(shortcode_atts(array(
	    'id' => 'map'
	), $params));

	return "<div id=\"$id\"></div>\n";

}


// ________________________________________________________
// get template location
function OW_template_location() {
	return TEMPLATE;
}



// ________________________________________________________
// show latest post titles
add_shortcode('showposts', 'OW_ShowPosts');

// show link to a single page
add_shortcode('pagelink', 'OW_PageExcerpt');

// show the sitemap
add_shortcode('sitemap', 'OW_SiteMap');

// page sub-menu
add_shortcode('submenu', 'OW_SubMenu');

// tag cloud
add_shortcode('tagcloud', 'OW_Tags');

// paged navigation
add_shortcode('pagednav', 'OW_PagedNav');

// breadcrumb trail
add_shortcode('breadcrumbs', 'OW_BreadCrumbs');

// include PHP file
add_shortcode('include', 'OW_Include');

// map element
add_shortcode('div', 'OW_Div');

// template location
add_shortcode('template', 'OW_template_location');
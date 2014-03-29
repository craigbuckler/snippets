<?php
/*
Plugin Name: Easy Admin
Plugin URI: http://optimalworks.net/
Description: Simplifies the WordPress administration panels.
Version: 1.2
Author: Craig Buckler
Author URI: http://optimalworks.net/
License: OptimalWorks
*/

// ________________________________________________________
// login page logo
function custom_login_logo() {
	echo '<style>.login h1 a { display: block; width: auto; text-indent: 0; text-decoration: none; background-image: none; font-size: 1.4em; font-weight: normal; text-align: center; line-height: 1.1em; color: #dadada; text-shadow: 0 -1px 1px #666, 0 1px 1px #fff; }</style>';
}
add_action('login_head', 'custom_login_logo');


// ________________________________________________________
// change admin bar options
function easy_toolbar_options($wp_toolbar) {

	// remove default options
	$wp_toolbar->remove_node('wp-logo');
	if (!current_user_can('manage_network')) $wp_toolbar->remove_node('my-sites');
	if (defined('DISABLE_POSTS')) $wp_toolbar->remove_node('new-post');
	if (!defined('SUPPORT_COMMENTS')) $wp_toolbar->remove_node('comments');
	if (!defined('SUPPORT_LINKS')) $wp_toolbar->remove_node('new-link');
	$wp_toolbar->remove_node('new-user');
	
	// additional help
	$wp_toolbar->add_node(array(
		'id' => 'owhelp',
		'title' => 'Help',
		'href' => 'http://optimalworks.net/help/cms',
		'meta' => array('target' => 'owhelp')
	));
	
	$wp_toolbar->add_node(array(
		'id' => 'owmanual',
		'title' => 'Manual',
		'parent' => 'owhelp',
		'href' => 'http://optimalworks.net/help/cms',
		'meta' => array('target' => 'owhelp')
	));
	
	// support email
	$wp_toolbar->add_node(array(
		'id' => 'owsupport',
		'title' => 'Email Support',
		'parent' => 'owhelp',
		'href' => 'mailto:contact@optimalworks?subject=CMS%20support'
	));
	
	// client area
	$wp_toolbar->add_node(array(
		'id' => 'owclient',
		'title' => 'Client Area',
		'parent' => 'owhelp',
		'href' => 'http://optimalworks.net/client/',
		'meta' => array('target' => 'owclient')
	));
	
}
add_action('admin_bar_menu', 'easy_toolbar_options', 999);


// ________________________________________________________
// remove update notifications
function no_update_notification() {
	if (!current_user_can('manage_network')) remove_action('admin_notices', 'update_nag', 3);
}
add_action('admin_notices', 'no_update_notification', 1);


// ________________________________________________________
// remove unnecessary menus
function remove_admin_menus() {

	global $menu, $submenu;

	// all users
	$restrict = array(); // explode(',', '');
	$restrictsub = array();

	// non-administrator users
	$restrict_user = explode(',', 'Links,Appearance,Plugins,Users,Tools,Settings');
	$restrict_user_sub = array();
	$restrict_user_sub[] = 'My Sites';
	if (defined('DISABLE_POSTS')) $restrict_user[] = 'Posts';
	if (!defined('SUPPORT_COMMENTS')) $restrict_user[] = 'Comments';
	if (!defined('SUPPORT_CATEGORIES')) $restrict_user_sub[] = 'Categories';
	if (!defined('SUPPORT_TAGS')) $restrict_user_sub[] = 'Tags';

	// WP localization
	$f = create_function('$v,$i', 'return __($v);');
	array_walk($restrict, $f);
	if (!current_user_can('manage_network')) {
		array_walk($restrict_user, $f);
		$restrict = array_merge($restrict, $restrict_user);
		array_walk($restrict_user_sub, $f);
		$restrictsub = array_merge($restrictsub, $restrict_user_sub);
	}

	// remove menus
	end($menu);
	while (prev($menu)) {
		$k = key($menu);
		$v = explode(' ', $menu[$k][0]);
		if(in_array(is_null($v[0]) ? '' : $v[0] , $restrict)) unset($menu[$k]);
	}
	
	// remove sub-menus
	foreach ($submenu as $k => $p) {
		foreach($submenu[$k] as $j => $s) {
			if (in_array(is_null($s[0]) ? '' : $s[0] , $restrictsub)) unset($submenu[$k][$j]);
		}
	}
	
}
add_action('admin_menu', 'remove_admin_menus');


// ________________________________________________________
// Permit tags on pages and other post types
function tags_support_all() {
	register_taxonomy_for_object_type('post_tag', 'page');
}

// set post type
function tags_support_query($wp_query) {
	if ($wp_query->get('tag')) $wp_query->set('post_type', 'any');
}

// initialise tags
function tags_support_init() {
	if (defined('SUPPORT_TAGS')) {
		add_action('init', 'tags_support_all');
		add_action('pre_get_posts', 'tags_support_query');
	}
}
add_action('after_setup_theme', 'tags_support_init');


// ________________________________________________________
// remove unnecessary page/post meta boxes
function remove_meta_boxes() {

	// posts
	remove_meta_box('postcustom','post','normal');
	remove_meta_box('trackbacksdiv','post','normal');
	if (!defined('SUPPORT_COMMENTS')) {
		remove_meta_box('commentstatusdiv','post','normal');
		remove_meta_box('commentsdiv','post','normal');
	}
	if (!defined('SUPPORT_CATEGORIES')) remove_meta_box('categorydiv','post','normal');
	if (!defined('SUPPORT_TAGS')) remove_meta_box('tagsdiv-post_tag','post','normal');
	// remove_meta_box('slugdiv','post','normal');
	remove_meta_box('authordiv','post','normal');

	// pages
	remove_meta_box('postcustom','page','normal');
	if (!defined('SUPPORT_COMMENTS')) {
		remove_meta_box('commentstatusdiv','page','normal');
		remove_meta_box('commentsdiv','page','normal');
	}
	remove_meta_box('trackbacksdiv','page','normal');
	// remove_meta_box('slugdiv','page','normal');
	remove_meta_box('authordiv','page','normal');

}
add_action('admin_init','remove_meta_boxes');


// ________________________________________________________
// remove unnecessary dashboard widgets
function remove_dashboard_widgets(){

	global $wp_meta_boxes;
	if (!current_user_can('manage_network')) unset($wp_meta_boxes['dashboard']['normal']['core']['dashboard_right_now']);
	unset($wp_meta_boxes['dashboard']['normal']['core']['dashboard_plugins']);
	unset($wp_meta_boxes['dashboard']['normal']['core']['dashboard_recent_comments']);
	unset($wp_meta_boxes['dashboard']['normal']['core']['dashboard_incoming_links']);
	unset($wp_meta_boxes['dashboard']['side']['core']['dashboard_primary']);
	unset($wp_meta_boxes['dashboard']['side']['core']['dashboard_secondary']);

}
add_action('wp_dashboard_setup', 'remove_dashboard_widgets');


// ________________________________________________________
// change admin footer
function change_footer_admin() {
	echo '&copy; OptimalWorks.net. For support, call 01395 276498 or email <a href="mailto:contact@optimalworks.net?subject=CMS%20support">contact@optimalworks.net</a>';
}
add_filter('admin_footer_text', 'change_footer_admin');
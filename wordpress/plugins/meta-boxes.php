<?php
/*
Plugin Name: Meta Boxes
Plugin URI: http://optimalworks.net/
Description: Adds SEO and other meta-boxes to WordPress administration panels.
Version: 1.0
Author: Craig Buckler
Author URI: http://optimalworks.net/
License: OptimalWorks
*/

$meta_settings = array(
	'labelsize' => '35'
);

$meta_data = array(

	'title' => array(
		'showfor' => '',
		'name' => 'titlealt',
		'type' => 'input',
		'width' => '40',
		'height' => '1',
		'default' => '',
		'title' => 'Alternative page title',
		'description' => 'Enter an alternative title for the page which is not used in menus (optional).'
	),
	
	'titletag' => array(
		'showfor' => '',
		'name' => 'titletag',
		'type' => 'input',
		'width' => '40',
		'height' => '1',
		'default' => '',
		'title' => 'Title tag line',
		'description' => 'Tag line which appears below the main title text.'
	),

	'description' => array(
		'showfor' => 'page',
		'name' => 'description',
		'type' => 'textarea',
		'width' => '40',
		'height' => '3',
		'default' => '',
		'title' => 'Page excerpt',
		'description' => 'Enter a short description of the page.'
	),

	'keywords' => array(
		'showfor' => '',
		'name' => 'keywords',
		'type' => 'input',
		'width' => '40',
		'height' => '1',
		'default' => '',
		'title' => 'Page keywords',
		'description' => 'Enter comma-separated keywords which are related to the page content.'
	),
	
	'topic' => array(
		'showfor' => '',
		'name' => 'topic',
		'type' => 'input',
		'width' => '40',
		'height' => '1',
		'default' => '',
		'title' => 'Page topic',
		'description' => 'Enter a short topic for your content.'
	)
	
);


// add administration functions
function create_meta_box() {
	global $theme_name;

	if (function_exists('add_meta_box')) {
		add_meta_box('postmeta', 'Meta Data', 'admin_meta_boxes', 'post', 'normal', 'high');
		add_meta_box('postmeta', 'Meta Data', 'admin_meta_boxes', 'page', 'normal', 'high');
	}
}


// show administration boxes
function admin_meta_boxes() {
	global $post, $meta_settings, $meta_data;
	
	$out = '';
	$posttype = get_post_type($post);
	$nonce = wp_create_nonce(plugin_basename(__FILE__));
	
	foreach($meta_data as $meta_box) {

		if (empty($meta_box['showfor']) || $meta_box['showfor'] == $posttype) {
	
			$meta_box_value = get_post_meta($post->ID, $meta_box['name'], true);

			if ($meta_box_value == "") $meta_box_value = $meta_box['default'];

			$out .= '<input type="hidden" name="'.$meta_box['name'].'_noncename" id="'.$meta_box['name'].'_noncename" value="' . $nonce . '" />';

			$out .= '<p><label for="' . $meta_box['name'] . '" title="' . $meta_box['description'] . '">' . $meta_box['title'] . ': </label>';

			switch ($meta_box['type']) {
			
				case 'input':
					$out .= '<input type="text" id="'.$meta_box['name'].'" name="'.$meta_box['name'].'" value="'.$meta_box_value.'" size="' . $meta_box['width'] . '" title="' . $meta_box['description'] . '" />';
					break;
					
				case 'textarea':
					$out .= '<textarea id="'.$meta_box['name'].'" name="'.$meta_box['name'].'" rows="' . $meta_box['height'] . '" cols="' . $meta_box['width'] . '" title="' . $meta_box['description'] . '">' . $meta_box_value . '</textarea>';
					break;

				}
				
			$out .= '</p>';

		}
	
	}

	if (!$out) $out = '<p>No meta data can be entered for this post.</p>';
	
	echo '<div id="metaboxes">', '<style type="text/css">#metaboxes label { clear:left; float:left; width:' . $meta_settings['labelsize'] . '%; line-height:2.2em; font-weight:bold; margin:0; } #metaboxes input, #metaboxes textarea { width: ' . (98-$meta_settings['labelsize']) . '%;}</style>', $out, '</div>';

}

// save meta data
function save_postdata($post_id) {
	global $post, $meta_data;

	$posttype = $_POST['post_type'];
	$nonce = plugin_basename(__FILE__);
	
	foreach($meta_data as $meta_box) {

		if (empty($meta_box['showfor']) || $meta_box['showfor'] == $posttype) {

			// verify		
			if (!wp_verify_nonce($_POST[$meta_box['name'].'_noncename'], $nonce)) return $post_id;
			
			if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return $post_id;

			if ($posttype == 'page') {
				if (!current_user_can('edit_page', $post_id )) return $post_id;
			}
			else {
				if (!current_user_can('edit_post', $post_id )) return $post_id;
			}

			// post data
			$data = $_POST[$meta_box['name']];

			if (get_post_meta($post_id, $meta_box['name']) == "") add_post_meta($post_id, $meta_box['name'], $data, true);
			elseif ($data != get_post_meta($post_id, $meta_box['name'], true)) update_post_meta($post_id, $meta_box['name'], $data);
			elseif ($data == "") delete_post_meta($post_id, $meta_box['name'], get_post_meta($post_id, $meta_box['name'], true));
		
		}
	}
}


// actions
add_action('admin_menu', 'create_meta_box');
add_action('save_post', 'save_postdata');
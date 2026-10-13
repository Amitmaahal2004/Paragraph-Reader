<?php

/**
 * Plugin Name: WP Voice Reader - Paragraph Text-to-Speech
 * Plugin URI:  https://github.com/spark-web/wp-voice-reader
 * Description: Automatically adds a native speech-synthesis microphone button immediately after every paragraph (<p>) across the frontend.
 * Version:     1.0.0
 * Author:      Spark Web
 * Text Domain: wp-voice-reader
 * License:     GPL-2.0+
 */

// Exit if accessed directly.
if (! defined('ABSPATH')) {
	exit;
}

class WP_Voice_Reader
{

	/**
	 * Plugin version.
	 */
	const VERSION = '1.0.0';

	/**
	 * Instance of this class.
	 *
	 * @var WP_Voice_Reader|null
	 */
	private static $instance = null;

	/**
	 * Get unique class instance.
	 *
	 * @return WP_Voice_Reader
	 */
	public static function get_instance()
	{
		if (null === self::$instance) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor.
	 */
	private function __construct()
	{
		add_action('wp_enqueue_scripts', array($this, 'enqueue_assets'));
	}

	/**
	 * Enqueue frontend scripts and styles.
	 */
	public function enqueue_assets()
	{
		// Do not load in admin, feed, or REST requests.
		if (is_admin() || is_feed()) {
			return;
		}

		$plugin_url = plugin_dir_url(__FILE__);
		$plugin_dir = plugin_dir_path(__FILE__);

		// Enqueue stylesheet.
		$css_path = 'assets/css/voice-reader.css';
		$css_ver  = file_exists($plugin_dir . $css_path) ? filemtime($plugin_dir . $css_path) : self::VERSION;
		wp_enqueue_style(
			'wp-voice-reader-style',
			$plugin_url . $css_path,
			array(),
			$css_ver
		);

		// Enqueue script.
		$js_path = 'assets/js/voice-reader.js';
		$js_ver  = file_exists($plugin_dir . $js_path) ? filemtime($plugin_dir . $js_path) : self::VERSION;
		wp_enqueue_script(
			'wp-voice-reader-script',
			$plugin_url . $js_path,
			array(),
			$js_ver,
			true // Load in footer
		);

		// Pass configuration and localized strings to JavaScript.
		$current_lang = get_locale(); // e.g. en_US, fr_FR, etc.
		$iso_lang     = str_replace('_', '-', $current_lang);

		$settings = apply_filters('wp_voice_reader_settings', array(
			'lang'               => $iso_lang,
			'rate'               => 1.0,
			'pitch'              => 1.0,
			'volume'             => 1.0,
			'labelPlay'          => __('Listen to paragraph', 'wp-voice-reader'),
			'labelStop'          => __('Stop listening', 'wp-voice-reader'),
			'tooltipPlay'        => __('Listen', 'wp-voice-reader'),
			'tooltipStop'        => __('Stop', 'wp-voice-reader'),
			'minWordCount' => 20,
			'excludedContainers' => array(
				'#wpadminbar',
				'nav',
				'header',
				'footer',
				'.menu',
				'.nav-menu',
				'.site-navigation',
				'.comment-form',
				'.wp-block-navigation',
				'.elementor-nav-menu',
				'.elementor-location-header',
				'.elementor-location-footer',
				'.no-voice-reader',
				'form',
				'noscript',
			),
		));

		wp_localize_script('wp-voice-reader-script', 'wpVoiceReaderConfig', $settings);
	}
}

// Initialize plugin.
add_action('plugins_loaded', array('WP_Voice_Reader', 'get_instance'));

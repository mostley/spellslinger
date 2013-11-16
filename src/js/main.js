if (typeof(MF) === "undefined") {
	window.MF = {};
}

MF.Controller = {

	width: 300,
	height: 400,
	stage: null,

	renderer: null,

	fps: 60,
	interval: 16.666,

	gameContainer: "#gamecontainer",

	Templates: {
		player_box: '#player-box-template',
		channel_list_item: '#channel-list-item',
		alert_warning: '#alert-warning',
		alert_error: '#alert-error'
	},

	init: function() {
		var me = this;

		me.stage = new PIXI.Stage(0xdddddd);
		
		me.width = $('#gamecontainer').width();
		me.height = $('#gamecontainer').height();
		me.renderer = PIXI.autoDetectRenderer(me.width, me.height);
		
		$(me.gameContainer).append(me.renderer.view);

		requestAnimFrame(me.animate.bind(me));

		$(".nav-tabs li:not(.ignore) a").click(function (e) { e.preventDefault(); $(this).tab('show'); return false; });

		$('#channel_dialog_create_button').click(me.on_create_channel.bind(me));
		$('#dialog-channel-selection .modal-body .list-group').on('click', 'a', me.on_select_channel.bind(me));

		$('#code-send-content').click(me.on_send_code.bind(me));

		me.init_templates();
	},

	/*
	 * This function takes the template selectors in the local Templates object and replaces them with handlebar functions.
	 * those can generate templated html from data
	 */
	init_templates: function() {
		var me = this;

		for (var key in me.Templates) {
			var selector = me.Templates[key];
			var source   = $(selector).html();
			me.Templates[key] = Handlebars.compile(source);
		}
	},

	// loop
	animate: function ()
	{
		var me = this;

	    me.update();
	    me.renderer.render(me.stage);

		requestAnimFrame(me.animate.bind(me));
	},

	// loop logik
	update: function ()
	{
		// Game Code
	},

	validateCode: function(code) {
		return true;
	},

	add_player: function(playerId) {
		var me = this;

		var html = me.Templates.player_box({ id: playerId });
		$('#log_players .list-group').append(html);
	},

	//Network events
	channel_list_received: function(channels) {
		var me = this;

		$('body').removeClass('loading');

		var count = Object.size(channels);
		$('#serverlog').append('<div class="message">'+ count +' Channels found</div>');
		for (var key in channels) {
			var channel = channels[key];
			$('#serverlog').append('<div class="message"> - '+ channel.name +' ('+channel.clients.length+')</div>');

			var html = me.Templates.channel_list_item({
				id: channel.id,
				name: channel.name,
				count: channel.clients.length,
				is_private: channel.is_private
			});

			$('#dialog-channel-selection .modal-body .list-group').append(html);
		}

		var channelId = null;
		if (window.location.hash.length > 1) {
			var channelcode = base64.decode(window.location.hash.substr(1));
			channelId = channelcode.substr(channelcode.lastIndexOf("_")+1)

			var foundChannel = false;
			for (var key in channels) {
				if (channels[key].id == channelId) {
					foundChannel = true;
					break;
				}
			}

			if (!foundChannel) {
				channelId = null;
			}
		}


		if (channelId == null) {
			window.location.hash = '';

			if (count > 0) {
				$('#dialog-channel-selection').modal();
			} else {
				$('#dialog-channel-creation').modal();
			}
		} else {
			MF.Client.select_channel(channelId);
		}
	},

	set_channel_result: function(channel) {
		var me = this;

		$('#dialog-channel-selection').modal('hide');
		$('#dialog-channel-creation').modal('hide');

		$('#serverlog').append('<div class="message">Joined Channel: "'+ channel.name +'"</div>');

		for (var i in channel.clients)	{
			var playerId = channel.clients[i];

			me.add_player(playerId);
		}

		$('#log_player_count').text(channel.clients.length);
		window.location.hash = '#' + base64.encode(channel.name + "_" + parseInt(channel.id));
	},
	
	client_connected: function(client) {
		MF.Client.request_channels();
		$('#serverlog').append('<div class="message">Server Connected</div>');
	},

	client_disconnected: function(client) {
		//lost connection
		$('#serverlog').append('<div class="message">Connection lost.</div>');
	},

	player_connected: function(playerId) {
		var me = this;

		$('#serverlog').append('<div class="message">Player #'+ playerId +' joined</div>');

		me.add_player(playerId);
		$('#log_player_count').text(parseInt($('#log_player_count').text())+1);
	},

	player_disconnected: function(playerId) {
		$('#serverlog').append('<div class="message">Player #'+ playerId +' left</div>');

		$('#log_header_player_' + playerId).remove();
		$('#log_player_' + playerId).remove();
		$('#log_player_count').text(parseInt($('#log_player_count').text())-1);
	},

	request_error: function(data) {
		var me = this;

		switch (data.event_name) {
			case 'set_channel':
				$('#channel-creation-form').prepend(me.Templates.alert_warning({ text: data.reason }));
				break;
		}
	},

	//UI events
	on_create_channel: function() {
		var me = this;

		MF.Client.set_channel($('#channel_name').val(), $('#channel_is_private').is(':checked'));
	},

	on_select_channel: function(e) {
		var me = this;

		e.preventDefault();

		console.log("selecting Channel '" + $(e.target).data('channel-id') + "'");

		MF.Client.select_channel($(e.target).data('channel-id'));

		return false;
	},

	on_send_code: function() {
		var me = this;

		var editor = ace.edit("codeditor");
		var code = editor.getValue();
		console.log(code);

		if (me.validateCode(code)) {
			var username = $('#usernamebox').val();
			MF.Client.send_code(username, code);
		} else {
			//TODO better messages
			$('#codeditor').prepend(me.Templates.alert_warning({ text: "code not valid!" }));
		}
	}
};

$(function() {

	// Init ACE Editor
    var editor = ace.edit("codeditor");
    editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode("ace/mode/javascript");

	// Init Base64 for use in urls
    base64.settings.char62 = "-";
	base64.settings.char63 = "_";
	base64.settings.pad = null;

	var client = MF.Client;
	var controller = MF.Controller;

	client.on(
		client.events.channel_list, 
		controller.channel_list_received.bind(controller));

	client.on(
		client.events.set_channel, 
		controller.set_channel_result.bind(controller));

	client.on(
		client.events.client_connected, 
		controller.client_connected.bind(controller));

	client.on(
		client.events.client_disconnected, 
		controller.client_disconnected.bind(controller));

	client.on(
		client.events.player_connected, 
		controller.player_connected.bind(controller));

	client.on(
		client.events.player_disconnected, 
		controller.player_disconnected.bind(controller));

	client.on(
		client.events.error, 
		controller.request_error.bind(controller));

	$('#serverlog').append('<div class="message">Connecting...</div>');

	client.connect();

	controller.init();
});

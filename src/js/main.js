if (typeof(MF) === "undefined") {
	window.MF = {};
}

MF.Controller = {

	_isServer: false,
	gameIsRunning: false,

	Templates: {
		player_box: '#player-box-template',
		channel_list_item: '#channel-list-item',
		alert_warning: '#alert-warning',
		alert_error: '#alert-error'
	},

	init: function() {
		var me = this;

		$('.carousel').carousel({ interval: 0, wrap: false });

		$(".nav-tabs li:not(.ignore) a").click(function (e) { e.preventDefault(); $(this).tab('show'); return false; });

		$('#channel_dialog_create_button').click(me.on_create_channel.bind(me));
		$('#dialog-channel-selection .modal-body .list-group').on('click', 'a', me.on_select_channel.bind(me));

		$('#code-send-content').click(me.on_send_code.bind(me));

		$('[data-target=#dialog-channel-selection]').click(function() {
			MF.Client.request_channels();
		});

		$('#codeditor').on('keydown', Function.buffer(500, me._on_text_entered.bind(me)));
		$('#codeditor').on('keydown', function(e) {

			if (e.ctrlKey && e.keyCode == 13) {
				me.on_send_code(e);
			}
		});

		$('#helpOverlay').on('click', function() {
			$(this).removeClass('in').hide();
		});

		$('#introOverlay .close-button').on('click', function(e) {
			$('#introOverlay').removeClass('in').hide();
			$.cookie('intro_seen', 'true', { expires: 999 });
			e.stopPropagation();
		});
		$(window).on('keydown', function(e) {
    		var editor = ace.edit("codeditor");
			var editorHasFocus = editor.isFocused();
			if (me.gameIsRunning && !editorHasFocus) {
				if (e.keyCode == 72) {
					me.show_help_overlay();
				}
			}
		});
		$(window).on('keyup', function(e) {
			if (me.gameIsRunning) {
				if (e.keyCode == 72) {
					$('#helpOverlay').removeClass('in').hide();
				} else if (e.keyCode == 36) {
					MF.Game.move_camera_to(MF.Game.get_wizard_sprite(MF.Client.userId));
				}
			}
		});

		me.init_templates();

		MF.Executor.init();

		MF.Game.init();
	},

	gameOver: function() {
		//TODO make nicer
		alert("Game Over - You are dead.");

		$('.code').addClass('disabled');
		var editor = ace.edit("codeditor");
		editor.setReadonly(true);
	},

	show_help_overlay: function() {
		console.log("show_help_overlay");
		$('#helpOverlay').show();
		Function.defer(1, function(){
			$('#helpOverlay').addClass('in');

			var gameContainerOffset = $('#gamecontainer').offset();
			$('#helpOverlay .game-field').offset({ left: gameContainerOffset.left+10, top: gameContainerOffset.top+10 });

			var codeditorOffset = $('#codeditor').offset();
			$('#helpOverlay .code-field').offset({ left: codeditorOffset.left+10, top: codeditorOffset.top+10 });
			$('#helpOverlay .code-field').css('max-width', $('#codeditor').width() - 20);
			$('#helpOverlay .code-field').css('max-height', $('#codeditor').height() - 20);
		});
	},

	show_intro_overlay: function()  {
		console.log("show_intro_overlay");
		$('#introOverlay').show();
		Function.defer(1, function(){
			$('#introOverlay').addClass('in');
		});
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

	add_player: function(playerId) {
		var me = this;

		if (playerId !== MF.Client.userId) {
			var html = me.Templates.player_box({ id: playerId });
			$('#log_players .list-group').append(html);
		}

		MF.Game.add_wizard(playerId);
	},

	remove_player: function(playerId) {
		var me = this;


		$('#log_header_player_' + playerId).remove();
		$('#log_player_' + playerId).remove();

		MF.Game.remove_wizard(playerId);
	},

	get_game_status: function() {
		var wizard_data = MF.Game.get_wizard_data();
		var projectile_data = MF.Game.get_projectile_data();
		var command_data = MF.Game.get_command_data();

		return {
			wizards: wizard_data,
			projectiles: projectile_data,
			commands: command_data
		}
	},

	set_game_status: function(status) {
		if (status) {
			MF.Game.set_wizard_data(status.wizards);
			MF.Game.set_projectile_data(status.projectiles);
			MF.Game.set_command_data(status.commands);
		}
	},

	//Network events
	channel_list_received: function(channels) {
		var me = this;

		$('body').removeClass('loading');
		$('#dialog-channel-selection .modal-body .list-group').empty();

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

		if (!me._isServer) {
			console.log("requesting status");
			MF.Client.get_status();

			$('body').addClass('loading');
		} else {
			me.on_game_started();
		}
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

		MF.Client.get_status();
	},

	player_disconnected: function(playerId) {
		var me = this;
		
		$('#serverlog').append('<div class="message">Player #'+ playerId +' left</div>');

		me.remove_player(playerId);
		$('#log_player_count').text(parseInt($('#log_player_count').text())-1);

		MF.Client.get_status();
	},

	player_code: function(data) {
		var html = '<pre class="fade"><code data-language="javascript">' + data.code + "</code></pre>";
		$('#log_header_player_' + data.userId + ' .list-group-item-text').append(html);
		Rainbow.color();

		Function.defer(1, function(){$(".player_log pre").addClass('in');});

		MF.Executor.execute(data.userId, data.code);
	},

	get_status: function(data) {
		var me = this;

		var status = me.get_game_status();
		MF.Client.send_status(data.requestingClientId, status);
	},

	get_status_result: function(data) {
		var me = this;

		me.set_game_status(data.status);

		me.on_game_started();
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
	on_game_started: function() {
		var me = this;
		
		$('body').removeClass('loading');

		if (!$.cookie('intro_seen')) {
			me.show_intro_overlay();
		}

		me.gameIsRunning = true;

		MF.Game.move_camera_to(MF.Game.get_wizard_sprite(MF.Client.userId));
	},

	on_create_channel: function() {
		var me = this;

		me._isServer = true;

		MF.Client.set_channel($('#channel_name').val(), $('#channel_is_private').is(':checked'));
	},

	on_select_channel: function(e) {
		var me = this;

		e.preventDefault();

		console.log("selecting Channel '" + $(e.target).data('channel-id') + "'");

		MF.Client.select_channel($(e.target).data('channel-id'));

		return false;
	},

	on_send_code: function(e) {
		var me = this;

		me.set_codeditor_loading(true);

		e.preventDefault();

		var editor = ace.edit("codeditor");
		var code = editor.getValue();

		var validationResult = MF.Executor.validate(code);
		if (validationResult.success) {
			var username = $('#usernamebox').val();
			MF.Client.send_code(username, code);

			$('.code .tab-content .alert').remove();

			editor.selectAll();
			$('#mana-count').text(0);
		} else {
			$('.code .tab-content').append(me.Templates.alert_error({ text: "Code not valid: " + validationResult.error.message }));
		}

		me.set_codeditor_loading(false);

		return false;
	},

	set_codeditor_loading: function(loading) {
		if (loading) {
			$('.code .tab-content').addClass('loading')
								   .append($('<div class="loading-overlay"></div>'));
		} else {
			$('.code .tab-content').removeClass('loading');
			$('.code .tab-content .loading-overlay').remove();
		}
	},

	_on_text_entered: function() {
		var me = this;
/*
		var editor = ace.edit("codeditor");
		var code = editor.getValue();

		var validationResult = MF.Executor.validate(code);

		if (validationResult.success) {
			var count = MF.Executor.calculate_mana_cost(code);
			$('#mana-count').text(count);

			$('.code .tab-content .alert').remove();
		} else {
			$('.code .tab-content').append(me.Templates.alert_error({ text: "Code not valid: " + validationResult.error.message }));
		}*/
	},

	on_text_complete: function(editor, session, pos, prefix, callback) {
        var textBefore = session.getTextRange({ start: { column: 0, row: pos.row }, end: pos });
        console.log(textBefore, prefix);

        if (textBefore.trim() == "wizard.") {
        	callback(null, [{
        		name: 'Walk left',
        		value: 'walkLeft()',
        		score: 1,
        		meta: 'left'
        	},{
        		name: 'Walk right',
        		value: 'walkRight()',
        		score: 2,
        		meta: 'right'
        	},{
        		name: 'Walk up',
        		value: 'walkUp()',
        		score: 3,
        		meta: 'up'
        	},{
        		name: 'Walk down',
        		value: 'walkDown()',
        		score: 4,
        		meta: 'down'
        	},{
        		name: 'Say something',
        		value: 'say("Hello")',
        		score: 5,
        		meta: 'say'
        	},{
        		name: 'Throw fireball',
        		value: 'throwFireball(1,0)',
        		score: 6,
        		meta: 'down'
        	}]);
        } else {
        	callback(null, []);
        }
    }
};

$(function() {

	  // Init ACE Editor
    var editor = ace.edit("codeditor");
    var langTools = ace.require("ace/ext/language_tools");
    editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode("ace/mode/javascript");

    editor.setOptions({
        enableBasicAutocompletion: true,
        enableSnippets: true
    });
    var completer = {
        getCompletions: MF.Controller.on_text_complete.bind(MF.Controller)
    }
    langTools.addCompleter(completer);
    
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
		client.events.player_code, 
		controller.player_code.bind(controller));

	client.on(
		client.events.get_status, 
		controller.get_status.bind(controller));

	client.on(
		client.events.send_status, 
		controller.get_status_result.bind(controller));

	client.on(
		client.events.error, 
		controller.request_error.bind(controller));

	$('#serverlog').append('<div class="message">Connecting...</div>');

	client.connect();

	controller.init();
});

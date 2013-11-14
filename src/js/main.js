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

	init: function() {
		var me = this;

		me.stage = new PIXI.Stage(0xdddddd);
		
		me.width = $('#gamecontainer').width();
		me.height = $('#gamecontainer').height();
		me.renderer = PIXI.autoDetectRenderer(me.width, me.height);
		
		$(me.gameContainer).append(me.renderer.view);

		requestAnimFrame(me.animate.bind(me));

		$("#log_tabs a").click(function (e) { e.preventDefault(); $(this).tab('show'); return false; })
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

	//Network events
	channel_list_received: function(channels) {
		//TODO: show message box for user to select channel or create a new one

		var count = Object.size(channels);
		$('#serverlog').append('<div class="message">'+ count +' Channels found</div>');
		for (var channel in channels) {
			var users = channels[channel];
			$('#serverlog').append('<div class="message"> - '+ channel +' ('+users.length+')</div>');
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

	player_connected: function(client) {
		$('#serverlog').append('<div class="message">Player "'+ msg.data +'" joined</div>');
	},

	player_disconnected: function(client) {
		$('#serverlog').append('<div class="message">Player "'+ msg.data +'" left</div>');
	}
};

$(function() {

    var editor = ace.edit("codeditor");
    editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode("ace/mode/javascript");

	var client = MF.Client;
	var controller = MF.Controller;

	client.on(
		client.events.channel_list, 
		controller.channel_list_received.bind(controller));

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

	client.connect();

	controller.init();
});

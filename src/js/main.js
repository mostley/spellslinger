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

		me.stage = new PIXI.Stage(0x000000);

		me.renderer = PIXI.autoDetectRenderer(width, height);
		
		$(me.gameContainer).append(renderer.view);

		requestAnimFrame(me.animate.bind(me));
	},

	// loop
	animate: function ()
	{
	    me.update();
	    me.renderer.render(stage);

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

	tinymce.init({
	    selector: "textarea"
	});

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
});

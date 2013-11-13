if (typeof(MF) === "undefined") {
	window.MF = {};
}

MF.Controller = {

	width: 300,
	height: 400,
	stage: null,

	renderer: null,

	fps = 60;
	interval = 1000 / fps;

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
	};

	// loop logik
	update: function ()
	{
		// Game Code
	},

	//Network events
	channel_list_received: function(client, channels) {
		//show message box for user to select channel or create a new one
	},
	
	client_connected: function(client) {
		MF.Client.request_channels();
	},

	client_disconnected: function(client) {
		//lost connection
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

	client.connect();
});

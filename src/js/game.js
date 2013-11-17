if (typeof(MF) === "undefined") {
	window.MF = {};
}

MF.Game = {

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
		
		me.width = $(me.gameContainer).width();
		me.height = $(me.gameContainer).height();
		me.renderer = PIXI.autoDetectRenderer(me.width, me.height);
		
		$(me.gameContainer).append(me.renderer.view);

		requestAnimFrame(me.animate.bind(me));
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
	},

	add_wizard: function(playerId) {
		//TODO
	},

	get_wizard: function(playerId) {
		//TODO
		return new MF.Wizard(new MF.Magic(playerId));
	}
};
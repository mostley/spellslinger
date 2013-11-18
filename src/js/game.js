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

	_wizards: [],

	_commandQueue: {},

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
	animate: function () {
		var me = this;

	    me.update();
	    me.renderer.render(me.stage);

		requestAnimFrame(me.animate.bind(me));
	},

	// loop logik
	update: function () {
		var me = this;

		for (var playerId in me._wizards) {
			var wizard = me._wizards[playerId];
			var cmds = wizard.magic._popAllCommands();

			if (!me._commandQueue[playerId]) {
				me._commandQueue[playerId] = [];
			}

			for (var i in cmds) {
				Array.insert(me._commandQueue[playerId], 0, cmds[i]);
			}
		}

		me._commandQueue
	},

	add_wizard: function(playerId) {
		var me = this;

		if (me._wizards[playerId]) {
			console.error("Wizard for player '" + playerId + "' already exists. tsnh.");
		}

		var magic = new MF.Magic(playerId);
		var wizard = new MF.Wizard(magic);
		me._wizards[playerId] = wizard;

		return wizard;
	},

	get_wizard: function(playerId) {
		var me = this;
		
		return me._wizards[playerId];
	}
};
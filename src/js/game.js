if (typeof(MF) === "undefined") {
	window.MF = {};
}

MF.Textures = {
	Ground: 5,
	Wizard_Novice: 5190
};

MF.Game = {

	width: 300,
	height: 400,
	stage: null,

	renderer: null,

	fps: 60,
	interval: 16.666,

	startTime: 0,
	lastTick: 0,
	time: 0,
	tileWidth: 22,
	tileHeight: 22,

	gridCols: 32,
	gridRows: 32,

    running: true,
    
    isDragging: false,
    dragStart: null,

	gameContainer: "#gamecontainer",

	_wizards: [],
	_wizardSprites: [],
	levelContainer: null,
	creatureContainer: null,

	_commandQueue: {},

	init: function() {
		var me = this;

		me.stage = new PIXI.Stage(0xdddddd);
		
		me.width = $(me.gameContainer).width();
		me.height = $(me.gameContainer).height();
		me.renderer = PIXI.autoDetectRenderer(me.width, me.height);
		
        me.startTime = new Date().getTime();
        me.lastTick = MF.startTime;
		
		$(me.gameContainer).append(me.renderer.view);

	    MF.ResourceLoader.loadTilesets(MF.Tilesets);

	    //ResourceLoader.loadSounds(sounds);

	    me.levelContainer = new PIXI.DisplayObjectContainer();
	    me.levelContainer.position.x = 0;
	    me.levelContainer.position.y = 0;

	    me.creatureContainer = new PIXI.DisplayObjectContainer();
	    me.creatureContainer.position.x = 0;
	    me.creatureContainer.position.y = 0;

	    me.levelContainer.addChild(me.creatureContainer);
	    me.stage.addChild(me.levelContainer);

	    me.createGrid();

		requestAnimFrame(me.animate.bind(me));

		$(me.gameContainer).on('mousedown', me.on_mouse_down.bind(me));
		$(me.gameContainer).on('mousemove', me.on_mouse_move.bind(me));
		$(document).on('mouseup', me.on_mouse_up.bind(me));
	},

	createGrid: function() {
		var me = this;

		console.log("creating grid...",me.gridCols,me.gridRows);

	    for (var x=0; x<me.gridCols; x++) {
	    	for (var y=0; y<me.gridRows; y++) {

	    		var texture = PIXI.TextureCache[MF.Textures.Ground]

	            var sprite = new PIXI.Sprite(texture);
	            sprite.position = new PIXI.Point(
		            x * me.tileWidth,
		            y * me.tileHeight);

		        if (texture.frame.tileoffset) {
		            sprite.position.x += texture.frame.tileoffset.x;
		            sprite.position.y -= texture.frame.tileoffset.y;
		        }

	        	me.levelContainer.addChild(sprite);
	    	}
	    }
	},

	playSound: function (sound, volume) {
	    return soundManager.play(sound.name, { volume: 100 * volume });
	},

	animate: function () {
		var me = this;

        if (!me.running) { return; }

        var now = new Date().getTime();
        var dt = (now - me.lastTick)/1000;
        me.time = (now - me.startTime)/1000;

	    me.update(dt);
	    me.renderer.render(me.stage);

		requestAnimFrame(me.animate.bind(me));

        me.lastTick = new Date().getTime();
	},

	update: function (dt) {
		var me = this;

		for (var id in me._wizardSprites) {
			me._wizardSprites[id].update(dt);
		}

		me.collectCommands();

		for (var playerId in me._commandQueue) {
			var commandList = me._commandQueue[playerId];
			while (commandList.length > 0) {
				var command = commandList.pop();
				var wizard = me._wizardSprites[playerId];

				wizard[command]();
			}
		}
	},

	// Wizard related
	collectCommands: function() {
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
	},

	get_random_grid_position: function() {
		var me = this;

		var x = Math.floor(Math.random() * me.gridCols);
		var y = Math.floor(Math.random() * me.gridRows);

		while (me.get_wizard_at(x, y) != null) {
			x = Math.floor(Math.random() * me.gridCols);
			y = Math.floor(Math.random() * me.gridRows);
		}

		return new PIXI.Point(x,y);
	},

	add_wizard: function(playerId) {
		var me = this;

		if (me._wizards[playerId]) {
			console.error("Wizard for player '" + playerId + "' already exists. tsnh.");
		}

		var magic = new MF.Magic(playerId);
		var wizard = new MF.Wizard(magic);
		me._wizards[playerId] = wizard;

		var sprite = new PIXI.Sprite(PIXI.TextureCache[MF.Textures.Wizard_Novice]);

		var tPos = me.get_random_grid_position();
		var wizardSprite = new MF.Creature(sprite, tPos);
		me._wizardSprites[playerId] = wizardSprite;
		me.levelContainer.addChild(wizardSprite.sprite);

		return wizard;
	},

	remove_wizard: function(playerId) {
		var me = this;
		
		delete me._wizards[playerId];
		me.levelContainer.removeChild(me._wizardSprites[playerId].sprite);
		delete me._wizardSprites[playerId];
	},

	get_wizard: function(playerId) {
		var me = this;
		
		return me._wizards[playerId];
	},

	get_wizard_at: function(x,y) {
		var me = this;

		var result = null;
		for (var id in me._wizardSprites) {
			var wizard = me._wizardSprites[id];
			if (wizard.tilePosition.x == x && wizard.tilePosition.y == y) {
				result = wizard;
				break;
			}
		}

		return result;
	},

	get_wizard_data: function() {
		var me = this;

		var result = {};

		for (var id in me._wizardSprites) {
			var wizardSprite = me._wizardSprites[id];

			result[id] = {
				position: { 
					x: wizardSprite.tilePosition.x, 
					y: wizardSprite.tilePosition.y 
				},
				health: wizardSprite.health,
			};
		}

		return result;
	},

	set_wizard_data: function(wizard_data) {
		var me = this;
		
		for (var id in wizard_data) {
			var data = wizard_data[id]
			var wizardSprite = me._wizardSprites[id];

			wizardSprite._set_tile_position(data.position);
			wizardSprite.health = data.health;
		}
	},

	// Events
	on_mouse_down: function(e) {
		var me = this;

		me.isDragging = true;
		me.dragStart = new PIXI.Point(e.offsetX, e.offsetY);
		me.containerStart = new PIXI.Point(me.levelContainer.position.x, me.levelContainer.position.y);
	},

	on_mouse_move: function(e) {
		var me = this;

		if (me.isDragging) {
			var pos = new PIXI.Point(e.offsetX, e.offsetY);
			var delta = VMath.substract(pos, me.dragStart);
			me.levelContainer.position.x = me.containerStart.x + delta.x;
			me.levelContainer.position.y = me.containerStart.y + delta.y;
		}
	},

	on_mouse_up: function(e) {
		var me = this;

		me.isDragging = false;
	},
};
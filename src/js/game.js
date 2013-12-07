if (typeof(MF) === "undefined") {
	window.MF = {};
}

MF.Textures = {
	Ground: 5,
	Wizard_Novice: 5189,
	Wizard_Me: 5187,
	Projectiles: {
		'fireball': 5598
	}
};

MF.Game = {

	width: 300,
	height: 400,
	stage: null,

	renderer: null,

	fps: 60,
	interval: 16.666,

	startTime: 0,
	lastTick: null,
	time: 0,
	tileWidth: 22,
	tileHeight: 22,

	gridCols: 32,
	gridRows: 32,

    running: true,
    
    isDragging: false,
    dragStart: null,
    _cameraTaget: null,
    _cameraSpeed: 0.3,

	gameContainer: "#gamecontainer",

	_wizards: [],
	_wizardSprites: {},
	_projectileSprites: {},
	levelContainer: null,

	_grid: {},

	_commandQueue: {},

	init: function() {
		var me = this;

		me.stage = new PIXI.Stage(0xdddddd);
		
		me.width = $(me.gameContainer).width();
		me.height = $(me.gameContainer).height();
		me.renderer = PIXI.autoDetectRenderer(me.width, me.height);
		
        me.startTime = new Date().getTime();
		
		$(me.gameContainer).append(me.renderer.view);

	    MF.ResourceLoader.loadTilesets(MF.Tilesets);

	    //ResourceLoader.loadSounds(sounds);

	    me.levelContainer = new PIXI.DisplayObjectContainer();
	    me.levelContainer.position.x = 0;
	    me.levelContainer.position.y = 0;

	    me.stage.addChild(me.levelContainer);

	    me.createGrid();

		requestAnimFrame(me.animate.bind(me));

		$(me.gameContainer).on('mousedown', me.on_mouse_down.bind(me));
		$(me.gameContainer).on('mousemove', me.on_mouse_move.bind(me));
		$(document).on('mouseup', me.on_mouse_up.bind(me));

		me.showCoordinates = Function.buffer(100, me.showCoordinates.bind(me));
		me.hideCoordinates = Function.buffer(100, me.hideCoordinates.bind(me));
		$(me.gameContainer).on('mouseleave', me.hideCoordinates.bind(me));
	},

	createGrid: function() {
		var me = this;

		console.log("creating grid...",me.gridCols,me.gridRows);

	    for (var x=0; x<me.gridCols; x++) {
	    	me._grid[x] = {};

	    	for (var y=0; y<me.gridRows; y++) {

	    		me._grid[x][y] = null;

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

        if (dt > 1 || me.lastTick == null) {

		    me.update(dt);

	        me.lastTick = new Date().getTime();
	    }

		if (!me.isDragging && me._cameraTaget) {
			var delta = VMath.multiplyScalar(VMath.substract(me._cameraTaget, me.levelContainer.position), me._cameraSpeed);

			if (VMath.magnitude(delta) > 2) {
				me.levelContainer.position = VMath.add(me.levelContainer.position, delta);
			} else {
				me._cameraTaget = null;
			}
		}
		
		me.renderer.render(me.stage);

		requestAnimFrame(me.animate.bind(me));
	},

	update: function (dt) {
		var me = this;

		for (var id in me._wizardSprites) {
			me._wizardSprites[id].update(dt);
		}

		for (var id in me._projectileSprites) {
			for (var j in me._projectileSprites[id]) {
				me._projectileSprites[id][j].update(dt);
			}
		}

		me.collectCommands();

		for (var playerId in me._commandQueue) {
			var commandList = me._commandQueue[playerId];
			if (commandList.length > 0) {
				var command = commandList.pop();
				var wizard = me._wizardSprites[playerId];

				wizard[command.name].apply(wizard, command.parameters);
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

		while (me.get_element_at(x, y) != null) {
			x = Math.floor(Math.random() * me.gridCols);
			y = Math.floor(Math.random() * me.gridRows);
		}

		return new PIXI.Point(x,y);
	},

	add_projectile: function(playerId, position, type) {
		var me = this;
		console.log("add_projectile",playerId, position, type);

		var projectile = new MF.Projectile(playerId, position, type);

		if (!me._projectileSprites[playerId]) {
			me._projectileSprites[playerId] = [];
		}
		me._projectileSprites[playerId].push(projectile);

		me.levelContainer.addChild(projectile.sprite);

		return projectile;
	},

	remove_projectile: function(projectileSprite) {
		var me = this;
		
		if (me._projectileSprites[projectileSprite.playerId]) {
			var index = me._projectileSprites[projectileSprite.playerId].indexOf(projectileSprite);
			delete me._projectileSprites[projectileSprite.playerId][index];

			if (projectileSprite.sprite) {
				me.levelContainer.removeChild(projectileSprite.sprite);
				projectileSprite.sprite = null;
			}

			if (projectileSprite.tilePosition.x > 0 && projectileSprite.tilePosition.x < me.gridCols &&
				projectileSprite.tilePosition.y > 0 && projectileSprite.tilePosition.y < me.gridRows) {
				
				me._grid[projectileSprite.tilePosition.x][projectileSprite.tilePosition.y] = null;
			}

			projectileSprite.isAlive = false;
		}
	},

	add_wizard: function(playerId) {
		var me = this;

		if (me._wizards[playerId]) {
			console.error("Wizard for player '" + playerId + "' already exists. tsnh.");
		}

		var magic = new MF.Magic(playerId);
		var wizard = new MF.Wizard(magic);
		me._wizards[playerId] = wizard;

		var playerTextureId = MF.Textures.Wizard_Novice;

		if (MF.Client.userId == playerId) {
			playerTextureId = MF.Textures.Wizard_Me;
		}

		var sprite = new PIXI.Sprite(PIXI.TextureCache[playerTextureId]);

		var tPos = me.get_random_grid_position();
		var wizardSprite = new MF.Creature(playerId, sprite, tPos);
		me._wizardSprites[playerId] = wizardSprite;
		me.levelContainer.addChild(wizardSprite.sprite);

		return wizard;
	},

	remove_wizard: function(wizard) {
		var me = this;

		var playerId, wizard;
		if (typeof(wizard) == "string" || typeof(wizard) == "number") {
			playerId = wizard;
			if (me._wizards[playerId]) {
				wizard = me._wizardSprites[playerId];
			} else {
				wizard = null;
			}
		} else {
			playerId = wizard.playerId;
		}

		if (wizard) {
			delete me._wizards[playerId];
			if (wizard.sprite) {
				me.levelContainer.removeChild(wizard.sprite);
				wizard.sprite = null;
			}
			delete me._wizardSprites[playerId];
			delete me._commandQueue[playerId];

			me._grid[wizard.tilePosition.x][wizard.tilePosition.y] = null;

			if (playerId == MF.Client.userId) {
				MF.Controller.gameOver();
			}

			wizard.isAlive = false;
		}
	},

	get_wizard: function(playerId) {
		var me = this;
		
		return me._wizards[playerId];
	},

	get_wizard_sprite: function(playerId) {
		var me = this;
		
		return me._wizardSprites[playerId];
	},

	get_wizard_at: function(x,y) {
		var me = this;

		var result = null;

		if (me._grid[x] && me._grid[x][y]) {
			var element = me._grid[x][y];
			if (element && element._type == 'creature') {
				result = wizard;
			}
		}

		return result;
	},

	get_element_at: function(x,y) {
		var me = this;
		var result = null;

		if (x >= 0 && y >= 0 && x < me.gridCols && y < me.gridRows) {
			result = me._grid[x][y];
		}

		return result;
	},

	get_projectile_data: function() {
		var me = this;

		var result = {};

		for (var id in me._projectileSprites) {
			var projectiles = me._projectileSprites[id];
			result[id] = [];

			for (var i in projectiles) {
				var projectileSprite = projectiles[i];

				result[id].push({
					position: {
						x: projectileSprite.tilePosition.x, 
						y: projectileSprite.tilePosition.y
					},
					type: projectileSprite.type,
					velocity: projectileSprite.velocity
				});
			}
		}

		return result;
	},

	set_projectile_data: function(projectile_data) {
		var me = this;
		
		for (var playerId in projectile_data) {
			var data = projectile_data[playerId];

			var projectileSprites = me._projectileSprites[playerId];
			for (var j in projectileSprites) {
				me.remove_projectile(projectileSprites[j]);
			}

			for (var i in data) {
				var projectile = data[i];
				var projectileSprite = me.add_projectile(playerId, new PIXI.Point(projectile.position.x, projectile.position.y), projectile.type);
				projectileSprite.set_direction(projectile.velocity);
			}
		}
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
				health: wizardSprite.health
			};
		}

		return result;
	},

	set_wizard_data: function(wizard_data) {
		var me = this;
		
		for (var playerId in wizard_data) {
			var data = wizard_data[playerId];
			var wizardSprite = me._wizardSprites[playerId];

			if (!wizardSprite) {
				console.error("no wizard for player with ID '" + playerId + "' found...");
			} else {

				me.set_element_tile_position(wizardSprite, data.position);
				wizardSprite.health = data.health;
			}
		}
	},

	get_command_data: function() {
		var me = this;

		var result = {};

		for (var playerId in me._commandQueue) {
			var commandList = me._commandQueue[playerId];

			result[playerId] = {
				commands: commandList
			};
		}

		return result;
	},

	set_command_data: function(command_data) {
		var me = this;
		
		for (var playerId in command_data) {
			var data = command_data[playerId];
			me._commandQueue[playerId] = data.commands;
		}
	},

	move_camera_to: function(obj) {
		var me = this;

		var pos;
		if (typeof(obj.x) == 'number' && typeof(obj.y) == 'number') {
			pos = obj;
		} else {
			pos = obj.tilePosition;
		}

		var tileCenter = new PIXI.Point(
				Math.floor((me.width / 2) / me.tileWidth),
				Math.floor((me.height / 2) / me.tileHeight));

		var newScreenEdge = VMath.substract(pos, tileCenter)

	    me._cameraTaget = new PIXI.Point(
	    	-newScreenEdge.x * me.tileWidth,
	    	-newScreenEdge.y * me.tileHeight);
	},

	set_element_tile_position: function(element, tPos) {
	    var me = this;
	    var result = false;

	    var existing_element = me.get_element_at(tPos.x, tPos.y);

	    if (existing_element == element) {
	    	return true;
	    }

	    if (existing_element) {
	    	console.log("collision",existing_element,element);
	        element.onCollision(existing_element);
	    } else if (tPos.x >= 0 && tPos.y >= 0 && tPos.x < me.gridCols && tPos.y < me.gridRows) {

	    	me._grid[element.tilePosition.x][element.tilePosition.y] = null;

	        element.tilePosition = tPos;

	        element.sprite.position = new PIXI.Point(tPos.x * me.tileWidth + element.centerOffset.x, tPos.y * me.tileHeight + element.centerOffset.y);
	        element.sprite.position = VMath.add(element.sprite.position, element.sprite.pivot);

			me._grid[tPos.x][tPos.y] = element;

			console.log("set_element_tile_position", element._type, element, tPos);

	        result = true;
	    }

	    return result;
	},

	// Events
	on_mouse_down: function(e) {
		var me = this;

		me.isDragging = true;
		me.dragStart = new PIXI.Point(e.pageX, e.pageY);
		me.containerStart = new PIXI.Point(me.levelContainer.position.x, me.levelContainer.position.y);
		$(me.gameContainer).addClass('dragging');
	},

	on_mouse_move: function(e) {
		var me = this;

		var pos = new PIXI.Point(e.pageX, e.pageY);

		if (me.isDragging) {
			var delta = VMath.substract(pos, me.dragStart);
			me.levelContainer.position.x = me.containerStart.x + delta.x;
			me.levelContainer.position.y = me.containerStart.y + delta.y;
		} else {
			var offset = $(me.gameContainer).offset();
			var x = pos.x - me.levelContainer.position.x - offset.left;
			var y = pos.y - me.levelContainer.position.y - offset.top;

			x = Math.floor(x / me.tileWidth);
			y = Math.floor(y / me.tileWidth);
			if (x >= 0 && y >= 0 && x < me.gridCols && y < me.gridRows) {
				me.showCoordinates(x,y);
			} else {
				me.hideCoordinates();
			}
		}
	},

	on_mouse_up: function(e) {
		var me = this;

		me.isDragging = false;
		$(me.gameContainer).removeClass('dragging');
	},

	showCoordinates: function(x,y) {
		$('#gamecoordinates').text("X: " + x + " Y: " + y);
	},

	hideCoordinates: function(x,y) {
		$('#gamecoordinates').text("");
	}
};
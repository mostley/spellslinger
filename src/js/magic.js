if (typeof(MF) === "undefined") {
	window.MF = {};
}

/*
 * ===== Mock Magic =====
 */
MF.Magic = function(playerId) {
	var me = this;

	me._playerId = playerId;
	me._commands = [];
};
MF.MockMagic = function() {
	var me = this;

	me.mana = 0;
};

MF.Magic._methods = {
	'move_left': {
		parameterRequired: false,
		manaCost: 1
	}, 
	'move_right': {
		parameterRequired: false,
		manaCost: 1
	}, 
	'move_up': {
		parameterRequired: false,
		manaCost: 1
	}, 
	'move_down': {
		parameterRequired: false,
		manaCost: 1
	}, 
	'throw_fireball': {
		parameterRequired: true,
		manaCost: 1
	}
};

for (var name in MF.Magic._methods) {
	var method = MF.Magic._methods[name];

	MF.Magic.prototype[name] = function(parameter) {
		var me = this;
		if (typeof(parameter) === 'undefined' && method.parameterRequired) {
			throw new Error("A parameter is required. See Docu for more informatione");
		} else {
			me._commands.push({
				name: name,
				parameter: $.extend(true, {}, parameter)
			});
		}
	};

	MF.MockMagic.prototype[name] = function(parameter) {
		if (typeof(parameter) === 'undefined' && method.parameterRequired) {
			throw new Error("A parameter is required. See Docu for more informatione");
		} else {
			this.mana += method.manaCost;
		}
	};
}

MF.Magic.prototype._popAllCommands = function() {
	var me = this;

	var result = me._commands;
	me._commands = [];
	return result;
};



MF.MockMagic.prototype.get_total = function() {
	var me = this;

	return me.mana;
};
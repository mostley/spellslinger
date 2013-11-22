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

['move_left', 'move_right', 'move_up', 'move_down', 'throw_fireball'].forEach(function(name) {
	MF.Magic.prototype[name] = function(parameter) {
		var me = this;
		me._commands.push({
			name: name,
			parameter: $.extend(true, {}, parameter)
		});
	};
});

MF.Magic.prototype._popAllCommands = function() {
	var me = this;

	var result = me._commands;
	me._commands = [];
	return result;
};


/*
 * ===== Mock Magic =====
 */
MF.MockMagic = function() {
	var me = this;

	me.mana = 0;
};

MF.MockMagic._manaCost = {
	'move_left': 1,
	'move_right': 1,
	'move_up': 1,
	'move_down': 1,
	'throw_fireball': 1
};

for (var name in MF.MockMagic._manaCost) {

	MF.MockMagic.prototype[name] = function() {
		this.mana += MF.MockMagic._manaCost[name];
	};
}

MF.MockMagic.prototype.get_total = function() {
	var me = this;

	return me.mana;
};
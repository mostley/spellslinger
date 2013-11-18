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

['move_left', 'move_right', 'move_up', 'move_down'].forEach(function(name) {
	MF.Magic.prototype[name] = function() {
		var me = this;
		me._commands.push(name);
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

MF.MockMagic.prototype.get_total = function() {
	var me = this;

	return me.mana;
};

MF.MockMagic.prototype.move_left = function() {
	var me = this;

	me.mana = me.mana + 1;
};

MF.MockMagic.prototype.move_right = function() {
	var me = this;
	
	me.mana = me.mana + 1;
};

MF.MockMagic.prototype.move_up = function() {
	var me = this;
	
	me.mana = me.mana + 1;
};

MF.MockMagic.prototype.move_down = function() {
	var me = this;
	
	me.mana = me.mana + 1;
};

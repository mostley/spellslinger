if (typeof(MF) === "undefined") {
	window.MF = {};
}

/*
 * ===== Mock Magic =====
 */
MF.Magic = function(playerId) {
	var me = this;

	me.playerId = playerId;
};

MF.Magic.prototype.move_left = function(amount) {
	//TODO
};

MF.Magic.prototype.move_right = function(amount) {
	//TODO
};

MF.Magic.prototype.move_up = function(amount) {
	//TODO
};

MF.Magic.prototype.move_down = function(amount) {
	//TODO
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

MF.MockMagic.prototype.move_left = function(amount) {
	var me = this;

	me.mana = me.mana + 1;
};

MF.MockMagic.prototype.move_right = function(amount) {
	var me = this;
	
	me.mana = me.mana + 1;
};

MF.MockMagic.prototype.move_up = function(amount) {
	var me = this;
	
	me.mana = me.mana + 1;
};

MF.MockMagic.prototype.move_down = function(amount) {
	var me = this;
	
	me.mana = me.mana + 1;
};

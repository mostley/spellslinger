if (typeof(MF) === "undefined") {
	window.MF = {};
}

MF.Wizard = function(magic) {
	var me = this;

	me.magic = magic;
};

function set_func_alias (names, func) {
	for (var i in names) {
		var name = names[i];
		MF.Wizard.prototype[name] = func;
		MF.Wizard.__proto__[name] = func;
	}
}

set_func_alias(["goLeft", "left", "moveLeft", "walkLeft"], function(amount) {
	this.magic.move_left(amount);
});

set_func_alias(["goRight", "right", "moveRight", "walkRight"], function(amount) {
	this.magic.move_right(amount);
});

set_func_alias(["goUp", "up", "moveUp", "walkUp"], function(amount) {
	this.magic.move_up(amount);
});

set_func_alias(["goDown", "down", "moveDown", "walkDown"], function(amount) {
	this.magic.move_down(amount);
});
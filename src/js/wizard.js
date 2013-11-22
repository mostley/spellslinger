if (typeof(MF) === "undefined") {
	window.MF = {};
}

MF.Wizard = function(magic) {
	var me = this;

	me.magic = magic;
};

MF.Wizard._mapping = {
	["goLeft", "left", "moveLeft", "walkLeft"]: 
		'move_left',

	["goRight", "right", "moveRight", "walkRight"]: 
		'move_right',

	["goUp", "up", "moveUp", "walkUp"]: 
		'move_up',

	["goDown", "down", "moveDown", "walkDown"]: 
		'move_down',

	["fireball", "throwFireball"]: 
		'throw_fireball'
};

for (var name_list in MF.Wizard._mapping) {
	var magic_name = MF.Wizard._mapping[name_list];

	for (var i in name_list) {
		var name = name_list[i];
		MF.Wizard.prototype[name] = this.magic[magic_name].bind(this.magic);
		MF.Wizard.__proto__[name] = this.magic[magic_name].bind(this.magic);
	}
}
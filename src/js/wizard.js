if (typeof(MF) === "undefined") {
	window.MF = {};
}

MF.Wizard = function(magic) {
	var me = this;

	me.magic = magic;
	me.x = null;
	me.y = null;
};

if (!MF.Wizard.__proto__) { MF.Wizard.__proto__ = {}; }

MF.Wizard._create_magic_callback = function(magic_name) {
	return function() {
		return this.magic[magic_name].apply(this.magic, arguments);
	};
}

MF.Wizard._set_mapping = function(nameList, magic_name) {
	for (var i in nameList) {
		var name = nameList[i];
		MF.Wizard.__proto__[name] = MF.Wizard.prototype[name] = MF.Wizard._create_magic_callback(magic_name);
	}
}


MF.Wizard._set_mapping(["goLeft", "left", "moveLeft", "walkLeft"], 
		'move_left');

MF.Wizard._set_mapping(["goRight", "right", "moveRight", "walkRight"],
		'move_right');

MF.Wizard._set_mapping(["goUp", "up", "moveUp", "walkUp"],
		'move_up');

MF.Wizard._set_mapping(["goDown", "down", "moveDown", "walkDown"],
		'move_down');

MF.Wizard._set_mapping(["go", "move", "walk"],
		'move');

MF.Wizard._set_mapping(["say", "talk", "speak", "text", "blurt", "brabble", "schwätz", "blubber", "openMouth", "createWords", "incantate", "formulate", "murmur", "whisper"],
		'say_something');

MF.Wizard._set_mapping(["fireball", "throwFireball"],
		'throw_fireball');

MF.Wizard._set_mapping(["look", "lookAt", "see", "discover", "scry", "search", "get", "investigate"],
		'look_at');

MF.Wizard._set_mapping(["meditate", "wait", "idle", "skip", "stay", "chill", "relax", "nap"],
		'skip_round');
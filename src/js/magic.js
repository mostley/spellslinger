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
MF.MagicElementType = {
	Nothing: 'nothing',
	Wizard: 'wizard',
	Fireball: 'Fireball'
};
MF.MagicElement = function(magic, id, x, y, type) {
	var me = this;

	me._magic = magic;

	me._element_id = id;
	me.x = x;
	me.y = y;
	me.type = type;
};

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

(function () {
	var _methods = {
		'move_left': {
			parametersRequired: 0,
			manaCost: 1
		}, 
		'move_right': {
			parametersRequired: 0,
			manaCost: 1
		}, 
		'move_up': {
			parametersRequired: 0,
			manaCost: 1
		}, 
		'move_down': {
			parametersRequired: 0,
			manaCost: 1
		}, 
		'move': {
			parametersRequired: 2,
			manaCost: 1
		}, 
		'say_something': {
			parametersRequired: 1,
			manaCost: 1
		}, 
		'throw_fireball': {
			parametersRequired: 2,
			manaCost: 1
		}, 
		'move_element': {
			parametersRequired: 3,
			manaCost: 1
		}
	};

	function _cloneArray(args) {
		var result = [];
		for (var i in args) {
			if (typeof(args[i]) === "object") {
				result.push($.extend(true, {}, args[i]));
			} else {
				result.push(args[i]);
			}
		}
		return result;
	}

	function _createPushCommandDelegate(name, method) {
		return function() {
			var me = this;
			if (arguments.length != method.parametersRequired) {
				throw new Error(method.parametersRequired + " parameter(s) is/are required. See Docu for more information.");
			} else {
				var args = _cloneArray(arguments);
				me._commands.push({
					name: name,
					parameters: args
				});
			}
		};
	}

	function _createMockDelegate(name, method) {
		return function() {
			if (arguments.length != method.parametersRequired) {
				throw new Error(method.parametersRequired + " parameter(s) is/are required. See Docu for more information.");
			} else {
				this.mana += method.manaCost;
			}
		};
	}

	for (var name in _methods) {
		var method = _methods[name];

		MF.Magic.prototype[name] = _createPushCommandDelegate(name, method);

		MF.MockMagic.prototype[name] = _createMockDelegate(name, method);
	}

	MF.MagicElement.prototype.move = function(x, y) {
		var me = this;
		if (me.type != MF.MagicElementType.Nothing) {
			me._magic.move_element(me._element_id, x, y);
		} else {
			throw { message: "no element at " +me.x+":"+me.y };
		}
	};

	var internal_look_at = function(x, y) {
		var result = null;
		var element = MF.Game.get_element_at(x,y);

		if (element) {
			result = element;
		}

		return result;
	};

	MF.MockMagic.prototype.look_at = MF.Magic.prototype.look_at = function(x,y) {
		var element = internal_look_at(x, y);
		var id = null;
		var type = MF.MagicElementType.Nothing;
		if (element) {
			id = element._id;
			type = element._magicElementType;
		}
		return new MF.MagicElement(this, id, x, y, type);
	};
	

})();
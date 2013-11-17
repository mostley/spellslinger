if (typeof(MF) === "undefined") {
	window.MF = {};
}

MF.Executor = {
	init: function() {
	},

	execute: function(playerId, code) {
		var me = this;

		var wizard = MF.Game.get_wizard(playerId);

		me._execute_code(wizard, code);
	},

	calculate_mana_cost: function(code) {
		var me = this;

		var magic = new MF.MockMagic();
		var wizard = new MF.Wizard(magic);

		me._execute_code(wizard, code);

		return magic.get_total();
	},

	_execute_code: function(wizard, code) {

		//TODO some checks

		var enrichedCode = "(function(wizard) { " + code + " })";

		var codeFunction = eval(enrichedCode);

		codeFunction(wizard);
	}
};
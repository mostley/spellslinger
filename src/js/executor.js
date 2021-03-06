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

		var magic = new MF.MockMagic(MF.Client.userId);
		var wizard = new MF.Wizard(magic);

		me._execute_code(wizard, code);

		return magic.get_total();
	},

	validate: function(code) {
		var me = this;

		var result = { success: true, error: null };

		var playerId = MF.Client.userId;

		var magic = new MF.MockMagic(playerId);
		var wizard = new MF.Wizard(magic);

		if (wizard) {
			var wizardSprite = MF.Game.get_wizard_sprite(playerId)
			wizard.x = wizardSprite.tilePosition.x;
			wizard.y = wizardSprite.tilePosition.y;
		}

		result.error = me._execute_code(wizard, code);
		result.success = result.error == null;

		return result;
	},

	_execute_code: function(wizard, code) {

		//TODO some checks

		var preambel = "var $ = {}; var window = {}; var document = {}; var MF = undefined; var alert = undefined;";

		var enrichedCode = "(function(wizard) { " + preambel + code + " })";

		var result = null;

		try {
			var codeFunction = eval(enrichedCode);

			codeFunction.call(wizard, wizard);
		} catch (e) {
			result = e;
			console.error("Failed to execute code.", e);
		}

		return result;
	}
};
function getCreatureMovieClip(creature) {
	var result = new PIXI.MovieClip([PIXI.TextureCache[creature], PIXI.TextureCache[creature]]);
	result.animationSpeed = 0.05 + Math.random() / 50;
	return result;
}

/*
 * ================ Creature ================
 */

MF.Creature = function(sprite, tPos)
{
    var me = this;

    me.health = 100;
    me.currentSpeech = null;

    me.sprite = sprite;
    me.tilePosition = tPos;

    this.sprite.pivot.x = 12;
    this.sprite.pivot.y = 12.5;

    me._set_tile_position(tPos);

    me.speeches = [];
};

MF.Creature.constructor = MF.Creature;


MF.Creature.prototype._set_tile_position = function (tPos) {
    var me = this;

    me.sprite.position = new PIXI.Point(tPos.x * MF.Game.tileWidth, tPos.y * MF.Game.tileHeight);
    me.sprite.position = VMath.add(me.sprite.position, this.sprite.pivot);
};

MF.Creature.prototype.update = function (dt) {
    var me = this;

    if (me.currentSpeech) {
    	if (MF.Game.time > me.currentSpeech.endTime) {
    		me.sprite.removeChild(me.currentSpeech.sprite);
    		me.currentSpeech = null;
    	}
    } else {
	    var speech = me.speeches.pop();
	    if (speech) {
	        me.doSay(speech);
	    }
	}
};

MF.Creature.prototype.damage = function (shot) {
    var me = this;

    me.health -= shot.damage;
};

MF.Creature.prototype.move_left = function () {
    var me = this;

    if (me.tilePosition.x >= 0) {
        me.sprite.position.x -= MF.Game.tileWidth;
        me.tilePosition.x -= 1;
    }

    me.sprite.scale.x = 1;

    if (me.currentSpeech) {
    	me.currentSpeech.sprite.scale.x = 1;
		me.currentSpeech.sprite.position.x = 0;
    }
};

MF.Creature.prototype.move_right = function () {
    var me = this;
    
    if (me.tilePosition.x < MF.Game.gridCols) {
        me.sprite.position.x += MF.Game.tileWidth;
        me.tilePosition.x += 1;
    }

    me.sprite.scale.x = -1;

    if (me.currentSpeech) {
    	me.currentSpeech.sprite.scale.x = -1;
    }
};

MF.Creature.prototype.move_up = function () {
    var me = this;

    if (me.tilePosition.y >= 0) {
        me.sprite.position.y -= MF.Game.tileHeight;
        me.tilePosition.y -= 1;
    }
};

MF.Creature.prototype.move_down = function () {
    var me = this;

    if (me.tilePosition.y < MF.Game.gridRows) {
        me.sprite.position.y += MF.Game.tileHeight;
        me.tilePosition.y += 1;
    }
};

MF.Creature.prototype.say = function (text, duration) {
    var me = this;

    me.speeches.splice(0, 0, {
    	text: text,
    	duration: duration,
    	endTime: null,
    	sprite: null
    });
};

MF.Creature.prototype.doSay = function (speech) {
    var me = this;

	me.currentSpeech = speech
    me.currentSpeech.endTime = MF.Game.time + me.currentSpeech.duration;
	me.currentSpeech.sprite = new PIXI.Text(speech.text, {
		align: 'center',
		font: '16pt Arial',
		fill: 'white'
	});
	me.currentSpeech.sprite.scale.x = me.sprite.scale.x;
	if (me.currentSpeech.sprite.scale.x < 0) {
		me.currentSpeech.sprite.position.x = MF.Game.tileWidth;
	}
	me.currentSpeech.sprite.position.y = -MF.Game.tileWidth/2;
	me.sprite.addChild(me.currentSpeech.sprite);
};

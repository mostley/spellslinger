function getCreatureMovieClip(creature) {
	var result = new PIXI.MovieClip([PIXI.TextureCache[creature], PIXI.TextureCache[creature]]);
	result.animationSpeed = 0.05 + Math.random() / 50;
	return result;
}

/*
 * ================ Creature ================
 */

MF.Creature = function(playerId, sprite, tPos)
{
    var me = this;

    me._type = "creature";

    me.health = 100;
    me.currentSpeech = null;

    me.playerId = playerId;
    me.sprite = sprite;
    me.tilePosition = tPos;

    this.sprite.pivot.x = 12;
    this.sprite.pivot.y = 12.5;

    me.centerOffset = new PIXI.Point(0, 0);

    me._set_tile_position(tPos);

    me.speeches = [];

    me.isAlive = true;
};

MF.Creature.constructor = MF.Creature;


MF.Creature.prototype._set_tile_position = function (tPos) {
    var me = this;
    return MF.Game.set_element_tile_position(me, tPos);
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

MF.Creature.prototype.damageWith = function (shot) {
    var me = this;

    me.health -= shot.damage;

    if (me.health <= 0 && me.isAlive) {
        console.log("wizard was killed by",shot);
        //TODO log message
        MF.Game.remove_wizard(me);
        me.isAlive = false;
    }
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

MF.Creature.prototype.throw_fireball = function (x, y) {
    var me = this;

    var direction = { x: x, y: y };

    var dirX = direction.x == 0 ? 0 : ( direction.x > 0 ? 1 : -1 );
    var dirY = direction.y == 0 ? 0 : ( direction.y > 0 ? 1 : -1 );
    
    var pos = VMath.add(me.tilePosition, new PIXI.Point(dirX, dirY));

    var projectile = MF.Game.add_projectile(me.playerId, pos, MF.ProjectileTypes.Fireball);
    projectile.set_direction(direction);
};

MF.Creature.prototype.say_something = function (text, duration) {
    var me = this;

    me.speeches.splice(0, 0, {
    	text: text,
    	duration: duration || 5,
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
		font: '12pt Arial',
		fill: 'white'
	});
	me.currentSpeech.sprite.scale.x = me.sprite.scale.x;
	if (me.currentSpeech.sprite.scale.x < 0) {
        me.currentSpeech.sprite.position.x = MF.Game.tileWidth/2-me.currentSpeech.sprite.width/2;
	} else {
        me.currentSpeech.sprite.position.x = -me.currentSpeech.sprite.width/2 + MF.Game.tileWidth/2;
    }
	me.currentSpeech.sprite.position.y = -MF.Game.tileWidth;
	me.sprite.addChild(me.currentSpeech.sprite);
};

MF.Creature.prototype.onCollision = function (collidedElement) {
    var me = this;

    if (collidedElement._type == 'projectile') {
        me.damageWith(collidedElement);
    }
};

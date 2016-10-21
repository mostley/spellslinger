/*
 * ================ Animation ================
 */

MF.Animation = function(tPos, animationSpriteIds, loop)
{
    var me = this;

    var textures = [];

    for (var i in animationSpriteIds) {
        textures.push(PIXI.TextureCache[animationSpriteIds[i]]);
    }

    me.sprite = new PIXI.MovieClip(textures);
    me.sprite.animationSpeed = 0.06;
    me.sprite.loop = loop;
    me.sprite.play();

    this.sprite.pivot.x = 12;
    this.sprite.pivot.y = 12.5;

    me.centerOffset = new PIXI.Point(-4, -4);

    me.sprite.position = new PIXI.Point(tPos.x * MF.Game.tileWidth + me.centerOffset.x, tPos.y * MF.Game.tileHeight + me.centerOffset.y);
    me.sprite.position = VMath.add(me.sprite.position, me.sprite.pivot);

    me.isAlive = true;
};

MF.Animation.constructor = MF.Animation;

MF.Animation.prototype.update = function (dt) {
    var me = this;

    if (!me.sprite.playing) {
        me.isAlive = false;
    }
};

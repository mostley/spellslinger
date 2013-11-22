/*
 * ================ Projectile ================
 */

MF.ProjectileTypes = {
    Fireball: {
        name: 'fireball',
        damage: 10
    }
};

MF.Projectile = function(playerId, tPos, type)
{
    var me = this;

    me.playerId = playerId;
    me.tilePosition = tPos;
    me.sprite = new PIXI.Sprite(PIXI.TextureCache[MF.Textures.Projectiles[type.name]]);

    me.sprite.pivot.x = 12;
    me.sprite.pivot.y = 12.5;

    me._set_tile_position(tPos);

    me.velocity = new PIXI.Sprite(0, 0);

    me.damage = type.damage; 
};

MF.Projectile.constructor = MF.Projectile;

MF.Projectile.prototype.set_direction = function (dir) {
    var me = this;

    me.velocity = VMath.normalize(dir);
};

MF.Projectile.prototype._set_tile_position = function (tPos) {
    var me = this;

    me.sprite.position = new PIXI.Point(tPos.x * MF.Game.tileWidth, tPos.y * MF.Game.tileHeight);
    me.sprite.position = VMath.add(me.sprite.position, me.sprite.pivot);
};

MF.Projectile.prototype.update = function (dt) {
    var me = this;
    var newPos = VMath.add(me.tilePosition, me.velocity);

    if (me.tilePosition.x >= 0 && me.tilePosition.y >= 0 && me.tilePosition.x < MF.Game.gridCols && me.tilePosition.y < MF.Game.gridRows) {
        me._set_tile_position(newPos);

        var collidedWizard = MF.Game.get_wizard_at(me.tilePosition.x, me.tilePosition.y);
        if (collidedWizard) {
            collidedWizard.damageWith(me);
            me.explode();
        }
    } else {
        me.explode();
    }
};

MF.Projectile.prototype.explode = function () {
    var me = this;

    MF.Game.remove_projectile(me);
    
    //TODO add explosion animation
};

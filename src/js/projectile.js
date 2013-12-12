/*
 * ================ Projectile ================
 */

MF.ProjectileTypes = {
    Fireball: {
        name: 'fireball',
        damage: 20
    }
};

MF.Projectile = function(playerId, tPos, type, id)
{
    var me = this;

    if (id) {
        MF.Game._idRegistry[id] = me;
    }

    me._id = id || MF.Game.create_id(me);
    me._type = "projectile";
    me._magicElementType = MF.MagicElementType.Fireball;

    me.playerId = playerId;
    me.tilePosition = tPos;
    me.type = type;
    me.sprite = new PIXI.Sprite(PIXI.TextureCache[MF.Textures.Projectiles[type.name]]);

    me.sprite.pivot.x = 12;
    me.sprite.pivot.y = 12.5;

    me.centerOffset = new PIXI.Point(-4, -4);

    me._set_tile_position(tPos);

    me.velocity = new PIXI.Point(0, 0);

    me.damage = type.damage;

    me.isAlive = true;
};

MF.Projectile.constructor = MF.Projectile;

MF.Projectile.prototype.move = function (dirX, dirY) {
    var me = this;

    dirX = dirX == 0 ? 0 : ( dirX > 0 ? 1 : -1 );
    dirY = dirY == 0 ? 0 : ( dirY > 0 ? 1 : -1 );

    me._set_tile_position(VMath.add(me.tilePosition, new PIXI.Point(dirX,dirY)));
    me.set_direction(new PIXI.Point(dirX,dirY));
};

MF.Projectile.prototype.set_direction = function (direction) {
    var me = this;

    var dirX = direction.x == 0 ? 0 : ( direction.x > 0 ? 1 : -1 );
    var dirY = direction.y == 0 ? 0 : ( direction.y > 0 ? 1 : -1 );
    //direction = VMath.normalize(direction);
    
    me.velocity = new PIXI.Point(dirX, dirY);
};

MF.Projectile.prototype._set_tile_position = function (tPos) {
    var me = this;
    var result = MF.Game.set_element_tile_position(me, tPos);
    if (!result) {
        me.explode();
    }
    return result;
};

MF.Projectile.prototype.update = function (dt) {
    var me = this;
    var newPos = VMath.add(me.tilePosition, me.velocity);
    newPos.x = Math.floor(newPos.x);
    newPos.y = Math.floor(newPos.y);

    if (newPos.x >= 0 && newPos.y >= 0 && newPos.x < MF.Game.gridCols && newPos.y < MF.Game.gridRows) {
        me._set_tile_position(newPos);
    } else {
        me.explode();
    }
};

MF.Projectile.prototype.damageWith = function (damagingElement) {
    var me = this;

    me.explode();
};

MF.Projectile.prototype.explode = function () {
    var me = this;

    if (me.isAlive) {
        MF.Game.remove_projectile(me);

        me.isAlive = false;
        
        MF.Game.add_explosion(me.tilePosition);
    }
};

MF.Projectile.prototype.onCollision = function (collidedElement) {
    var me = this;

    collidedElement.damageWith(me);

    me.explode();
};

var VMath = {

    magnitudeSqr: function (p) {
        return p.x * p.x + p.y * p.y;
    },

    magnitude: function (p) {
        return Math.sqrt(p.x * p.x + p.y * p.y);
    },

    normalize: function (p) {
        return VMath.divideScalar(p, VMath.magnitude(p));
    },

    distance: function (a, b) {
        return Math.sqrt(Math.pow(b.x-a.x,2) + Math.pow(b.y-a.y,2));
    },

    substract: function (a, b) {
        return new PIXI.Point(a.x-b.x, a.y-b.y);
    },

    add: function (a, b) {
        return new PIXI.Point(a.x+b.x, a.y+b.y);
    },

    multiplyScalar: function (a, b) {
        return new PIXI.Point(a.x*b, a.y*b);
    },

    divideScalar: function (a, b) {
        return new PIXI.Point(a.x/b, a.y/b);
    }
};
if (typeof(MF) === "undefined") {
	window.MF = {};
}

MF.ResourceLoader = {
	resources: {},
	images: {},

	addTileset: function(tileset, callback) {
		var me = this;

		var texture = PIXI.Texture.fromImage(tileset.image);

		var w = tileset.imagewidth - tileset.margin;
		var h = tileset.imageheight - tileset.margin;
		tileset.colCount = Math.floor(w / (tileset.tilewidth + tileset.spacing));
		if (tileset.spacing > 0) { tileset.colCount++; }
		tileset.rowCount = Math.floor(h / (tileset.tileheight + tileset.spacing));
		if (tileset.spacing > 0) { tileset.rowCount++; }

		//console.log(tileset.imagewidth, w, tileset.tilewidth + tileset.spacing,w / (tileset.tilewidth + tileset.spacing));

		tileset.imageCount = tileset.colCount * tileset.rowCount;

		me.images[tileset.image] = tileset;

		var index = tileset.firstgid;
		for (var y=0; y<tileset.rowCount; y++) {
			for (var x=0; x<tileset.colCount; x++) {
				PIXI.TextureCache[index] = new PIXI.Texture(texture, {
					x: (x * tileset.tilewidth) + (x * tileset.spacing) + tileset.margin+1,
					y: (y * tileset.tileheight) + (y * tileset.spacing) + tileset.margin+1,
					width: tileset.tilewidth-2,
					height: tileset.tileheight-2,
					tileoffset: tileset.tileoffset
				});

				index++;
			}
		}

		callback();
	},

	loadSounds: function(sounds) {
		for (var i in sounds) {
			var sound = sounds[i];
			soundManager.createSound({
				id: sound.name,
				url: sound.file,
				autoLoad: true,
				autoPlay: false,
				volume: 50
			});
		}
	},

	loadTilesets: function(tilesets) {
		var me = this;

	    var resourceCounter = 0;
	    var resourcesToLoad = tilesets.length;
	    var resourceLoaded = function() {
	        resourceCounter++;
	        console.log("resource " + resourceCounter + " of " + resourcesToLoad + " loaded.");
	        if (resourceCounter >= resourcesToLoad) {
	        	console.log("all resources loaded.");
	        }
	    };

	    for (var i=0; i<resourcesToLoad; i++) {
	        me.addTileset(tilesets[i], resourceLoaded);
	    }
	}
};
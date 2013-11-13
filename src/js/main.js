var width = 300;
var height = 400;
var stage = new PIXI.Stage(0x000000);

var renderer = PIXI.autoDetectRenderer(width, height);

var fps = 60;
var interval = 1000 / fps;

document.getElementById("game").appendChild(renderer.view);
requestAnimFrame(animate);

// loop
function animate()
{
	setTimeout(function() {
	    requestAnimFrame(animate);
	    update();
	    renderer.render(stage);
	}, interval);
};

// loop logik
function update()
{
	// Game Code
};


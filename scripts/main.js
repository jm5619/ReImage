var draw;
var drawWorker;
var mainMeans;

document.onload = function() {
		//document.getElementById("selector").addEventListener("change", logFile());
}

function reimage() {
	var canvas = document.getElementById("canvas");
	var canvasOrig = document.getElementById("canvas_orig");
	var ctx = canvas.getContext("2d");
	var ctxOrig = canvasOrig.getContext("2d");

	imgOrig = ctxOrig.getImageData(0, 0, canvasOrig.width, canvasOrig.height);
	var imgArrOrig = imgOrig.data;


	var imageData = ctx.createImageData(imgOrig);
	var imgArr = imageData.data;

	canvas.width = imageData.width;
	canvas.height = imageData.height;

	for (var i = 3; i < imgArr.length; i += 4) {
		imgArr[i] = 255;
	}

	ctx.putImageData(imageData, 0, 0);

	console.log(imgArr);
	console.log(imgArrOrig);

	/* --- begin drawing --- */

	// sizes = [sizeMinH, sizeMaxH, sizeMinW, sizeMaxW];
	var drawMode = 1;
	var sizes = [20, 30, 2, 2];
	var colorMargins = [50, 50, 50];
	var colorMode = 2;

	drawWorker = new Worker("scripts/drawWorker.js");

	drawWorker.onmessage = function(msg) {
		if (draw) {
			drawWorker.postMessage({"first":false});
		}

		imageData = new ImageData(msg.data.imgArr, imageData.width, imageData.height);
		document.getElementById("iterations").innerHTML = msg.data.counter.toLocaleString();
		ctx.putImageData(imageData, 0, 0);
	};

	console.log(mainMeans);
	draw = true;
	drawWorker.postMessage({"first":true, "drawMode":drawMode, "imgArr":imgArr, "imgArrOrig":imgArrOrig,
													"width":imageData.width, "height":imageData.height, "colorMode":colorMode, "means":mainMeans,
													"sizes":sizes, "colorMargins":colorMargins});
}


function genPal() {
	var canvasOrig = document.getElementById("canvas_orig");
	var ctxOrig = canvasOrig.getContext("2d");
	var imgOrig = ctxOrig.getImageData(0, 0, canvasOrig.width, canvasOrig.height);
	var clusterCount = 5;

	paletteWorker = new Worker("scripts/paletteWorker.js");

	paletteWorker.onmessage = function(msg) {
		$("#percent_done").text(msg.data.percentDone+"%");	// update generation percentage

		if (msg.data.done) {																// finished
			var means = msg.data.means
			mainMeans = means;

			var color, boxId;
			for (var i = 0; i < means.length; i += 3) {
				color = "#";
				if (means[i] < 16) color = color + "0";
				color = color + means[i].toString(16);
				if (means[i + 1] < 16) color = color + "0";
				color = color + means[i + 1].toString(16);
				if (means[i + 2] < 16) color = color + "0";
				color = color + means[i + 2].toString(16);

				console.log(color);

				boxId = Math.floor(i / 3);

				$(".palette").append("<div class=\"colorSquare\" id=box"+boxId+"></div>");
				$("#box"+boxId).css("background", color);
			}
		}
	}

	paletteWorker.postMessage({"clusterCount":clusterCount, "imgOrig":imgOrig});
}


function toggle() {
	draw = !draw;

	if (draw) {
		console.log("toggle start");
		drawWorker.postMessage({"first":false, "imgArr":null, "imgArrOrig":null, "width":null});
		document.getElementById("toggle").innerHTML = "Stop";
	} else {
		console.log("toggle stop");
		document.getElementById("toggle").innerHTML = "Resume";
	}
}


function loadFile(evt) {
	var file = evt.target.files[0];
	var reader = new FileReader();

	$("#img-name").text(file.name);

	var imgtag = document.getElementById("preview");

	reader.onload = function(evt)	{
		if (evt.target.result.match('image.*')) {
			console.log(evt);

			//imgtag.src = evt.target.result;

			var canvasOrig = document.getElementById("canvas_orig");
			var img = new Image();

			img.onload = function() {
				canvasOrig.width = img.width;
				canvasOrig.height = img.height;

				console.log(canvasOrig);

				var ctx = canvasOrig.getContext("2d");

				ctx.drawImage(img,0,0);
			}

			img.src = evt.target.result;
		}
	}

	reader.readAsDataURL(file);
}

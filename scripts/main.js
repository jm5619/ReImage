var draw;
var drawWorker;
var mainMeans;

var mainSlots = 5;
var mainActiveColor = -1;

$( document ).ready(function() {
	$("#slot_count").keypress(function(e) {
		if(e.which == 13) setSlots();
	});
});

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


function setSlots() {
	var num = parseInt($("#slot_count").val());

	if (!isNaN(num)) {
		if (num > 255) {
			num = 255;
		} else if (num < 1) {
			num = 1;
		}
		mainSlots = Math.floor(num);
		console.log("set mainSlots to "+mainSlots);

		$("#slot_count").val(mainSlots);

		var snackbarContainer = document.querySelector('#slots_notification');
		'use strict';
		var data = {message: "The palette will contain "+mainSlots+" colors."};
		snackbarContainer.MaterialSnackbar.showSnackbar(data);
	}
}


function readColor(evt) {
	$("#box"+mainActiveColor).css("border-style", "none");
	console.log("#box"+mainActiveColor);

	mainActiveColor = evt.substring(3, evt.length);
	var rgb = [mainMeans[3 * mainActiveColor], mainMeans[3 * mainActiveColor + 1], mainMeans[3 * mainActiveColor + 2]];
	console.log(rgb);

	console.log("#box"+mainActiveColor);
	$("#box"+mainActiveColor).css("border-style", "solid");
	$("#box"+mainActiveColor).css("border-width", "2pt");
	$("#box"+mainActiveColor).css("border-color", "#617c8a");

	$("#slider_r")[0].MaterialSlider.change(rgb[0]);
	$("#slider_g")[0].MaterialSlider.change(rgb[1]);
	$("#slider_b")[0].MaterialSlider.change(rgb[2]);

	$("#slider_r_text").val(rgb[0]);
	$("#slider_g_text").val(rgb[1]);
	$("#slider_b_text").val(rgb[2]);
}


function setColorSlider(id) {
	if (mainActiveColor > -1) {
		var c_value;
		switch (id) {
			case 0:	c_value = $("#slider_r").val();
							$("#slider_r_text").val(c_value);
							break;
			case 1:	c_value = $("#slider_g").val();
							$("#slider_g_text").val(c_value);
							break;
			case 2:	c_value = $("#slider_b").val();
							$("#slider_b_text").val(c_value);
							break;
		}
		setColor(id, c_value);
	}
}


function setColorText(id) {
	if (mainActiveColor > -1) {
		var c_value;
		var c_slider;
		switch (id) {
			case 0:	c_value = $("#slider_r_text").val();
							c_slider = "slider_r";
							break;
			case 1:	c_value = $("#slider_g_text").val();
							c_slider = "slider_g";
							break;
			case 2:	c_value = $("#slider_b_text").val();
							c_slider = "slider_b";
							break;
		}

		c_value = parseInt(c_value);

	 	if (!isNaN(c_value)) {
			if (c_value < 0) {
				c_value = 0;
			} else if (c_value > 255) {
				c_value = 255;
			}

			$("#"+c_slider+"_text").val(c_value);
			$("#"+c_slider)[0].MaterialSlider.change(c_value);

			setColor(id, c_value);
		}
	}
}


function setColor(c_channel, c_val) {
	mainMeans[3 * mainActiveColor + c_channel] = c_val;

	$("#box"+mainActiveColor).css("background", "rgb(" + mainMeans[3 * mainActiveColor]			+ "," +
																										 	 mainMeans[3 * mainActiveColor + 1] + "," +
																										 	 mainMeans[3 * mainActiveColor + 2] + ")" );
}


function genPal() {
	var canvasOrig = document.getElementById("canvas_orig");
	var ctxOrig = canvasOrig.getContext("2d");
	var imgOrig = ctxOrig.getImageData(0, 0, canvasOrig.width, canvasOrig.height);
	var clusterCount = mainSlots;

	paletteWorker = new Worker("scripts/paletteWorker.js");

	paletteWorker.onmessage = function(msg) {
		$("#percent_done").text(msg.data.percentDone+"%");	// update generation percentage

		if (msg.data.done) {																// finished
			$(".palette").empty();

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
				$("#box"+boxId).click(function(evt){readColor(evt.target.id)});

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
		document.getElementById("toggle").innerHTML = "Pause";
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

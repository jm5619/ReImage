var draw;
var drawWorker;
var mainMeans;
var mainDrawMode = 1;								// draw mode: 0 ... rectangles, 1 ... rotated lines
var mainSizes = [20, 30, 2, 2];			// sizes = [sizeMinH, sizeMaxH, sizeMinW, sizeMaxW];
var mainColorMargins = [0, 0, 0];		// margins = intervals, [R, G, B]
var mainColorMode = 2;							// color modes: 0 ... random, 1 ... palette exact, 2 ... palette with intervals

var mainSlots = 5;
var mainActiveColor = -1;

$(document).ready(function() {
	draw = true;
	$("#iterations").text(0);

	$(".color_radio_button").change(function() {
		var snackbarContainer = document.querySelector('#toast_notification');

    if ($(this).val() == 1) {
			mainColorMode = 2;
			var data = {message: "Using colors from palette.", timeout: 800};
			snackbarContainer.MaterialSnackbar.showSnackbar(data);
    } else {
			mainColorMode = 0;
			var data = {message: "Using random colors.", timeout: 800};
			snackbarContainer.MaterialSnackbar.showSnackbar(data);
		}
	});

	$("#slot_count").keypress(function(e) {
		if(e.which == 13) setSlots();
	});

	setIntervalSlider(0);
	setIntervalSlider(1);
	setIntervalSlider(2);
});

function reimage() {
	document.getElementById("toggle").innerHTML = "Pause";
	draw = false;

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

	// set canvas background color
	if (mainColorMode > 0) {
		var darkest = 0;
		var darkestVal = mainMeans[0] + mainMeans[1] + mainMeans[2];
		for (var i = 3; i < darkestVal.length * 3; i += 3) {
			var colSum = mainMeans[i] + mainMeans[i + 1] + mainMeans[i + 2];
			if (colSum < darkestVal) {
				darkest = i;
				darkestVal = colSum;
			}
		}

		var rgbDark = [mainMeans[darkest], mainMeans[darkest + 1], mainMeans[darkest + 2], 255];

		if (mainColorMode > 1) {
			console.log("AYY LMAO MY DUDES");
			for (var i = 0; i < 3; i++) {
				rgbDark[i] = Math.round(rgbDark[i] - mainColorMargins[i] / 2);
			}
		}

		for (var i = 0; i < imgArr.length; i += 4) {
			for (var j = 0; j < 4; j++) {
				imgArr[i + j] = rgbDark[j];
			}
		}
	} else {
		for (var i = 3; i < imgArr.length; i += 4) {
			imgArr[i] = 255;
		}
	}

	ctx.putImageData(imageData, 0, 0);

	console.log(imgArr);
	console.log(imgArrOrig);

	/* --- begin drawing --- */
	if (typeof drawWorker != 'undefined') drawWorker.terminate();
	drawWorker = new Worker("scripts/drawWorker.js");

	drawWorker.onmessage = function(msg) {
		if (draw) {
			drawWorker.postMessage({"first":false});
		}

		imageData = new ImageData(msg.data.imgArr, imageData.width, imageData.height);
		$("#iterations").text(msg.data.counter.toLocaleString());
		ctx.putImageData(imageData, 0, 0);
	};

	console.log(mainMeans);
	draw = true;
	drawWorker.postMessage({"first":true, "drawMode":mainDrawMode, "imgArr":imgArr, "imgArrOrig":imgArrOrig,
													"width":imageData.width, "height":imageData.height, "colorMode":mainColorMode, "means":mainMeans,
													"sizes":mainSizes, "colorMargins":mainColorMargins});
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

		var snackbarContainer = document.querySelector('#toast_notification');
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


function setIntervalSlider(id) {
	var i_value;
	switch (id) {
		case 0:	i_value = $("#i_slider_r").val();
						$("#i_slider_r_text").val(i_value);
						break;
		case 1:	i_value = $("#i_slider_g").val();
						$("#i_slider_g_text").val(i_value);
						break;
		case 2:	i_value = $("#i_slider_b").val();
						$("#i_slider_b_text").val(i_value);
						break;
	}
	setInterval(id, i_value);
}


function setIntervalText(id) {
	var i_value;
	var i_slider;
	switch (id) {
		case 0:	i_value = $("#i_slider_r_text").val();
						i_slider = "i_slider_r";
						break;
		case 1:	i_value = $("#i_slider_g_text").val();
						i_slider = "i_slider_g";
						break;
		case 2:	i_value = $("#i_slider_b_text").val();
						i_slider = "i_slider_b";
						break;
	}

	i_value = parseInt(i_value);

 	if (!isNaN(i_value)) {
		if (i_value < 0) {
			i_value = 0;
		} else if (i_value > 255) {
			i_value = 255;
		}

		$("#"+i_slider+"_text").val(i_value);
		$("#"+i_slider)[0].MaterialSlider.change(i_value);

		setInterval(id, i_value);
	}
}


function setInterval(c_channel, i_val) {
	mainColorMargins[c_channel] = i_val;
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

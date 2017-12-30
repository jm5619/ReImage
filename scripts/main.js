var draw;
var drawWorker;
var mainMeans;
var mainDrawMode = 0;								// draw mode: 0 ... squares, 1 ... rectangles, 2 ... rotated lines
var mainSizes = [1, 1, 1, 1];				// sizes = [sizeMinH, sizeMaxH, sizeMinW, sizeMaxW];
var mainColorMargins = [0, 0, 0];		// margins = intervals, [R, G, B]
var mainColorMode = 2;							// color modes: 0 ... random, 1 ... palette exact, 2 ... palette with intervals
var imageUp = false;
var paletteGenerated = false;

var squareSize = [2, 4];
var rectSize = [2, 6, 2, 6];
var lineSize = [20, 30];
var lineDir = 0;

var mainSlots = 5;
var mainActiveColor = -1;

$(document).ready(function() {
	draw = true;
	$("#iterations").text(0);

	$(".color_radio_button").change(function() {
		var snackbarContainer = document.querySelector('#toast_notification');
		var compval = parseInt($(this).val());

		switch (compval) {
			case 1: mainColorMode = 2;
							if (!paletteGenerated) genPal();
							data = {message: "Using colors from palette.", timeout: 800};
							break;
			case 2:	mainColorMode = 0;
							data = {message: "Using random colors.", timeout: 800};
							break;

			case 3: mainDrawMode = 0;
							$("#square_settings_holder").css("display", "block");
							$("#rect_settings_holder").css("display", "none");
							$("#line_settings_holder").css("display", "none");
							data = {message: "Using squares for basic shape.", timeout: 1000};
							break;
			case 4: mainDrawMode = 1;
							$("#square_settings_holder").css("display", "none");
							$("#rect_settings_holder").css("display", "block");
							$("#line_settings_holder").css("display", "none");
							data = {message: "Using rectangles for basic shape.", timeout: 1000};
							break;
			case 5: mainDrawMode = 2;
							$("#square_settings_holder").css("display", "none");
							$("#rect_settings_holder").css("display", "none");
							$("#line_settings_holder").css("display", "block");
							data = {message: "Using lines for basic shape.", timeout: 1000};
							break;

			case 6: mainDrawMode = 2;
							lineDir = 0;
							data = {message: "Lines will face all directions.", timeout: 1000};
							break;
			case 7: mainDrawMode = 2;
							lineDir = 1;
							data = {message: "Lines will be placed vertically.", timeout: 1000};
							break;
			case 8: mainDrawMode = 2;
							lineDir = 2;
							data = {message: "Lines will be placed horizontally.", timeout: 1000};
							break;
		}
		snackbarContainer.MaterialSnackbar.showSnackbar(data);
	});

	$("#slot_count").keypress(function(e) {
		if(e.which == 13) setSlots();
	});

	setIntervalSlider(0);
	setIntervalSlider(1);
	setIntervalSlider(2);

	$("#shape_square_min").val(squareSize[0]);
	$("#shape_square_max").val(squareSize[1]);
	$("#shape_rect_minh").val(rectSize[0]);
	$("#shape_rect_maxh").val(rectSize[1]);
	$("#shape_rect_minw").val(rectSize[2]);
	$("#shape_rect_maxw").val(rectSize[3]);
	$("#shape_line_min").val(lineSize[0]);
	$("#shape_line_max").val(lineSize[1]);
});

function reimage() {
	if (!imageUp) return;

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

	/* --- set canvas background color --- */
	if (paletteGenerated && mainColorMode > 0) {
		var darkest = 0;
		var darkestVal = mainMeans[0] + mainMeans[1] + mainMeans[2];
		for (var i = 3; i < mainMeans.length; i += 3) {
			var colSum = mainMeans[i] + mainMeans[i + 1] + mainMeans[i + 2];
			if (colSum < darkestVal) {
				darkest = i;
				darkestVal = colSum;
			}
		}

		var rgbDark = [mainMeans[darkest], mainMeans[darkest + 1], mainMeans[darkest + 2], 255];

		if (mainColorMode > 1) {
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

	/* --- load appropriate dimensions --- */
	console.log(mainDrawMode);
	switch (mainDrawMode) {
		case 0:	mainSizes[0] = squareSize[0];
						mainSizes[1] = squareSize[1];
						console.log("ASDF");
						break;
		case 1:	mainSizes[0] = rectSize[0];
						mainSizes[1] = rectSize[1];
						mainSizes[2] = rectSize[2];
						mainSizes[3] = rectSize[3];
						break;
		case 2:	if (lineDir == 0) {
							mainSizes[0] = lineSize[0];
							mainSizes[1] = lineSize[1];
						} else if (lineDir == 1) {
							mainSizes[0] = lineSize[0];
							mainSizes[1] = lineSize[1];
							mainSizes[2] = 1;
							mainSizes[3] = 1;
							mainDrawMode = 1;
						} else  {
							mainSizes[0] = 1;
							mainSizes[1] = 1;
							mainSizes[2] = lineSize[0];
							mainSizes[3] = lineSize[1];
							mainDrawMode = 1;
						}
						break;
	}

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

	console.log(mainSizes);
	draw = true;
	drawWorker.postMessage({"first":true, "drawMode":mainDrawMode, "imgArr":imgArr, "imgArrOrig":imgArrOrig,
													"width":imageData.width, "height":imageData.height, "colorMode":mainColorMode, "means":mainMeans,
													"sizes":mainSizes, "colorMargins":mainColorMargins});
}


/* SHAPE SETTERS --------- */
function setSquare(val) {
	var value;
	if (val == 1) value = $("#shape_square_min").val();
	else value = $("#shape_square_max").val();

	value = parseInt(value);
	if (!isNaN(value)) {
		if (value < 0) {
			value = 1;
		} else if (value > 100) {
			value = 100;
		}

		if (val == 1) {
			$("#shape_square_min").val(value);
			squareSize[0] = value;
		} else {
			$("#shape_square_max").val(value);
			squareSize[1] = value;
		}
	}
}


function setRect(valPar) {
	var value;
	var val = parseInt(valPar)
	switch (val) {
		case 1:	value = $("#shape_rect_minh").val(); break;
		case 2:	value = $("#shape_rect_maxh").val(); break;
		case 3:	value = $("#shape_rect_minw").val(); break;
		case 4:	value = $("#shape_rect_maxw").val(); break;
	}

	value = parseInt(value);
	if (!isNaN(value)) {
		if (value < 0) {
			value = 1;
		} else if (value > 100) {
			value = 100;
		}

		switch (val) {
			case 1:	$("#shape_rect_minh").val(value);
							rectSize[0] = value;
							break;
			case 2:	$("#shape_rect_maxh").val(value);
							rectSize[1] = value;
							break;
			case 3:	$("#shape_rect_minw").val(value);
							rectSize[2] = value;
							break;
			case 4:	$("#shape_rect_maxw").val(value);
							rectSize[3] = value;
							break;
		}
	}
}


function setLine(val) {
	var value;
	if (val == 1) value = $("#shape_line_min").val();
	else value = $("#shape_line_max").val();

	value = parseInt(value);
	if (!isNaN(value)) {
		if (value < 0) {
			value = 1;
		} else if (value > 100) {
			value = 100;
		}

		if (val == 1) {
			$("#shape_line_min").val(value);
			lineSize[0] = value;
		} else {
			$("#shape_line_max").val(value);
			lineSize[1] = value;
		}
	}
}


/* PALETTE SETTING ------- */
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
	if (!imageUp) return;

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

			paletteGenerated = true;
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

				imageUp = true;
			}

			img.src = evt.target.result;
		}
	}

	reader.readAsDataURL(file);
}

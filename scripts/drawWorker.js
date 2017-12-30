var drawMode, sizeMinH, sizeMaxH, sizeMinW, sizeMaxW, sizeDiffH, sizeDiffW;
/* draw modes
 *	0 ... squares
 *	1 ... rectangles
 *	2 ... rotated lines
 */
var imgArr, imgArrOrig, imgWidth, imgHeight;
var iters, globalCounter;
var colorMode, means, colorMargins;
/* color modes:
 *	0 ... random
 *	1 ... means-based exact
 *	2 ... means-based with margins
 */

var burstLength = 3000;

onmessage = function(msg) {
	if (msg.data.first) {
		drawMode = msg.data.drawMode;

		sizeMinH = msg.data.sizes[0];
		sizeMaxH = msg.data.sizes[1];
    sizeMinW = msg.data.sizes[2];
		sizeMaxW = msg.data.sizes[3];
		sizeDiffH = sizeMaxH - sizeMinH;
    sizeDiffW = sizeMaxW - sizeMinW;

		imgArr = msg.data.imgArr;
		imgArrOrig = msg.data.imgArrOrig;
		imgWidth = msg.data.width;
		imgHeight = msg.data.height;

		// color mode settings
		means = msg.data.means;
		colorMargins = msg.data.colorMargins;
		if (means == null) {
			colorMode = 0;
		} else {
			colorMode = msg.data.colorMode;
		}

    globalCounter = 0;

	}

  var endTime = (new Date()).getTime() + burstLength;

	var rgb, index, h, w, length, pos;
	while ((new Date()).getTime() < endTime) {
		switch (colorMode) {
			case 1:	index = Math.floor(Math.random() * means.length);
							rgb = [means[3 * index], means[3 * index + 1], means[3 * index + 2]];
							break;

			case 2:	index = Math.floor(Math.random() * means.length);
							rgb = [means[3 * index] + Math.random() * colorMargins[0] - colorMargins[0] / 2,
										 means[3 * index + 1] + Math.random() * colorMargins[1] - colorMargins[1] / 2,
										 means[3 * index + 2] + Math.random() * colorMargins[2] - colorMargins[2] / 2];
							break;

			default:	rgb = [Math.random() * 255, Math.random() * 255, Math.random() * 255];		// case 0:
								break;
		}


		if (drawMode < 2) {
			h = Math.random() * sizeDiffH + sizeMinH;
			if (drawMode == 0) {	// square
				w = h;
			} else {							// rectangle
		    w = Math.random() * sizeDiffW + sizeMinW;
			}
	    length = h * w * 4;

	    pos = Math.random() * (imgArr.length - length);
	    pos -= pos % 4;

	    //console.log("h: "+h+", w: "+w+", pos: "+pos+", imgWidth: "+imgWidth);

	    // get comparison between reference and current (previous) colors, as well as reference and new colors
	    var diffPrev = 0;
	    var diffNew = 0;
	    var tmp1, tmp2;
	    for (var i = pos; i < pos + h * imgWidth * 4; i += imgWidth * 4) {
	      for (var j = 0; j < w * 4; j += 4) {
	        for (var k = 0; k < 3; k++) {
	          tmp1 = imgArrOrig[i + j + k] - imgArr[i + j + k];   // get diff between orig and current
	          if (tmp1 < 0) tmp1 *= (-1);                  		    // make it non-negative
	          diffPrev += tmp1;                            	    	// add it to diff prev sum
	          tmp2 = imgArrOrig[i + j + k] - rgb[k];              // get diff between orig and new proposed
	          if (tmp2 < 0) tmp2 *= (-1);                   	    // make it non-negative
	          diffNew += tmp2;                             		    // add it to diff new sum
	        }
	      }
	    }

	    // apply new colors if they fit better
	    if (diffNew < diffPrev) {
	      for (var i = pos; i < pos + h * imgWidth * 4; i += imgWidth * 4) {
	        for (var j = 0; j < w * 4; j += 4) {
	          for (var k = 0; k < 3; k++) {
	            imgArr[i + j + k] = rgb[k];
	          }
	        }
	      }
	    }


		} else if (drawMode == 2) {

			var lineLen = Math.round(Math.random() * sizeDiffH + sizeMinH);				// length of line
			var lineX = Math.floor(Math.random() * lineLen);											// width of box surrounding the line
			var lineY = Math.ceil(Math.sqrt(lineLen * lineLen - lineX * lineX));	// height of box surrounding the line
			var direction;						// direction, positive or negative, in which the smaller coordinate grows.
			var posY;									// posY = Y coordinate of left end of line
			var distShorter;					// distShorter = coordinate on shorter axis of line's box, relative to the one on longer
			var posTemp;
			var posX = Math.floor(Math.random() * (imgWidth - lineX));
			if (Math.random() * 2 >= 1) {
				direction = 1;
				posY = Math.floor(Math.random() * (imgHeight - lineY));
			} else {
				direction = -1;
				posY = Math.floor(Math.random() * (imgHeight - lineY) + lineY);
			}

			// get comparison between reference and current (previous) colors, as well as reference and new colors
	    var diffPrev = 0;
	    var diffNew = 0;
	    var tmp1, tmp2;
			pos = (posY * imgWidth + posX) * 4;
			if (lineX > lineY) {
				for (var i = 0; i < lineX; i++) {
					distShorter = Math.round((i / lineX) * lineY * direction);
					posTemp = pos + (imgWidth * distShorter + i) * 4;

					for (var j = 0; j < 3; j++) {
						tmp1 = imgArrOrig[posTemp + j] - imgArr[posTemp + j];		// get diff between orig and current
						if (tmp1 < 0) tmp1 *= (-1);                  		    		// make it non-negative
						diffPrev += tmp1;                            	    			// add it to diff prev sum
						tmp2 = imgArrOrig[posTemp + j] - rgb[j];              	// get diff between orig and new proposed
						if (tmp2 < 0) tmp2 *= (-1);                   	    		// make it non-negative
						diffNew += tmp2;                             		    		// add it to diff new sum
					}
				}

				if (diffNew < diffPrev) {
					for (var i = 0; i < lineX; i++) {
						distShorter = Math.round((i / lineX) * lineY * direction);
						posTemp = pos + (imgWidth * distShorter + i) * 4;

						for (var j = 0; j < 3; j++) {
							imgArr[posTemp + j] = rgb[j];
						}
					}
				}
			} else {
				for (var i = 0; i < lineY; i++) {
					distShorter = Math.round((i / lineY) * lineX);
					posTemp = pos + (i * imgWidth * direction + distShorter) * 4;

					for (var j = 0; j < 3; j++) {
						tmp1 = imgArrOrig[posTemp + j] - imgArr[posTemp + j];		// get diff between orig and current
						if (tmp1 < 0) tmp1 *= (-1);                  		    		// make it non-negative
						diffPrev += tmp1;                            	    			// add it to diff prev sum
						tmp2 = imgArrOrig[posTemp + j] - rgb[j];              	// get diff between orig and new proposed
						if (tmp2 < 0) tmp2 *= (-1);                   	    		// make it non-negative
						diffNew += tmp2;                             		    		// add it to diff new sum
					}
				}

				if (diffNew < diffPrev) {
					for (var i = 0; i < lineY; i++) {
						distShorter = Math.round((i / lineY) * lineX);
						posTemp = pos + (i * imgWidth * direction + distShorter) * 4;

						for (var j = 0; j < 3; j++) {
							imgArr[posTemp + j] = rgb[j];
						}
					}
				}
			}


	    for (var i = pos; i < pos + h * imgWidth * 4; i += imgWidth * 4) {
	      for (var j = 0; j < w * 4; j += 4) {
	        for (var k = 0; k < 3; k++) {
	          tmp1 = imgArrOrig[i + j + k] - imgArr[i + j + k];   // get diff between orig and current
	          if (tmp1 < 0) tmp1 *= (-1);                  		    // make it non-negative
	          diffPrev += tmp1;                            	    	// add it to diff prev sum
	          tmp2 = imgArrOrig[i + j + k] - rgb[k];              // get diff between orig and new proposed
	          if (tmp2 < 0) tmp2 *= (-1);                   	    // make it non-negative
	          diffNew += tmp2;                             		    // add it to diff new sum
	        }
	      }
	    }

	    // apply new colors if they fit better
	    if (diffNew < diffPrev) {
	      for (var i = pos; i < pos + h * imgWidth * 4; i += imgWidth * 4) {
	        for (var j = 0; j < w * 4; j += 4) {
	          for (var k = 0; k < 3; k++) {
	            imgArr[i + j + k] = rgb[k];
	          }
	        }
	      }
	    }
		}

    globalCounter++;
  }

  console.log(globalCounter);
  postMessage({"imgArr":imgArr, "counter":globalCounter});
}

function checkChanges(array) {
	var cnt = 0;
  for (var i = 0; i < array.length; i += 4) {
		if (array[i] != 0) cnt++;
	}
  console.log("Changes: " + cnt);
}

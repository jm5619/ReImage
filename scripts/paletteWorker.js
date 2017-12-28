
onmessage = function(msg) {
	var clusterCount = msg.data.clusterCount;
	var imgOrig = msg.data.imgOrig;
	var imgArr = imgOrig.data;


	// set structures and initial random points
	var clusters = new Array(clusterCount);
	var means = new Uint8Array(clusterCount * 3);
	for (var i = 0; i < clusterCount; i++) {
		clusters[i] = new Set();

		var temp = Math.floor(Math.random() * imgOrig.width * imgOrig.height);
		means[i * 3] = imgArr[temp * 4];
		means[i * 3 + 1] = imgArr[temp * 4 + 1];
		means[i * 3 + 2] = imgArr[temp * 4 + 2];
	}

	// console.log(means);

	// make initial run, assign points to clusters
	var cluster, minDist, dist, avg, smallest;
	for (var i = 0; i < imgArr.length; i += 4) {
		cluster = 0;
		minDist = (imgArr[i] - means[0]) * (imgArr[i] - means[0]) +
							(imgArr[i + 1] - means[1]) * (imgArr[i + 1] - means[1]) +
							(imgArr[i + 2] - means[2]) * (imgArr[i + 2] - means[2]);		// faster than squaring via function

		for (var j = 3; j < means.length; j += 3) {
			dist =	(imgArr[i] - means[j]) * (imgArr[i] - means[j]) +
							(imgArr[i + 1] - means[j + 1]) * (imgArr[i + 1] - means[j + 1]) +
							(imgArr[i + 2] - means[j + 2]) * (imgArr[i + 2] - means[j + 2]);
			// console.log("Min: "+minDist+", dist: "+dist);
			if (dist < minDist) {
				minDist = dist;
				cluster = Math.floor(j / 3);
				// console.log("SWAP, cluster = "+cluster);
			}
		}
		// console.log("cluster = "+cluster);
		imgArr[i + 3] = cluster;
		clusters[cluster].add(i);
	}

	// loop clustering until no further changes can be made
	var initialChanges, percentDone, percentDonePrev;
	var cnt = 0;
	var changeCnt = -1;
	var stable = false;
	while (!stable & cnt < 100) {		// counter needs to be thought over later on
		stable = true;

		if (cnt == 1) {
			initialChanges = changeCnt;
			percentDonePrev = 0;
		} else if (cnt > 1) {
			percentDone = Math.floor((initialChanges - changeCnt) / initialChanges * 100);
			if (percentDone > percentDonePrev) {
				percentDonePrev = percentDone;
				postMessage({"done":false, "percentDone":percentDone, "means":null});
				// console.log(initialChanges - changeCnt);
			}
		}

		console.log("RUN NUMBER: "+cnt+", changes:"+changeCnt+" ---------------------------------------------------");
		changeCnt = 0;
		cnt++;

		for (var i = 0; i < clusters.length; i++) {
			// calculate new average point of every cluster
			avg = [0, 0, 0];
			clusters[i].forEach(function(el) {
				avg[0] += imgArr[el];
				avg[1] += imgArr[el + 1];
				avg[2] += imgArr[el + 2];
				//console.log(el+": ["+imgArr[el]+","+imgArr[el+1]+","+imgArr[el+2]+"]");
			});
			avg[0] /= clusters[i].size;
			avg[1] /= clusters[i].size;
			avg[2] /= clusters[i].size;

			// console.log(i+", "+avg+", "+clusters[i].size);

			// find the member of each cluster that's closest to the new average point
			var iter = clusters[i].values();
			var element = iter.next();							// get initial element
			var el = element.value;

			minDist = (imgArr[el] - avg[0]) * (imgArr[el] - avg[0]) +
								(imgArr[el + 1] - avg[1]) * (imgArr[el + 1] - avg[1]) +
								(imgArr[el + 2] - avg[2]) * (imgArr[el + 2] - avg[2]);
			smallest = el;

			element = iter.next();
			while (!element.done) {							// all others
				el = element.value;
				dist =	(imgArr[el] - avg[0]) * (imgArr[el] - avg[0]) +
								(imgArr[el + 1] - avg[1]) * (imgArr[el + 1] - avg[1]) +
								(imgArr[el + 2] - avg[2]) * (imgArr[el + 2] - avg[2]);

				if (dist < minDist) {
					minDist = dist;
					smallest = el;
				}
				element = iter.next();
			}

			// console.log("min: "+minDist+", dist: "+dist+", avg: "+avg);

			means[i * 3]		 = imgArr[smallest];
			means[i * 3 + 1] = imgArr[smallest + 1];
			means[i * 3 + 2] = imgArr[smallest + 2];

			// console.log("means: ["+means[i*3]+", "+means[i*3+1]+", "+means[i*3+2]+"]");
		}

		// cluster points according to new means
		for (var i = 0; i < imgArr.length; i += 4) {
			cluster = 0;
			minDist = (imgArr[i] - means[0]) * (imgArr[i] - means[0]) +
								(imgArr[i + 1] - means[1]) * (imgArr[i + 1] - means[1]) +
								(imgArr[i + 2] - means[2]) * (imgArr[i + 2] - means[2]);		// faster than squaring via function

			for (var j = 3; j < means.length; j += 3) {
				dist =	(imgArr[i] - means[j]) * (imgArr[i] - means[j]) +
								(imgArr[i + 1] - means[j + 1]) * (imgArr[i + 1] - means[j + 1]) +
								(imgArr[i + 2] - means[j + 2]) * (imgArr[i + 2] - means[j + 2]);
				if (dist < minDist) {
					minDist = dist;
					cluster = Math.floor(j / 3);
				}
			}

			if (cluster != imgArr[i + 3]) {
				clusters[imgArr[i + 3]].delete(i);
				clusters[cluster].add(i);
				imgArr[i + 3] = cluster;
				stable = false;
				changeCnt++;
			}
		}
	}

	postMessage({"done":true, "percentDone":100, "means":means});
}

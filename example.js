let video = document.getElementById('videoInput');
let cap = new cv.VideoCapture(video);

// take first frame of the video
let frame = new cv.Mat(video.height, video.width, cv.CV_8UC4);
cap.read(frame);

// hardcode the initial location of window
let trackWindow = new cv.Rect(150, 60, 63, 125);

// set up the ROI for tracking
let roi = frame.roi(trackWindow);
let hsvRoi = new cv.Mat();
cv.cvtColor(roi, hsvRoi, cv.COLOR_RGBA2RGB);
cv.cvtColor(hsvRoi, hsvRoi, cv.COLOR_RGB2HSV);
let mask = new cv.Mat();
let lowScalar = new cv.Scalar(30, 30, 0);
let highScalar = new cv.Scalar(180, 180, 180);
let low = new cv.Mat(hsvRoi.rows, hsvRoi.cols, hsvRoi.type(), lowScalar);
let high = new cv.Mat(hsvRoi.rows, hsvRoi.cols, hsvRoi.type(), highScalar);
cv.inRange(hsvRoi, low, high, mask);
let roiHist = new cv.Mat();
let hsvRoiVec = new cv.MatVector();
hsvRoiVec.push_back(hsvRoi);
cv.calcHist(hsvRoiVec, [0], mask, roiHist, [180], [0, 180]);
cv.normalize(roiHist, roiHist, 0, 255, cv.NORM_MINMAX);

// delete useless mats.
roi.delete(); hsvRoi.delete(); mask.delete(); low.delete(); high.delete(); hsvRoiVec.delete();

// Setup the termination criteria, either 10 iteration or move by at least 1 pt
let termCrit = new cv.TermCriteria(cv.TERM_CRITERIA_EPS | cv.TERM_CRITERIA_COUNT, 10, 1);

let hsv = new cv.Mat(video.height, video.width, cv.CV_8UC3);
let dst = new cv.Mat();
let hsvVec = new cv.MatVector();
hsvVec.push_back(hsv);

const FPS = 30;
function processVideo() {
    try {
        if (!streaming) {
            // clean and stop.
            frame.delete(); dst.delete(); hsvVec.delete(); roiHist.delete(); hsv.delete();
            return;
        }
        let begin = Date.now();

        // start processing.
        cap.read(frame);
        cv.cvtColor(frame, hsv, cv.COLOR_RGBA2RGB);
        cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);
        cv.calcBackProject(hsvVec, [0], roiHist, dst, [0, 180], 1);

        // Apply meanshift to get the new location
        // and it also returns number of iterations meanShift took to converge,
        // which is useless in this demo.
        [, trackWindow] = cv.meanShift(dst, trackWindow, termCrit);

        // Draw it on image
        let [x, y, w, h] = [trackWindow.x, trackWindow.y, trackWindow.width, trackWindow.height];
        cv.rectangle(frame, new cv.Point(x, y), new cv.Point(x+w, y+h), [255, 0, 0, 255], 2);
        cv.imshow('canvasOutput', frame);

        // schedule the next one.
        let delay = 1000/FPS - (Date.now() - begin);
        setTimeout(processVideo, delay);
    } catch (err) {
        utils.printError(err);
    }
};

// schedule the first one.
setTimeout(processVideo, 0);

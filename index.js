let video = document.getElementById("videoInput");
let output = document.getElementById('videoOutput');
let cap = new cv.VideoCapture(video);
let firstFrame = new cv.Mat(video.height, video.width, cv.CV_8UC4);
let secondFrame = new cv.Mat(video.height, video.width, cv.CV_8UC1);
let circles = new cv.Mat();

let doSomething = (s) => {

    let height = 200;
    let width = 200;
    let streaming = s;
    
    let src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
    let dst = new cv.Mat(output.height, output.width, cv.CV_8UC4);

    // ball tracking vars
    const method = cv.HOUGH_GRADIENT;
    const dp = 2;
    const minDist = 50;

    function onFrame() {
        cv.cvtColor(firstFrame, secondFrame, cv.COLOR_BGR2GRAY)
        cv.HoughCircles(secondFrame, circles, method, dp, minDist)
        
        // circles.data.forEach(c => {
        //     console.log('Circles found: ', c)
        // })

        drawBall(secondFrame, circles.data);
        cv.imshow('videoOutput', secondFrame);
    }

    function drawBall (dstImg, circles) {
        circles.forEach(({x, y, z}) => {
        //   const blue = new cv.MatVector(255, 0, 0);
        //   const orange = new cv.MatVector(0, 128, 255);
        //   dstImg.drawCircle(new cv.PointVector(x, y), z, { color: blue, thickness: 2 })
        //   dstImg.drawRectangle(
        //     new cv.Point(x - 5, y - 5),
        //     new cv.Point(x + 5, y + 5),
        //     { color: orange, thickness: 1 }
        //   );
        console.log('x y z : ', x, y, z)
        })
      }

    const FPS = 30;
    function processVideo() {
        try {
            if (!streaming) {

                // clean and stop.
                src.delete();
                dst.delete();
                return;
            }

            let begin = Date.now();

            // start processing.
            cap.read(firstFrame);
            
            // every frame
            onFrame()

            // schedule the next one.
            let delay = 1000 / FPS - (Date.now() - begin);
            setTimeout(processVideo, delay);

        } catch (err) {
            console.log(err);
        }
    };

    // schedule the first one.
    setTimeout(processVideo, 0);
}

setTimeout(() => {
    doSomething(true);
}, 1000);


navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(function (stream) {
        video.srcObject = stream;
        video.play();

        // do something
        doSomething();
    })
    .catch(function (err) {
        console.log("An error occurred! " + err);
    });



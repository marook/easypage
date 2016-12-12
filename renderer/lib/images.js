const imageSize = require('./q-image-size');
const imagemagick = require('./q-imagemagick');
const fs = require('q-io/fs');
const q = require('q');

const MAX_IMAGE_WIDTH = 1200;
const MAX_IMAGE_HEIGHT = 600;

function webifyImage(outputImagePath, inputImagePath){
    let dimensions;
    return q.when()
        .then(function(){
            return imageSize(inputImagePath);
        })
        .then(function(inputImageDimensions){
            const mustScale = inputImageDimensions.width > MAX_IMAGE_WIDTH || inputImageDimensions.height > MAX_IMAGE_HEIGHT;
            if(mustScale){
                const scale = Math.min(MAX_IMAGE_WIDTH / inputImageDimensions.width, MAX_IMAGE_HEIGHT / inputImageDimensions.height);
                dimensions = {
                    width: Math.round(inputImageDimensions.width * scale),
                    height: Math.round(inputImageDimensions.height * scale),
                };
                return imagemagick.convert(inputImagePath, '-resize', `${dimensions.width}x${dimensions.height}`, outputImagePath);
            } else {
                dimensions = inputImageDimensions;
                return fs.copy(inputImagePath, outputImagePath);
            }
        })
        .then(function(){
            return dimensions;
        });
}

module.exports = {
    webifyImage,
};

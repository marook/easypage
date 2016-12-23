const imageSize = require('./q-image-size');
const imagemagick = require('./q-imagemagick');
const fs = require('q-io/fs');
const q = require('q');

function resizeImage(outputImagePath, inputImagePath, maxWidth, maxHeight){
    let dimensions;
    return q.when()
        .then(function(){
            return imageSize(inputImagePath);
        })
        .then(function(inputImageDimensions){
            const mustScale = inputImageDimensions.width > maxWidth || inputImageDimensions.height > maxHeight;
            if(mustScale){
                const scale = Math.min(maxWidth / inputImageDimensions.width, maxHeight / inputImageDimensions.height);
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
    resizeImage,
};

const cheerio   = require('cheerio'),
    path        = require('path'),
    fs          = require('fs'),
    url         = require('url'),
    request     = require('request'),
    im          = require('imagemagick')
;

const contentTypes = {
  ".png": "image/png",
  ".gif": "image/gif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".bmp": "image/bmp",
  ".webp": "image/webp"
}

module.exports = function(htmlFile, relFilePath, options) {
  var image = null;
  const base = process.cwd(),
        relPath = relFilePath,
        fullPath = path.join(base, relPath),
        relDestPath = options.destPath || relPath,
        fullDestPath = path.join(base, relDestPath),
        fileHtml = htmlFile,
        dom = cheerio.load(String(fileHtml)),
        force = options.force || false
  ;

  // call resize function
  htmlImageResize(dom);
  return dom.html({decodeEntities: false})

  /**
   * parse DOM and call action on the elements
   * @param  {Object} dom   cheerio DOM object
   * @return {Object}       cheerio DOM object
   */
  function htmlImageResize(dom) {
    dom('img').each(function(index, el) {
      el = dom(el);
      const src = el.attr('src') || null,
            width = el.attr('img-width') || null,
            height = el.attr('img-height') || null
      ;

      // if no src or no attribute to resize or crop
      if (!src || (!width && !height)) {
        return true;
      }

      // image stored locally
      if (isLocal(src)) {
        const dir = fullPath + "/" + path.dirname(src),
              file = path.join(fullPath, src),
              contentType = contentTypes[path.extname(file)] || 'image/png'
        ;

        image = {
          file: file,
          fileName: src,
          contentType: contentType,
          remoteFile: false,
          resize: {
            width: width,
            height: height,
            crop: (width && height) ? true : false
          }
        };

        image = createName(image);
        image = (image.resize.crop) ? crop(image) : resize(image);

        // change html img element attributes
        if (image != null) {
          el.attr('src', image.newname);
        }
        el.attr('img-width', null);
        el.attr('img-height', null);

      } else { // external image
        // const extfile = src;
        // request.get(extfile, function (error, response, body) {
        //   if (!error && response.statusCode == 200) {
        //     const contentType = contentTypes[path.extname(file)] || 'image/png',
        //           file = src
        //     ;
        //     image = {
        //       dir: fullPath,
        //       file: file,
        //       fileName: path.basename(file),
        //       contentType: contentType,
        //       resize: {
        //         width: width,
        //         height: height,
        //         crop: el.attr('img-crop') === 'true'
        //       }
        //     };
        //
        //     var croppedImg = (image.resize.crop && (image.resize.width && image.resize.height)) ? crop(image) : resize(image);
        //     el.attr('src', croppedImg);
        //     el.attr('img-width', null);
        //     el.attr('img-height', null);
        //     el.attr('img-crop', null);
        //   }
        //   return null;
        // });
      }

    });

  }

  /**
   * determine if image is local or external
   * @param  {String}  href   src attriute of the image
   * @return {Boolean}        if it is local
   */
  function isLocal(href) {
    return href && !url.parse(href).hostname;
  }

  /**
   * resize of the image
   * @param  {Object} image   json object
   * @return {String}         name of the image
   */
  function resize(image) {
    // options for the resize
    const options = {
      srcPath: image.file,
      dstPath: image.dest,
      quality: 1
    };
    if (image.resize.width) {
      options.width = image.resize.width;
    }
    if (image.resize.height) {
      options.height = image.resize.height;
    }

    // verify if the file already exists
    fs.stat(image.dest, function(err, stat) {
      // if file doesnt exist or force flag is set to true
      if (err != null || force) {
        // resize image
        im.resize(options, function(err) {
          if (err != null) {
            // if error, try to create folder and call resize as a callback
            createFolder(image, function() {
              resize(image);
            });
          }
        });
      }
    });
    return image;
  }

  /**
   * crop image for the dimensions
   * @param  {Object} image   json object
   * @return {String}         new image name
   */
  function crop(image) {
    // verify if the file already exists
    fs.stat(image.dest, function(err, stat) {
      // if file doesnt exist or force flag is set to true
      if (err != null || force) {
        // crop image
        im.crop({
          srcPath: image.file,
          dstPath: image.dest,
          width:   image.resize.width,
          height:  image.resize.height,
          quality: 1
        }, function(err) {
          if (err != null) {
            // if error, try to create folder and call crop as a callback
            createFolder(image, function() {
              crop(image);
            });
          }
        });
      }
    });

    return image;
  }

  /**
   * try to create folder
   * first verify if it image what is missing, otherwise try to create folder and call callback
   * @param {image}     image     json object
   * @param {function}  cb        callback
   * @return {Object}             image object
   */
  function createFolder(image, cb) {
    fs.stat(image.file, function(err, stat) {
      if (err) {
        return image;
      }
      else {
        fs.mkdir(path.dirname(image.dest), function() {
          cb(image);
          return image;
        });
      }
    });
    return image;
  }

  /**
   * get image name after resize
   * @param  {Object} image   json object
   * @return {String}         new image name
   */
  function createName(image, cb) {
    const extension = path.extname(image.file);
    var newFileName = "";

    // add width to the name
    if (image.resize.width) {
      newFileName += "_w" + image.resize.width;
    }

    // add height to the name
    if (image.resize.height) {
      newFileName += "_h" + image.resize.height;
    }

    newFileName += extension;
    var newname = image.fileName.replace(extension, newFileName);
    image.newname = newname;
    image.dest = path.join(relDestPath, image.newname);
    return image;
  }
}

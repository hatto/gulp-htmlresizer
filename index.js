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

module.exports = function(htmlFile) {
  var image = null;
  const base = process.cwd(),
        htmlpath = path.join(base, path.dirname(htmlFile)),
        html = fs.readFileSync(process.argv[2]),
        dom = cheerio.load(String(html))
  ;

  var newhtml = htmlImageResize(dom);
  console.log(newhtml);
  return new Buffer(dom.html({decodeEntities: false}));

  function htmlImageResize(dom) {
    dom('img').each(function(idx, el) {
      el = dom(el);
      const src = el.attr('src') || null,
            width = el.attr('img-width') || null,
            height = el.attr('img-height') || null
      ;

      // if no src or no attribute to resize or crop
      if (!src || (!width && !height)) {
        return true;
      }

      // image store in local
      if (isLocal(src)) {
        const dir = htmlpath + "/" + path.dirname(src),
              file = path.join(htmlpath, src),
              contentType = contentTypes[path.extname(file)] || 'image/png'
        ;
        image = {
          dir: dir,
          file: file,
          fileName: path.basename(file),
          contentType: contentType,
          resize: {
            width: width,
            height: height,
            crop: el.attr('img-crop') === 'true'
          }
        };
        const croppedImg = (image.resize.crop) ? crop(image) : resize(image);
        el.attr('src', croppedImg);
        el.attr('img-width', null);
        el.attr('img-height', null);
        el.attr('img-crop', null);
      } else { // external image
        const extfile = src;
        request.get(extfile, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            const contentType = contentTypes[path.extname(file)] || 'image/png',
                  file = src
            ;
            image = {
              dir: htmlpath,
              file: file,
              fileName: path.basename(file),
              contentType: contentType,
              resize: {
                width: width,
                height: height,
                crop: el.attr('img-crop') === 'true'
              }
            };
            var croppedImg = (image.resize.crop && (image.resize.width && image.resize.height)) ? crop(image) : resize(image);
            el.attr('src', croppedImg);
            el.attr('img-width', null);
            el.attr('img-height', null);
            el.attr('img-crop', null);
          }
          return null;
        });
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
    const newname = createName(image);
    // if image already exists
    fs.stat(newname, function(err, stat) {
      if(err == null) {
        return false;
      }
    });
    // options for the resize
    const options = {
      srcPath: image.file,
      dstPath: newname,
      quality: 1
    };
    if (image.resize.width) {
      options.width = image.resize.width;
    }
    if (image.resize.height) {
      options.height = image.resize.height;
    }
    // resize image
    im.resize(options, function(err) {
      console.log(err);
    });
    return newname;
  }

  /**
   * crop image for the dimensions
   * @param  {Object} image   json object
   * @return {String}         new image name
   */
  function crop(image) {
    const newname = createName(image);
    fs.stat(newname, function(err, stat) {
      if(err == null) {
       console.log('exists');
       return false;
     }
    });
    im.crop({
      srcPath: image.file,
      dstPath: newname,
      width:   image.resize.width,
      height:   image.resize.height,
      quality: 1
    }, function(err) {
      console.log(err);
    });
    return newname;
  }

  /**
   * get image name after resize
   * @param  {Object} image   json object
   * @return {String}         new image name
   */
  function createName(image) {
    const extension = path.extname(image.file);
    var newFileName = "";
    if (image.resize.width) {
      newFileName += "_w" + image.resize.width;
    }
    if (image.resize.height) {
      newFileName += "_h" + image.resize.height;
    }
    newFileName += extension;
    const newname = path.join(image.dir, image.fileName.replace(extension, newFileName));
    return newname;
  }
}

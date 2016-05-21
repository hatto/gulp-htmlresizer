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

module.exports = function(file, base) {
  base = base || process.cwd();
  var htmlpath = path.join(base, path.dirname(file));
  var html = fs.readFileSync(process.argv[2])

  var dom = cheerio.load(String(html));
  htmlImageResize(dom);

  return new Buffer(dom.html({decodeEntities: false}));

  function htmlImageResize(dom) {
    var styles = [];
    dom('img').each(function(idx, el) {
      el = dom(el);
      var src = el.attr('src');
      if (src && isLocal(src)) {
        var dir = htmlpath + "/" + path.dirname(src);
        var file = path.join(htmlpath, src);
        var img = fs.readFileSync(file);
        var contentType = contentTypes[path.extname(file)] || 'image/png';
        image = {
            dir: dir,
            file: file,
            fileName: path.basename(file),
            contentType: contentType,
            resize: {
                width: el.attr('img-width'),
                height: el.attr('img-height'),
                crop: el.attr('img-crop') === 'true'
            }
        };
        var croppedImg = (image.resize.crop) ? crop(image) : resize(image);
        return croppedImg;
      } else if (src && !isLocal(src)) {
        var file = src;
        request.get(file, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            var img = body;
            var contentType = contentTypes[path.extname(file)] || 'image/png';
            image = {
              dir: htmlpath,
              file: file,
              fileName: path.basename(file),
              contentType: contentType,
              resize: {
                width: el.attr('img-width'),
                height: el.attr('img-height'),
                crop: el.attr('img-crop') === 'true'
              }
            };
            var croppedImg = (image.resize.crop && (image.resize.width && image.resize.height)) ? crop(image) : resize(image);
            return croppedImg;
          }
        });
      }

    });
  }

  function isLocal(href) {
    return href && !url.parse(href).hostname;
  }

  function resize(image) {
    const newname = createName(image);
    fs.stat(newname, function(err, stat) {
      if(err == null) {
       console.log('exists');
       return false;
     }
    });
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
    im.resize(options, function(err) {
      console.log(err);
    });
    return newname;
  }

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
    console.log(newname);
    return newname;
  }
}

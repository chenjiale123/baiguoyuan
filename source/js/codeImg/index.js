var barcode = require('./barcode');
var qrcode = require('./qrcode');

function convert_length(length) {
  var width = 0;
  if (wx.getSystemInfoSync().windowWidth < 375){ //兼容375屏幕以下的
    width = 375;
  }else{
    width = wx.getSystemInfoSync().windowWidth
  }
	return Math.round(width * length / 750);
}

function barc(id, code, width, height) {
  barcode.code128(wx.createCanvasContext(id), code, convert_length(width), convert_length(height))
}

function qrc(id, code, width, height) {
	qrcode.api.draw(code, {
		ctx: wx.createCanvasContext(id),
		width: convert_length(width),
		height: convert_length(height)
	})
}

module.exports = {
	barcode: barc,
	qrcode: qrc
}
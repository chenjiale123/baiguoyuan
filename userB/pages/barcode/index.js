var bg_pop = require('../../../source/image-base64/coupon_bg_pop');
var bg_orange_small = require('../../../source/image-base64/coupon_bg_orange_small');
var bg_blue_small = require('../../../source/image-base64/coupon_bg_blue_small');
var wxbarcode = require('../../../source/js/codeImg/index.js');
var common = require('../../../source/js/common');
var commonObj = common.commonObj;
Page({
  data: {
    bg_pop: bg_pop.bg,
    bg_orange_small: bg_orange_small.bg,
    bg_blue_small: bg_blue_small.bg,
    popClass:'A', //A门店专享,B通用券
    currCouponValue:'',
    currLimitValueStr:'',
    currCouponName:'',
    currCouponWay:''
  },
  onLoad: function (options) {
    commonObj.checkLoginStatus();
    console.log(options)
    var that = this;
    var couponType = options.couponType,
       couponValue = options.couponValue,
       couponLimitValueStr = options.couponLimitValueStr,
       couponName = options.couponName,
       couponCode = options.couponCode,
       couponWay = options.couponWay;
    couponType == '2' ? that.setData({ popClass: 'A', 
                        currCouponValue: couponValue, 
                        currLimitValueStr: couponLimitValueStr,
                        currCouponName:couponName,
                        currCouponWay: couponWay,
                        couponCode: /\S{5}/.test(couponCode) && couponCode.replace(/\s/g, '').replace(/(.{4})/g, "$1 ")
                      })
                  :that.setData({popClass: 'B',
                          currCouponValue: couponValue,
                          currLimitValueStr: couponLimitValueStr,
                          currCouponName: couponName,
                          currCouponWay: couponWay,
                          couponCode: /\S{5}/.test(couponCode) && couponCode.replace(/\s/g, '').replace(/(.{4})/g, "$1 ")
                          });
     wxbarcode.barcode('barcode1', couponCode, 600, 180);
     console.log("couponCode="+couponCode);

  }

})
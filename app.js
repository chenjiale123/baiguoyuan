//app.js
var common = require('source/js/common.js');
var QQMapWX = require('source/js/qqmap-wx-jssdk.min.js');
var isFirst = true;
App({

  onLaunch: function () {
	},

	onShow: function (options) {
    console.log('App.js ')
		var that = this;
		that.getUserInfo();
    that.getCityName();
		if (options && options.query && options.query.legisDucFlag) { //从立减金过来
			if (isFirst) {
				isFirst = false;
				wx.navigateToMiniProgram({
					appId: 'wxeb490c6f9b154ef9',
					extraData: {
						//正式环境
						encrypt_card_id: 'nFgy5J28SZ788e5L0PUbaPc1aTBrQHUGlPJGIxLNzcaGAnWihobHmxFWx/uW8CXh',
						outer_str: 'wxApp',
						biz: 'MjM5ODAwMTYwMA==#wechat_redirect'
					},
					success: function (res) {
						console.log('小程序跳转' + res.errMsg);
					}
				})
				//that.getUserInfo();
			} else {
				that.startFun(options);
			}
		} else {
			that.startFun(options);
		}

		wx.onNetworkStatusChange(function (res) {
			if (!res.isConnected) {
				wx.reLaunch({
					url: '/pages/noSignal/index'
				})
			}
		})
	},
	startFun: function (options) {
		var that = this;
		if (options.referrerInfo) { //领完卡回来
      if (options.referrerInfo.appId == 'wxf912553adb49c3b2' || options.referrerInfo.appId == 'wxdbb69655e0c68d95' || options.referrerInfo.appId == 'wx64168858244cb3d1') { //果礼商城和公众号回来或者从礼品卡回来
				
			} else {
				if (options.referrerInfo.appId == 'wxeb490c6f9b154ef9' && options.referrerInfo.extraData) { //领卡成功
					that.globalData.activeStatus = 'A';
					that.globalData.card_id = options.referrerInfo.extraData.card_id;
					that.globalData.code = options.referrerInfo.extraData.code;
					wx.setStorageSync('code', options.referrerInfo.extraData.code);
					wx.setStorageSync('card_id', options.referrerInfo.extraData.card_id);
					that.globalData.activate_ticket = options.referrerInfo.extraData.activate_ticket;
				} else { //激活成功，未激活
					that.globalData.activeFlag = true;//进入过开卡小程序的标志
					that.globalData.activeStatus = 'B';
				}
				common.commonObj.getUserObj();
			}
		}
	},
	getUserInfo: function (cb) { //获取openId和unionId
		var that = this;
    if (wx.getStorageSync('wxSnsInfo')) {
      typeof cb == "function" && cb()
      return;
    } else {
      //调用登录接口
      var p1 = new Promise(function (reslove, reject) {
        wx.login({
          success: function (res) {
            reslove(res.code);
          }
        })
      });
      var p2 = new Promise(function (reslove, reject) {
        wx.getUserInfo({
          success: function (res) {
            that.globalData.userInfo = res.userInfo;
            if (that.userInfoReadyCallback) {
              that.userInfoReadyCallback(res)
            }
            wx.setStorageSync('userNameAndImg', { nickName: res.userInfo.nickName, avatarUrl: res.userInfo.avatarUrl })
            reslove(res);
          }
        })
      });
      var p = Promise.all([p1, p2]).then(obj => {
        var options = {
          encryptFlag: false,
          url: '/miPayService/wxSns',
          data: { "js_code": obj[0], "encryptedData": obj[1].encryptedData, "iv": obj[1].iv }
        }
        common.commonObj.requestData(options, function (res) { 
          // if(that.wxSnsInfoReadyCallback){
          //   that.wxSnsInfoReadyCallback(res);
          // }
          that.globalData.openid = res.data.data && res.data.data.openId;
          that.globalData.unionid = res.data.data && res.data.data.unionId;
          if (res.data.data.openId != "undefined" && res.data.data.unionid != "undefined") {
            wx.setStorageSync('wxSnsInfo', { openid: res.data.data.openId, unionid: res.data.data.unionId });
          }
          typeof cb == "function" && cb()
        })
      }).catch(e => e)
    };
  },
  getCityName: function (cb) {
    var that = this;
    if(wx.getStorageSync('userCurrLoca')){
      return typeof cb == 'function' && cb()
    }
    var getLocaFun = function () { //获取定位promise封装
      return new Promise(function (reslove, reject) {
        wx.getLocation({
          type: 'gcj02',
          success: function (res) { console.log(res); reslove(res) },
          fail: function (res) { reject() }
        })
      });
    }
    var getCityFun = function (req) { //获取城市promise封装
      return new Promise(function (reslove, reject) {
        let lat = req.latitude;
        let lng = req.longitude;
        var demo = new QQMapWX({
          coord_type: 5,
          key: common.commonObj.qqMapKey
        });
        demo.reverseGeocoder({  //逆地址解析
          location: {
            latitude: lat,
            longitude: lng
          },
          success: function (res) { reslove(res) },
        });
      })
    }
    getLocaFun().then(function (res) {
      return getCityFun(res);
    })
      .catch(function () {
        // 首页-未开启定位
        wx.reportAnalytics('viewstoreclick_d');
        common.commonObj.getUserSetting();
      })
      .then(function (res) {
        let ad_info = res.result.ad_info;
        let cityName = ad_info.city;
        let location = ad_info.location;
        if (wx.getStorageSync('city') && cityName != wx.getStorageSync('city').cityName) { //切换城市，清空门店数据
          wx.setStorageSync('selfLiftStore', '');
        }
        if(cityName && location) wx.setStorageSync('userCurrLoca',{'cityName':cityName,'location':location});
        return typeof cb == 'function' && cb();
      })
  },
  globalData: {
    userInfo: null,
    activeStatus: 'A', // A領卡成功,B未激活和激活成功
    card_id: '', //开卡组件返回的card_id
    code: '', //开卡组件返回的code
    activate_ticket: ''//开卡组件返回的激活票据
  },
  onUnload: function () {
    // wx.removeStorageSync('userCurrLoca')
  }
})
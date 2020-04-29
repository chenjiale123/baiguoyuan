var CryptoJS = require('crypto-min');
var commonObj = {

  /***测试环境 */
  // PAGODA_DS_DOMAIN: 'https://a8-domain.pagoda.com.cn:11045/jsse',//电商测试:11045
  // PAGODA_DSN_DOMAIN: 'https://a8-domain.pagoda.com.cn:11047',//新电商测试:11047
  // PAGODA_PIC_DOMAIN: 'https://a8-domain.pagoda.com.cn:11052/miResourceMgr',//图片地址11052测试,14052uat
  // // PAGODA_XCX_DOMAIN: 'http://119.29.169.221:9191/memberMiniProgram', //小程序旧测试环境地址
  // PAGODA_XCX_DOMAIN: 'https://a8-domain.pagoda.com.cn:11047', //小程序测试环境地址

  /***UAT环境 */
  // PAGODA_DS_DOMAIN: 'https://a8-domain.pagoda.com.cn:14045/jsse',//UAT:14045
  // PAGODA_DSN_DOMAIN: 'https://a8-domain.pagoda.com.cn:14061',//新电商UAT:14064
  // PAGODA_PIC_DOMAIN: 'https://a8-domain.pagoda.com.cn:14052/miResourceMgr',//图片地址11052测试,14052uat
  // PAGODA_XCX_DOMAIN: 'http://119.29.169.221:9090/memberMiniProgram', //小程序UAT环境地址

  /***正式环境 */
  PAGODA_DS_DOMAIN: 'https://pagoda-buy-acc.pagoda.com.cn/jsse', //电商正式环境
  PAGODA_DSN_DOMAIN: 'https://wx-mini.pagoda.com.cn', //小程序新地址
  PAGODA_PIC_DOMAIN: 'https://oh6dt6vbt.qnssl.com', //图片正式环境
  PAGODA_XCX_DOMAIN: 'https://wechat.pagoda.com.cn/wechat/memberMiniProgram', //小程序正式环境

  pwd: 'pagodabaiguoyuan',    //初次加密使用的密钥,之后用token
  qqMapKey: 'UJPBZ-ODVWF-ZQFJW-JBIK7-UUTUZ-U7F7W', //腾讯地图开发者密钥
  Encrypt: function (jsonObj, keyStr) {
    var that = this;
    let key = CryptoJS.enc.Utf8.parse(that.resetWxAppKey(keyStr));
    let iv = "";
    let encryptedStr = CryptoJS.AES.encrypt(JSON.stringify(jsonObj), key, { iv: iv, mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7, format: CryptoJS.format.Hex });
    return encryptedStr.toString().toUpperCase();
  },
  Decrypt: function (str, keyStr) {
    var that = this;
    if (!str) {
      return str;
    }
    let iv = "";
    var key = CryptoJS.enc.Utf8.parse(that.resetWxAppKey(keyStr));
    var dec = CryptoJS.AES.decrypt(str, key, { iv: iv, mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7, format: CryptoJS.format.Hex });
    var result = dec.toString(CryptoJS.enc.Utf8);
    return result;
  },
  resetWxAppKey: function (key) {
    var result = "";
    if (key) {
      var len = String(key).length;
      if (len < 16) {
        result = String(key);
        for (var i = len; i < 16; i++) {
          result += "0";
        }
      } else {
        result = String(key);
      }
    }
    return result;
  },
  requestData: function (options, sucCallback, failCallback, comCallback) { //老接口请求
    var that = this,
      encryptFlag = options.encryptFlag,//是否需要加密,true加密,false不加密
      url = options.url || '', //请求地址,必填
      data = options.data || {}, //请求参数
      header = options.header || {}, //设置请求的header
      method = options.method || 'POST', //请求method,本项目默认POST请求
      dataType = options.dataType || 'json', //返回数据格式
      failCallback = failCallback || function () { }, //无fail回调默认空
      comCallback = comCallback || function () { }; //无complete回调默认空
    header['x-defined-verinfo'] = "wx";
    // header['X-DEFINED-appinfo'] = 'wx';
    that.getNetworkStatus(function (isConnected) { //请求之前做无网络判断
      if (!isConnected) {
        wx.redirectTo({
          url: '/pages/noSignal/index'
        })
      }
    });
    if (url.indexOf('/getValiCode') > 0 || url.indexOf('/login') > 0) {
      url = that.PAGODA_DS_DOMAIN + url; // 谨献给换卡失效之后苦逼程序员的登陆入口
    } else {
      url = that.PAGODA_DSN_DOMAIN + url;
      // url = that.PAGODA_XCX_DOMAIN + url;
    }
    console.log(url);
    if (encryptFlag) { //加密的看过来
      var user = wx.getStorageSync('user');
      if (url.indexOf('/login') > 0 || url.indexOf('/bindCard') > 0) { //登录用pagodabaiguoyuan加密
        data = that.Encrypt(data, that.pwd);
        data = JSON.stringify({ data: data });
      } else if (url.indexOf('/modifyPasswordByPhoneNum') > 0 || url.indexOf('/changeMember') > 0) {
        //重置密码,自助换卡不做处理,在对应页面处理,因为只需要加密对应的字段
        // data = JSON.stringify({data:data});
      } else if (url.indexOf('/getHomeData') > 0) {    // 对于新接口来讲，暂时利用pwd作为加解密密钥
        data = that.Encrypt(data, that.pwd);
        data = JSON.stringify({ userToken: user.userToken, data: data, pagodaChannel: 'wxApp' });
      } else { //其他用token加密
        data = that.Encrypt(data, wx.getStorageSync('token'));
        data = JSON.stringify({ userToken: user.userToken, data: data, pagodaChannel: 'wxApp' });
      }
      //重置密码和自助换卡用会员的接口,域名采用会员这边的
      wx.request({
        url: url,
        data: data,
        header: header,
        method: method,
        dataType: dataType,
        success: function (res) {
          if (res.data.errorCode == -1002) {
            wx.hideLoading();
            that.clearStoWithOutHisData();
            // wx.hideToast();
            that.loginExpired();
          } else {
            sucCallback && sucCallback(res);
          }
        },
        fail: function (res) {
          if (typeof (failCallback) == 'function') {
            typeof failCallback == 'function' && failCallback(res);
          } else { //没传fail方法的处理
            that.showModal('提示', '哇哦~~网络出错了~', false);
          }
        },
        complete: function (res) {
          // wx.hideLoading();
          comCallback && comCallback(res);
        }
      })
    } else { //不加密的走这里
      data = JSON.stringify(data);
      wx.request({
        url: url,
        data: data,
        header: header,
        method: method,
        dataType: dataType,
        success: function (res) {
          sucCallback && sucCallback(res);
        },
        fail: function (res) {
          if (typeof (failCallback) == 'function') {
            typeof failCallback == 'function' && failCallback(res);
          } else { //没传fail方法的处理
            that.showModal('提示', '哇哦~~网络出错了~', false);
          }
        },
        complete: function (res) {
          // wx.hideLoading();
          comCallback && comCallback(res);
        }
      })
    }

  },

  requestNewData: function (options, sucCallback, failCallback, comCallback) { //新接口请求
    var that = this,
      url = options.url || '', //请求地址,必填
      header = options.header || {}, //设置请求的header
      method = options.method || 'GET', //请求method,本项目默认POST请求
      dataType = options.dataType || 'json', //返回数据格式
      failCallback = failCallback || function () { }, //无fail回调默认空
      comCallback = comCallback || function () { }; //无complete回调默认空
      header['x-defined-verinfo'] = "wx";
    that.getNetworkStatus(function (isConnected) { //请求之前做无网络判断
      if (!isConnected) {
        wx.redirectTo({
          url: '/pages/noSignal/index'
        })
      }
    });
    wx.request({
      // url: that.PAGODA_XCX_DOMAIN + url,
      url: that.PAGODA_DSN_DOMAIN + url,
      
      header: header,
      method: method,
      dataType: dataType,
      success: function (res) {
        if (res.data.errorCode == -1002) {
          wx.hideLoading();
          that.clearStoWithOutHisData();
          that.loginExpired();
        } else {
          sucCallback && sucCallback(res);
        }
      },
      fail: function (res) {
        if (typeof (failCallback) == 'function') {
          typeof failCallback == 'function' && failCallback(res);
        } else { //没传fail方法的处理
          that.showModal('提示', '哇哦~~网络出错了~', false);
        }

      },
      complete: function (res) {
        // wx.hideLoading();
        comCallback && comCallback(res);
      }
    })
  },
  checkLoginStatus: function (urlInfo) { //判断是否登录,若未登陆,跳转到登录页
    var user = wx.getStorageSync('user');
    var that = this;
    if (!user || !user.userToken) {
      if (urlInfo) {  //带urlInfo的不跳转到首页
        // wx.navigateTo({
        //   url: '/pages/login/index?urlInfo=' + urlInfo,
        // })
      } else {   //通过其他途径如分享进去的页面,不携带info
        that.showModal('提示', '您还未登陆，请先登录~', false, '我知道了', '', function () {
          wx.redirectTo({
            url: '/pages/index/index',
          })
        })

      }
      return false;
    } else {
      return true;
    }
  },
  clearStoWithOutHisData: function () {
    var historyData = wx.getStorageSync('historyData');
    var phoneNumber = wx.getStorageSync('user').phoneNumber || wx.getStorageSync('phoneNumber'); //防止2次请求出现undefined的情况
    wx.clearStorage();
    wx.setStorage({
      key: 'phoneNumber',
      data: phoneNumber
    })
    wx.setStorage({
      key: 'historyData',
      data: historyData
    })

  },
  formatDistance: function (x) {
    if (x < 100) return parseInt(x) + 'm';
    var x = x * 0.001;
    if (x > 300) {
      return '>300km';
    } else {
      return x.toFixed(1) + 'km';
    }
  },
  getRad: function (d) {
    var PI = Math.PI;
    return d * PI / 180.0;
  },
  getFlatternDistance: function (lat1, lng1, lat2, lng2) { //根据经纬度计算2点之间的距离
    var that = this;
    var EARTH_RADIUS = 6378137.0;    //单位M
    var f = that.getRad((lat1 + lat2) / 2);
    var g = that.getRad((lat1 - lat2) / 2);
    var l = that.getRad((lng1 - lng2) / 2);
    var sg = Math.sin(g);
    var sl = Math.sin(l);
    var sf = Math.sin(f);
    var s, c, w, r, d, h1, h2;
    var a = EARTH_RADIUS;
    var fl = 1 / 298.257;
    sg = sg * sg;
    sl = sl * sl;
    sf = sf * sf;
    s = sg * (1 - sl) + (1 - sf) * sl;
    c = (1 - sg) * (1 - sl) + sf * sl;
    w = Math.atan(Math.sqrt(s / c));
    r = Math.sqrt(s * c) / w;
    d = 2 * w * a;
    h1 = (3 * r - 1) / 2 / c;
    h2 = (3 * r + 1) / 2 / s;
    return that.formatDistance(d * (1 + fl * (h1 * sf * (1 - sg) - h2 * (1 - sf) * sg)));
  },
  showModal: function (title, content, showCancel, confirmText, cancelText, callback) { //模态弹框
    var that = this;
    if (!that.isCompatible(wx.showModal)) {
      return;
    }
    wx.showModal({
      title: title, //弹框标题
      content: content, //提示内容
      showCancel: showCancel, //是否显示取消按钮
      confirmText: confirmText || '我知道了',
      cancelText: cancelText || '随便看看',
      cancelColor: '#999999',
      confirmColor:'#37D260',
      success: callback || function () { }
    });
  },
  getNetworkStatus: function (callback) { //判断网络状态
    var that = this;
    var isConnected = false;
    wx.getNetworkType({
      success: function (res) {
        if (res.networkType != 'none') {
          isConnected = true;
        } else {
          setTimeout(function () {
            wx.hideLoading();
          }, 5000)
        }
        callback(isConnected);
      },
      fail: function () {
        that.showModal('提示', '网络异常', false);
      }
    })
  },
  isCompatible: function (x) { //判断兼容性
    var that = this;
    if (!x) {
      that.showModal('提示', '当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。', false);
      return false;
    }
    return true;
  },
  checkLoginStatus: function (urlInfo) { //判断是否登录,若未登陆,跳转到登录页
    let user = wx.getStorageSync('user');
    var that = this;
    wx.hideLoading();
    if (!user || !user.userToken) {
      if (urlInfo) {
        // wx.navigateTo({
        //   url: '/pages/login/index?urlInfo=' + urlInfo,
        // })

      } else {   //通过其他途径如分享进去的页面,不携带info
        that.showModal('提示', '您还未登陆，请先登录~', false, '我知道了', '', function () {
          // wx.redirectTo({
          //   url: '/pages/index/index',
          // })
          wx.switchTab({
            url: '/pages/index/index'
          })
        })
      }
      return false;
    } else {
      return true;
    }
  },
  loginExpired: function () { //登录过期跳转
    var that = this;
    that.clearStoWithOutHisData();
    that.showModal('提示', '您的登录已过期,请重新登录~', true, '立即登录', '', function (res) {
      console.log(res);
      if (res.confirm) {
        var pages = getCurrentPages();
        console.log(pages)
        var currPageRoute = pages[pages.length - 1].__route__.split('/');
        console.log(currPageRoute)
        wx.setStorageSync('urlInfo', currPageRoute[currPageRoute.length - 2]);
        // pages.length > 0 && pages[0].isBindCard();
        app.getUserInfo(function () { that.isBindCard() });
      } else if (res.cancel) {
        wx.reLaunch({
          url: '/pages/index/index'
        })
      }

    });
  },
  /****************开卡逻辑 [begin] ***********/
  /**
   * @method isBindCard   判断是否开卡,开过卡,自动登录,否则,走开卡流程。
   * @method autoActivate  自动激活。
   * @method toTargetPage  激活成功进入对应的页面。
   * @method getUserObj   根据开卡状态去做对应操作，即领卡成功去获取用户名，激活成功去登陆。
   * @method getLoginName  获取开卡组件返回的用户信息
   */
  isBindCard: function (phoneNum, paramObj) {   //第一个参数为手机号，第二个参数为页面参数
    var that = this;
    var app = getApp();
    that.getUserSetting();
    if(!wx.getStorageSync('wxSnsInfo')){
      that.showModal('提示','账号异常，请联系管理员4001811212',false);
      return;
    }
    let code = wx.getStorageSync('code');
    let card_id = wx.getStorageSync('card_id');
    let phoneNumber = wx.getStorageSync('phoneNum');
    if (code && card_id && phoneNumber) {
      that.autoActivate(phoneNumber);
      return;
    }
    var options = {
      header: {
        "X-DEFINED-appinfo": JSON.stringify({
          "deviceID": "35EAAF0C-D590-4F40-8F73-73735FDC02E5",
          "os": "iOS 10.3.1",
          "model": "Simulator",
          "channel": "miniprogram",
          "verName": "2.5.1.0"
        })
      },
      encryptFlag: false,
      url: '/miniProgramServer/bindCard',
      data: {
        openID: wx.getStorageSync('wxSnsInfo').openid,
        unionID: wx.getStorageSync('wxSnsInfo').unionid,
        loginName: phoneNum || ''
      }
    }
    console.log(options.data);
    wx.showLoading({
      title: '加载中',
      mask: true
    })
    that.requestData(options, function (res) {
      if (res.data.errorCode == 0) { //开卡成功
        var userId = res.data.userID;
        var token = that.Decrypt(res.data.data.userToken, that.pwd);//	103306748|15be1dcd75c|0,,中间的作为下次请求的密钥
        wx.setStorageSync('user', res.data.data)
        wx.setStorageSync('token', token.split('|')[1]);
        that.toTargetPage(paramObj || '');
      } else{ //没开过卡
        if (!that.isCompatible(wx.navigateToMiniProgram) || app.globalData.activeFlag) { //进过一次开卡，不让继续进了，避免死循环
          return;
        }
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
      } 
    })
  },
  autoActivate: function (phoneNum, invalidInfo) {
    var that = this;
    var app = getApp();
    var phoneNum = phoneNum,
      card_id = wx.getStorageSync('card_id'),
      code = wx.getStorageSync('code'),
      openid = wx.getStorageSync('wxSnsInfo').openid,
      unionid = wx.getStorageSync('wxSnsInfo').unionid,
      url = '';
    if (invalidInfo) {
      url = '/weixinCard/wxAppShipCardActivation.do?card_id=' + card_id + '&card_code=' + code + '&wxOpenid=' + openid + '&membershipNumber=' + phoneNum + '&unionid=' + unionid + '&' + invalidInfo + '=1';
    } else {
      url = '/weixinCard/wxAppShipCardActivation.do?card_id=' + card_id + '&card_code=' + code + '&wxOpenid=' + openid + '&membershipNumber=' + phoneNum + '&unionid=' + unionid;
    }

    console.log("autoActivate card_id=" + card_id + ",card_code=" + code + ",wxOpenid=" + openid + ",membershipNumber=" + phoneNum + ",unionid=" + unionid);
    console.log(url);
    var options = {
      encryptFlag: false,
      url: url,
      method: 'GET'
    }
    wx.showLoading({
      title: '加载中',
    })
    that.requestData(options, function (res) {
      if (res.data.errcode == 0 || res.data.errcode == 10004) {
        wx.getStorageSync('phoneNum') && wx.removeStorageSync('phoneNum');
        app.getUserInfo(function () { that.isBindCard(phoneNum) });
      } else if (res.data.errcode == 10006 || res.data.errcode == 10012) {
        that.showModal('提示', '查询会员账户异常，请联系管理员4001811212！', false);
      }
      // else if(res.data.errcode == 10013 || res.data.errcode == 10014){ //10013卡失效，10014手机号失效
      //   var errInfo = res.data.errcode == 10013 ? 'cardIsCorrect' : 'memberShipMumberIsCorrect';
      //   that.showModal('提示', res.data.resultValue,true,'确认','取消',function(res){
      //     if(res.confirm){
      //       that.autoActivate(phoneNum, errInfo);
      //     }else if(res.cancel){
      //       wx.setStorageSync('phoneNum', phoneNum);
      //       that.refreshUserInfo();
      //     }
      //   })
      // }
      else {
        that.showModal('提示', '激活失败，请联系管理员4001811212！', false);
        wx.setStorageSync('phoneNum', phoneNum);
        // that.refreshUserInfo();
      }
    })
  },
  toTargetPage: function (paramObj) {
    var urlInfo = wx.getStorageSync('urlInfo');
    console.log("urlInfo =" + urlInfo);
    var pages = getCurrentPages();
    var currPageRoute = pages[pages.length - 1].__route__.split('/');
    currPageRoute = currPageRoute[currPageRoute.length - 2];
    if (!urlInfo || urlInfo == 'pages/index') {
      wx.reLaunch({
        url: '/pages/index/index'
      })
    } else {
      var urlInfoArr = urlInfo.split('/');
      var urlInfoArrLen = urlInfoArr.length;
      var isPageExist = urlInfoArrLen > 2 ? urlInfoArr[2] == currPageRoute : urlInfoArr[0] == currPageRoute;
      if (isPageExist) { //历史记录已有该页面
        if (paramObj) { //有参数的情况
          wx.redirectTo({
            url: `/${urlInfo}/index?bindCardObj=${JSON.stringify(paramObj)}`,
          })
        } else {
          wx.redirectTo({ 
            url: `/${urlInfo}/index`,
          })
        }

      } else {
        if (paramObj) { //有参数的情况
          wx.navigateTo({
            url: `/${urlInfo}/index?bindCardObj=${JSON.stringify(paramObj)}`,
          })
        } else {
          wx.navigateTo({
            url: `/${urlInfo}/index`,
          })
        }

      }
    }
  },
  getUserObj: function () {
    var that = this;
    var app = getApp();
    if (app) { //防止app获取不到的情况
      console.log("getUserObj activeStatus =" + app.globalData.activeStatus);
      if (app.globalData.activeStatus == 'A') { //领卡成功
        that.getLoginName();
      } else { //激活成功
        that.getUserSetting();
        app.getUserInfo(function () { that.isBindCard() });
      }
    }
  },
  getLoginName: function () {
    var that = this;
    var app = getApp();
    var options = {
      encryptFlag: false,
      url: '/membercard/getActivateTempInfo',
      data: {
        activate_ticket: app.globalData.activate_ticket
      }
    }
    that.requestData(options, function (res) {
      console.log(res);
      if (res.data.errcode == 0) {
        // var phoneNum = res.data.membership_number;
        var val = res.data.info.common_field_list.filter(function (ele, index) {
          if (ele['name'] == 'USER_FORM_INFO_FLAG_MOBILE') {
            return ele;
          };
        });
        console.log(val);
        that.autoActivate(val[0].value);
      }
    })
  },
  /****************开卡逻辑 [end] ***********/
  /****************重新授权获取用户信息和地理位置信息**************/
  getUserSetting: function () {
    if (!this.isCompatible(wx.getSetting)) return;
    wx.getSetting({
      success(res) {
        if (!res.authSetting['scope.userInfo']||!res.authSetting['scope.userLocation']) {
          wx.showModal({
            title: '授权提示', //弹框标题
            content: '您尚未授权小程序获取你的个人信息，如微信头像，用户名、位置等', //提示内容
            showCancel: true, //是否显示取消按钮
            confirmText: '授权',
            cancelText: '取消',
            cancelColor: '#999999',
            success: function (res) {
              if (res.confirm) {
                wx.openSetting()
              } else {
                wx.switchTab({
                  url: '/pages/index/index',
                })
              }
            }
          });      
        } 
      }
    })
  },
  /****************格式化时间**************/
  formatTime: function (time) {
    let y = time.substring(0, 4);
    let m = time.substring(4, 6);
    let d = time.substring(6, 8);

    let h = time.substring(8, 10);
    let mi = time.substring(10, 12);
    let s = time.substring(12, 14);

    let formatT = y + '-' + m + '-' + d + ' ' + h + ':' + mi + ':' + s;
    return formatT;
  },

  /****************获取定位->获取城市id->获取门店地址 ****************/

  /****************End*******************************/
}

module.exports = { commonObj }
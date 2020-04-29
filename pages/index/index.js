//index index.js
var home_bg_nologin = require('../../source/image-base64/home_btn_bg_nologin');
var home_bg_login1 = require('../../source/image-base64/login_bg1');
var home_bg_login2 = require('../../source/image-base64/login_bg2');
var home_bg_login3 = require('../../source/image-base64/login_bg3');
var home_bg_login4 = require('../../source/image-base64/login_bg4');
var bg_percen = require('../../source/image-base64/bg_youli');
var commonObj = require('../../source/js/common').commonObj;
var home = { 1: home_bg_login1, 2: home_bg_login2, 3: home_bg_login3, 4: home_bg_login4 };
//获取应用实例
var app = getApp()
Page({
  data: {
    home_btn_bg: home_bg_nologin.bg,
    bg_percen: bg_percen.bg,
    isReady: false,
    balance: '*',//果币余额；
    couponAmount: "*",//优惠券数量
    integralBalance: '*',//会员总积分
    detailShowFlag: false,
    hasPay: false,     // 是否有待付款订单
    hasTake: false,	 // 是否有待自提订单
    imgUrl: '/source/images/icon_portrait.png',
    userName: '百果园',
    prePayOrderCount: 0,
    preTakeOrderCount: 0,
    processGroupCount: 0


  },
  onLoad: function (options) {
    wx.showLoading({ title: '加载中', mask: true });
  },

  onShow: function () {
    var that = this;
    wx.getSystemInfo({
      success: function (res) {
        var version = res.version.split('.');
        var flag = parseInt(version[0]) <= 6 && parseInt(version[1]) <= 5 && parseInt(version[2]) < 8 ? true : false;
        if (flag) {
          commonObj.showModal('提示', '当前微信版本过低，请升级到最新微信版本后重试。', false)
          return;
        }
        // if (that.isNewUser()) { //新用户
        // } else {
          that.canIUse = true;
          // 页面每次显示的时候都会检查,如果用户换了头像和微信名也可以及时改变
          that.getUserNameAndImg();
          that.refreshUserInfo();
        // }

      }
    });
  },
  isNewUser: function () { //判断是否领过卡，如果没有，每次都要弹；如果有，不弹。
    commonObj.getUserSetting();
    var options = {
      encryptFlag: false,
      url: '/miniProgramServer/bindCard',
      data: {
        openID: wx.getStorageSync('wxSnsInfo').openid,
        unionID: wx.getStorageSync('wxSnsInfo').unionid
      }
    }
    commonObj.requestData(options, function (res) {
      if (res.data.errorCode == 2032) {
        commonObj.showModal('百果园+小程序', '完成注册享受百果园会员权益！', true, '立即注册', '稍后注册', function (res) {
          if (res.confirm) {
            wx.reportAnalytics("vip_popupregisterclick")   //会员页注册弹窗btn v1.4
            commonObj.isBindCard();
          }
        });
      } else {

      }

    })
  },
  onPullDownRefresh: function () {
    var that = this;
    wx.stopPullDownRefresh();
    that.refreshUserInfo();
  },

  onShareAppMessage: function () {
    return {
      title: '拼的是好吃，团的是实惠',
      path: '/pages/fightGroups/index',
      imageUrl: '/source/images/pintuanpeitu.png',
      success: function () {
        wx.reportAnalytics('share_success')
      },
      fail: function () {
        wx.reportAnalytics('share_fail')
      }
    }
  },
  /**********************功能函数*******************/
  getToken: function (unionid) { //从服务端获取登陆状态(实现商城，小程序间登陆状态共享)
    var options = {
      encryptFlag: false,
      url: '/miniProgramServer/isBindCard',
      data: { unionID: unionid }
    }
    commonObj.requestData(options, function (res) {
      if (res.errorCode == 0) {
        return res.data;
      } else {
        return false;
      }
    })
  },
  isLogin: function () {   //判断是否登陆
    var that = this;
    if (!app.globalData.openid || !app.globalData.unionid) {
      var wxSnsInfo = wx.getStorageSync('wxSnsInfo');
      if (wxSnsInfo) {
        return that.getToken(wxSnsInfo.unionid);
      } else {
        app.wxSnsInfoReadyCallback = res => {
          var openid = res.data.data.openId;
          var unionid = res.data.data.unionId;
          wx.setStorageSync('wxSnsInfo', { openid: openid, unionid: unionid });
          return that.getToken(unionid);
        }
      }
    } else {
      wx.setStorageSync('wxSnsInfo', { openid: app.globalData.openid, unionid: app.globalData.unionid });
      return that.getToken(app.globalData.unionid);
    }
  },
  //刷新用户信息
  refreshUserInfo: function () {
    let that = this;
    let token = wx.getStorageSync("token");
    let user = wx.getStorageSync('user');
    let userInfo = wx.getStorageSync('userNameAndImage');
    if (user && token) {            // 这里就相当于判断了用户是否登录
      let userId = user.userID;
      let userToken = user.userToken;
      let phone = user.phoneNumber;
      let userName = phone.substring(0, 3) + '****' + phone.substring(7, 11)
      that.setData({ isLogin: true, userName: userName });
      // 统一接口
      that.getAllData(userId, userToken, token, phone);
      that.getOrderInfo(userId, userToken);
    }
    // else if(that.isLogin()){ //检测服务端是否存在token
    //   console.log("islogined!!!!!!!!!!!!!!!!!");
    //   let userObj = that.isLogin();
    //   let userId = userObj.userID;
    //   let userToken = userObj.userToken;
    //   let phone = userObj.phoneNumber;
    //   let userName = phone.substring(0, 3) + '****' + phone.substring(7, 11);
    //   wx.setStorageSync('user', userObj);
    //   wx.setStorageSync('token', userToken.split('|')[1]);
    //   that.setData({ isLogin: true, userName: userName });
    //   // 统一接口
    //   that.getAllData(userId, userToken, token, phone);
    // } 
    else {
      that.setData({ isLogin: false, isReady: true, balance: '*', couponAmount: "*", integralBalance: '*', userName: userInfo.nickName, imgUrl: userInfo.avatarUrl });
      setTimeout(function () { wx.hideLoading(); }, 500);
    }
  },
  // 获取设置用户微信名和头像
  getUserNameAndImg: function () {
    let that = this;
    if (app.globalData.userInfo == null) {
      // 这里有两种情况    
      // 1.未授权，所以拿不到用户信息。如果授权了，不走这里
      // 2.已授权，但是异步请求的数据没有返回，拿以前缓存的数据
      let userInfo = wx.getStorageSync('userNameAndImg');
      if (userInfo) {
        that.setData({ userName: userInfo.nickName, imgUrl: userInfo.avatarUrl })
      } else {
        // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
        // 所以此处加入 callback 以防止这种情况
        app.userInfoReadyCallback = res => {
          this.setData({
            userName: res.userInfo.nickName,
            imgUrl: res.userInfo.avatarUrl
          })
        }
      }
    } else if (app.globalData.userInfo) {
      that.setData({
        userName: app.globalData.userInfo.nickName,
        imgUrl: app.globalData.userInfo.avatarUrl,
      })
      wx.setStorageSync('userNameAndImg', { nickName: app.globalData.userInfo.nickName, avatarUrl: app.globalData.userInfo.avatarUrl })
    } else if (this.data.canIUse) {

    }
  },

  // 首页-登录按钮点击
  tapLoginBtn: function () {
    wx.reportAnalytics('vip_openmembershipcardbtn');
    var that = this;
    that.preventEvent();
    app.globalData.activeFlag = false; //恢復狀態
    app.getUserInfo(function(){commonObj.isBindCard()});//给一个匿名函数，否则如果直接写commonObj.isBindCard(),函数会先执行。
    wx.setStorageSync('urlInfo', 'pages/index');
    // wx.navigateTo({                                // 原手机验证码登陆
    //   url: '/pages/login/index',
    // })
  },
  // 获取余额，积分，优惠券数量，会员等级
  getAllData: function (userId, userToken, token, phone) {
    let params = { customerID: userId, userToken: userToken, phoneNumber: phone, token: token };
    var that = this;
    let options = {
      encryptFlag: true,
      url: '/home/getHomeData',
      data: params
    }
    commonObj.requestData(options, function (res) {

      if (res.data.errorCode == -1002) {
        commonObj.loginExpired();
      } else if (res.data.errorCode == 0 && res.data.data) {
        let decryptdata = JSON.parse(commonObj.Decrypt(res.data.data, commonObj.pwd));
        console.log(decryptdata)
        let member = decryptdata.memberInfo;                       // 会员其他信息
        let levelInfo = decryptdata.levelScheduleEntities;         // 会员积分等级信息
        let memberAcc = decryptdata.memberAccount;          // 会员账号信息
        that.setData({
          isReady: true,
          balance: parseFloat(decryptdata.balance) / 100,         // 会员余额
          couponAmount: decryptdata.couponAmount,           // 会员优惠券数量
          home_btn_bg: home[member.levelId].bg || home[0].bg,       // 背景图                
          levelName: decryptdata.levelName,  // 会员等级
          levelId: decryptdata.levelId,
          integralBalance: parseInt(memberAcc.integralBalance),  // 会员积分
          isCon: true
        });
      }
    }, '', function (res) {
      wx.hideLoading();
    })
  },
  // 我的首页查询是否有订单
  getOrderInfo: function (userID, userToken) {
    let that = this;
    let options = {
      header: {
        "X-DEFINED-appinfo": JSON.stringify({
          "deviceID": "35EAAF0C-D590-4F40-8F73-73735FDC02E5",
          "os": "iOS 10.3.1",
          "model": "Simulator",
          "channel": "miniprogram",
          "verName": "2.5.1.0"
        }),
        "userToken": userToken
      },
      data: {
        customerID: userID
      },
      url: '/groupOrder/checkHasOrder'
    }
    commonObj.requestData(options, function (res) {
      if (res.data && res.data.errorCode == 0) {
        var data = res.data.data;
        that.setData({
          prePayOrderCount: data.prePayOrderCount,
          preTakeOrderCount: data.preTakeOrderCount,
          processGroupCount: data.processGroupCount
        })
      } else if (res && res.errorCode === -101) {

      }

    }, '', '')
  },
  // **************************所有的跳转链接****************************
  // 首页-会员信息（卡面）点击
  tapMemberInfo: function () {
    var that = this;
    that.preventEvent();
    var eventAnalytics = ['vip_memberlevel1', 'vip_memberlevel2', 'vip_memberlevel3', 'vip_memberlevel4'];
    if (commonObj.checkLoginStatus('myPrivlg')) {
      wx.reportAnalytics(eventAnalytics[parseInt(that.data.levelId) - 1]);
      wx.navigateTo({
        url: '/userA/pages/myPrivlg/index',
      })
    } else {
      wx.reportAnalytics('vip_cardbtn');
      wx.setStorageSync('urlInfo', 'userA/pages/myPrivlg'); //记录要跳转的页面
      app.globalData.activeFlag = false;
      app.getUserInfo(function () { commonObj.isBindCard() });
    }

  },
  // 跳转修改个人信息页
  navigateModifyUserInfo: function () {
    wx.reportAnalytics('vip_cardimgbtn');
    let that = this;
    that.preventEvent();
    if (commonObj.checkLoginStatus('modifyUserInfo')) {
      wx.navigateTo({
        url: '/userB/pages/modifyUserInfo/index',
      })
    } else {
      wx.setStorageSync('urlInfo', 'userB/pages/modifyUserInfo'); //记录要跳转的页面
      app.globalData.activeFlag = false;
      app.getUserInfo(function () { commonObj.isBindCard() });
    }
  },
  // 跳转会员码
  navigateMemberCode: function () {
    let that = this;
    if (commonObj.checkLoginStatus('memberCode')) {
      // wx.reportAnalytics('member_integration_click');   // 首页-会员积分点击
      wx.navigateTo({
        url: '/userB/pages/memberCode/index',
      })
    } else {
      wx.setStorageSync('urlInfo', 'userB/pages/memberCode'); //记录要跳转的页面
      app.globalData.activeFlag = false;
      app.getUserInfo(function () { commonObj.isBindCard() });
    }
    that.preventEvent();
  },
  //  跳转积分信息
  navigatoVipInfo: function () {
    let that = this;
    if (commonObj.checkLoginStatus('myPrivlg')) {
      wx.reportAnalytics('member_integration_click');   // 首页-会员积分点击
      wx.navigateTo({
        url: '/userA/pages/integrationDetail/index',
      })
    } else {
      wx.setStorageSync('urlInfo', 'userA/pages/integrationDetail'); //记录要跳转的页面
      app.globalData.activeFlag = false;
      app.getUserInfo(function () { commonObj.isBindCard() });
    }
    that.preventEvent();
  },
  // 跳转到查询优惠券页面
  navigateToCoupon: function () {
    let that = this;
    if (commonObj.checkLoginStatus('coupon')) {
      wx.reportAnalytics('coupon_click')          // 首页-会员优惠券点击
      wx.navigateTo({
        url: '/userA/pages/coupon/index',
      })
    } else {
      wx.setStorageSync('urlInfo', 'userA/pages/coupon');   // 记录要跳转的页面
      app.globalData.activeFlag = false;
      app.getUserInfo(function () { commonObj.isBindCard() });
    }
    that.preventEvent();
  },
  // 跳转到余额充值页面
  navigateToDeposit: function () {
    let that = this;
    that.preventEvent();
    if (commonObj.checkLoginStatus('deposit')) {
      wx.reportAnalytics('balance_click')  // 首页-账户余额·充值点击 
      wx.navigateTo({
        url: '/userA/pages/deposit/index',
      });
    } else {
      wx.setStorageSync('urlInfo', 'userA/pages/deposit');
      app.globalData.activeFlag = false;
      app.getUserInfo(function () { commonObj.isBindCard() });
    }
  },
  // 跳转订单详情页
  navigateAllOrder: function (e) {
    let that = this;
    let id = e.currentTarget.dataset.id;
    let obj = JSON.stringify({ orderStatus: e.currentTarget.dataset.orderstauts });
    var eventAnalytics = ['vip_allorder', 'vip_waitpay', 'vip_groupprocess', 'vip_waittake']
    that.preventEvent();
    if (commonObj.checkLoginStatus('myAllOrder')) {
      wx.reportAnalytics(eventAnalytics[id])  // 订单详情 
      wx.navigateTo({
        url: '/fightGroups/pages/myAllOrder/index?indexObj=' + obj,
      });
    } else {
      wx.setStorageSync('urlInfo', 'fightGroups/pages/myAllOrder');
      app.globalData.activeFlag = false;
      app.getUserInfo(function () { commonObj.isBindCard() });
    }
  },
  // 跳转附近门店
  naviagateNearbyStores: function () {
    wx.reportAnalytics('vip_nearstore');
    var indexObj = {};
    this.preventEvent();
    wx.getLocation({
      success: function (res) { },
    })
    wx.navigateTo({
      url: '/pages/storeMap/index?indexObj=' + JSON.stringify(indexObj),
    })
  },
  //跳转到下载页
  navigateToDownload: function () {
    wx.reportAnalytics('vip_apptobanan');
    wx.navigateTo({
      url: '/h5/pages/download/index'
    })
    this.preventEvent();
  },
  // 跳转到自助服务
  navigateSelfService: function () {
    wx.reportAnalytics('vip_selfservice');
    if (commonObj.checkLoginStatus('selfService')) {
      wx.navigateTo({
        url: '/userB/pages/selfService/index',
      });
    } else {
      wx.setStorageSync('urlInfo', 'userB/pages/selfService');
      app.globalData.activeFlag = false;
      app.getUserInfo(function () { commonObj.isBindCard() });
    }
    this.preventEvent();
  },

  navigategiftCard: function () {
    if (commonObj.isCompatible(wx.navigateBackMiniProgram)) {
      wx.navigateToMiniProgram({
        appId: 'wx64168858244cb3d1',
      })
    }

  },

  navigategiftStore: function () {
    if (commonObj.isCompatible(wx.navigateBackMiniProgram)) {
      wx.navigateToMiniProgram({
        appId: 'wxf912553adb49c3b2',
      })
    }
  },
  // 蒙层
  preventEvent: function () {
    this.setData({ prevent: true });
    setTimeout(() => {
      this.setData({ prevent: false });
    }, 400)
  }
})

// 会员充值index.js
var commonObj = require('../../../source/js/common').commonObj;
require('../../../utils/util.js')
var wxbarcode = require('../../../source/js/codeImg/index.js');
var bg_myaccount = require('../../../source/image-base64/bg_myaccount_top');

var app = getApp();
Page({
  data: {
    isReady: false,
    balance: 0,//果币余额；
    couponAmount: 0,//优惠券数量；
    faArray: [],
    allAmount: 0,
    recharge: '',
    btnSubmitDisabled: true,
    focus: false,
    closeTimer: null,
    balanceImage: '../../../source/images/icon_warning@2.png',
    myaccountbg: bg_myaccount.bg
  },
  onShow: function (options) {
    wx.setNavigationBarTitle({
      title: '我的账户'
    });
    commonObj.checkLoginStatus();
    // 获取会员码
    var that = this;
    var token = wx.getStorageSync("token");
    var user = wx.getStorageSync('user');
    if (!commonObj.checkLoginStatus('deposit')) {
      commonObj.showModal('提示', '您还未登陆哦，请先登陆~', true, '立即登陆', '', function (res) {
        if (res.confirm) {
          wx.setStorageSync('urlInfo', 'userA/pages/deposit'); //记录要跳转的页面
          app.globalData.activeFlag = false;
          app.getUserInfo(function () { commonObj.isBindCard() });
        } else if (res.cancel) {
          wx.switchTab({
            url: '/pages/index/index',
          })
        }
      })
    }else{
      wx.showLoading({
        title: '加载中',
        mask: true
      })
      let userId = user.userID;
      let userToken = user.userToken;
      let phoneNumber = user.phoneNumber;
      let phoneNumerHide = phoneNumber.substring(0, 3) + '****' + phoneNumber.substring(7);
      that.setData({ isLogin: true, phoneNumber: user.phoneNumber, phoneNumerHide: phoneNumerHide, showPhoneNo: false });
      // 查询果币信息；
      that.getBalance(userId, userToken, token);
      // 果币活动详情查询
      that.getPrivilegeAmount();
    }
  },
  //点击选择优惠活动列表
  selFA: function (event) {
    let charge = event.currentTarget.dataset.recharge;
    let send = event.currentTarget.dataset.send;
    let allAmount = parseInt(charge) + parseInt(send);
    this.setData({ recharge: charge, send: send, allAmount: allAmount, curActAmount: charge });
    if (this.data.recharge) {
      this.setData({ btnSubmitDisabled: false })
    } else {
      this.setData({ btnSubmitDisabled: true })
    }
    wx.reportAnalytics('depost_prompt_click');    // 事件统计，充值-提示块点击	
  },
  //输入充值金额
  inputRechage: function (event) {
    var that = this;
    clearTimeout(that.data.closeTimer);
    let recharge = event.detail.value;
    var faArray = this.data.faArray;
    var send = 0;
    for (let i = 0; i < faArray.length; i++) {
      if (recharge && parseInt(recharge) >= faArray[i].rechargeAmount && parseInt(send) <= faArray[i].sendAmount) {
        send = faArray[i].sendAmount;
      }
    }
    let allAmount = parseInt(recharge) + parseInt(send);
    this.setData({ recharge: parseInt(recharge), send: parseInt(send), allAmount: allAmount, curActAmount: recharge });
    if (this.data.recharge) {
      this.setData({ btnSubmitDisabled: false })
    } else {
      this.setData({ btnSubmitDisabled: true })
    }
    that.data.closeTimer = setTimeout(function () {
      that.setData({ focus: false });
    }, 2000);
  },
  // 果币活动详情查询
  getPrivilegeAmount: function () {
    let that = this;
    let storeInfo = wx.getStorageSync('selfLiftStore');
    var options = {
      header: {
        'X-DEFINED-appinfo': JSON.stringify({
          "channel": "miniprogram",   //渠道
          "model": "iPhone 6",
          "os": "iOS 10.1.1",
          "verName": "2.7.0.0",
          "deviceID": "35EAAF0C-D590-4F40-8F73-73735FDC02E5",
        })
      },
      // url: '/api/v1/customer/activity/queryActivityDetail/-1'
      url: '/api/v1/customer/activity/queryActivityDetail/' + storeInfo.storeID
    }
    console.log(options)
    commonObj.requestNewData(options, function (res) {
      console.log(res)
      if (res.data.errorCode == 0) {
        var couponAmountObj = res.data.data;
        console.log(couponAmountObj);
        let faArray = couponAmountObj;
        //充值数据排序；
        faArray.sort(function (a, b) {
          return a.rechargeAmount - b.rechargeAmount
        });
        if (faArray.length > 0) {
          for (let i = 0; i < faArray.length; i++) {
            let a = parseFloat(faArray[i].rechargeAmount) /100;
            let b = parseFloat(faArray[i].sendAmount) / 100;
            faArray[i].rechargeAmount = a;
            // faArray[i].sendAmount = parseFloat(b) / 100;
            
            if (faArray[i].couponCountType == 'B'){
              faArray[i].sendAmount = a * b;
            } else if (faArray[i].couponCountType == 'A'){
              faArray[i].sendAmount = b;
            }
            
          }
        }
        console.log(faArray);
        that.setData({ faArray: faArray });
      }
    }, '', function () {
      wx.hideLoading();
    });
  },
  // 用户果币查询
  getBalance: function (userId, userToken, token) {
    let params = { customerID: userId, userToken: userToken, "_appInfo": { "os": "wxApp" } };
    let that = this;
    let options = {
      encryptFlag: true,
      url: '/customerManager/getBalance',
      data: params
    };
    commonObj.requestData(options, function (res) {
      if (res.data.errorCode == -1002) {
        commonObj.loginExpired();
      } else if (res.data.errorCode == 0) {
        var balanceObj = JSON.parse(commonObj.Decrypt(res.data.data, token));
        console.log(balanceObj);
        that.setData({ balance: parseFloat(balanceObj.balance) / 100 });
      }
    }, '', function () {
      wx.hideLoading();
    });
  },
  //立即充值
  rechargeSubmit: function () {
    // 事件统计，充值按钮点击
    wx.reportAnalytics('deposit_click');
    var that = this;
    //果币充值接口。
    let user = wx.getStorageSync('user');
    let token = wx.getStorageSync('token');
    let storeInfo = wx.getStorageSync('selfLiftStore');
    
    if (!user || !this.data.recharge) {
      // wx.showToast({
      //   title: '请填写或选择充值金额',
      //   image: '../../../source/images/warn.png',
      //   duration: 1500,
      //   mask: true,
      // })
      that.setData({ btnSubmitDisabled: true })
      return;
    }
    wx.showLoading({
      title: '正在准备支付',
      mask: true
    })
    let userToken = user.userToken;
    var params = {
      customerID: user.userID,
      phoneNumber: user.phoneNumber,
      userToken: userToken,
      RMBAmount : this.data.recharge ? parseFloat(this.data.recharge) * 100 : 0,
      store: storeInfo.storeID 
    };
    let options = {
      encryptFlag: true,
      url: '/orderManager/deposit',
      data: params
    };
    commonObj.requestData(options, function (res) {
      if (res.data.errorCode == 0) {
        var depositObj = JSON.parse(commonObj.Decrypt(res.data.data, token));
        app.getUserInfo(function(){that.payRequest(user, token, depositObj)});
      } else {
        wx.hideLoading();
        wx.showToast({
          title: '对不起，调用支付失败。。。',
          duration: 2000
        })
      }
    }, function (res) {
      wx.hideLoading();
      wx.showToast({
        title: '对不起，调用支付失败。。。',
        duration: 2000
      })
    }, '');
  },
  // 请求发起支付接口
  payRequest: function (user, token, depositObj) {
    if (!wx.getStorageSync('wxSnsInfo')) {
      commonObj.showModal('提示', '账号异常，请联系管理员4001811212', false);
      return;
    }
    var that = this;
    let userToken = user.userToken;
    let deadDate = new Date(new Date().getTime() + 30 * 60 * 1000);
    var timeExpire = new Date(deadDate).Format("yyyyMMddHHmmss");
    let openid = wx.getStorageSync('wxSnsInfo').openid;
    console.log(depositObj);
    var params = {
      userToken: userToken,
      orderNo: depositObj.payOrderNumber,
      channel: 'wx_pub',
      totalFee: parseFloat(depositObj.rechargeAmount),
      clientIP: '127.0.0.1',
      subject: '果币充值',
      body: '百果园果币充值',
      timeExpire: timeExpire,
      openID: openid,
      newAccount: 'Y',
      requestTarget: 'wx_mini'
    };
    let options = {
      encryptFlag: false,
      url: '/miPayService/payRequest',
      data: params
    };
    console.log(options);
    commonObj.requestData(options, function (res) {
      wx.hideLoading();
      console.log(res);
      if (res.data.errorCode == 0) {
        var depositObj = res.data.data;
        wx.requestPayment({
          'timeStamp': depositObj.timeStamp,
          'nonceStr': depositObj.nonceStr,
          'package': depositObj.package,
          'signType': 'MD5',
          'paySign': depositObj.paySign,
          'success': function (res) {
            console.log('支付成功回调');
            // 事件统计，充值页面
            wx.reportAnalytics('deposit_success')
            console.log(res);
            that.setData({
              recharge: ''
            })
            that.getBalance(user.userID, user.userToken, token);
          },
          'fail': function (res) {
            console.log('支付失败回调');
            console.log(res);
            if (res.errMsg.indexOf('cancel') > -1) {
            } else {
              wx.showToast({
                title: '支付失败',
                icon: 'loading',
                duration: 2000
              })
            }

          },
          'complete': function (res) {
            console.log('支付回调完成');
          }
        })
      } else {
        console.log('支付失败，。。。');
        wx.showToast({
          title: '支付失败，请重试',
          duration: 2000
        })
      }
    }, function (res) {
      wx.hideLoading();
    }, '');
  },

  checkDetailInfo: function () {
    wx.reportAnalytics('balance_detail_click')    // 点击查看余额明细-v2.0
    this.preventEvent();
  },
  onShareAppMessage: function () {
    return {
      title: '拼的是好吃，团的是实惠',
      path: '/pages/fightGroups/index',
      success: function () {
        wx.reportAnalytics('share_success')
      },
      fail: function () {
        wx.reportAnalytics('share_fail')
      }
    }
  },
  preventEvent: function () {
    this.setData({ prevent: true });
    setTimeout(() => {
      this.setData({ prevent: false });
    }, 400)
  }
})
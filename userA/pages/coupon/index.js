// coupons  index
var wxbarcode = require('../../../source/js/codeImg/index.js');
var commonObj = require('../../../source/js/common').commonObj;
var bg_green = require('../../../source/image-base64/coupon_bg_green');
var bg_orange = require('../../../source/image-base64/coupon_bg_orange');
var bg_blue = require('../../../source/image-base64/coupon_bg_blue');
var bg_gray = require('../../../source/image-base64/coupon_bg_gray');
var bg_pop = require('../../../source/image-base64/coupon_bg_pop');
var bg_orange_small = require('../../../source/image-base64/coupon_bg_orange_small');
var bg_blue_small = require('../../../source/image-base64/coupon_bg_blue_small');
var app = getApp();
Page({
  data: {
    bg_green: bg_green.bg,
    bg_orange: bg_orange.bg,
    bg_blue: bg_blue.bg,
    bg_gray: bg_gray.bg,
    noCouponShowFlag: false,
    noCouponText: '未使用',
    couponStatus: '1', //1-未使用,2-已使用,3-已过期
    lastCouponId: '', //最后一张券的id,保存一下,以便上拉和下拉刷新用
    lastPullDir: '', //记录上一次是上拉还是下拉,用于上拉时清下拉时的数据
    noUseCouponList: [], //未使用券列表
    usedCouponList: [], //已使用券列表
    expiredCouponList: [],//已过期优惠券列表
    screenWidth: '',
    screenHeight: ''
  },
  onLoad: function (options) {
    var that = this;
    wx.showLoading({
      title: '加载中',
      mask: 'true'
    })
    wx.getSystemInfo({
      success: function (res) {
        that.setData({
          screenWidth: res.screenWidth,
          screenHeight: res.screenHeight
        })
      }
    });
    wx.setNavigationBarTitle({
      title: '优惠券'
    });
  },
  onShow: function () {
    if (!commonObj.checkLoginStatus('coupon')) {  // 判断是否登陆
      commonObj.showModal('提示', '您还未登陆哦，请先登陆~', true, '立即登陆', '', function (res) {
        if (res.confirm) {
          wx.setStorageSync('urlInfo', 'userA/pages/coupon'); //记录要跳转的页面
          app.globalData.activeFlag = false;
          app.getUserInfo(function () { commonObj.isBindCard() });
        } else if (res.cancel) {
          wx.switchTab({
            url: '/pages/index/index',
          })
        }
      })
    } else {
      // wx.showLoading({ title: '加载中' });
      this.setData({ noUseCouponList: [] });
      this.getCouponListByStatus('1', '', 'up');
    }
  },
  bindCouponTap: function (e) { //切换券类型,数据清空
    var that = this;
    var status = e.currentTarget.dataset.status;
    var eventAnalytics = ['coupon_notuse', 'coupon_used', 'coupon_expired'];
    wx.reportAnalytics(eventAnalytics[parseInt(status) - 1]);
    if (status == 1) {
      this.setData({ couponStatus: '1', noUseCouponList: [] })
    } else if (status == 2) {
      this.setData({ couponStatus: '2', usedCouponList: [] })
    } else {
      this.setData({ couponStatus: '3', expiredCouponList: [] })
    }
    // wx.showLoading({title: '加载中'});
    that.getCouponListByStatus(status, '', 'up'); //初始couponId为空,action默认down
  },

  getCouponListByStatus: function (status, couponID, action) { //获取相应的优惠券列表
    let that = this,
      user = wx.getStorageSync('user'),
      token = wx.getStorageSync('token');
    if (user && token) {
      var userId = user.userID;
      var userToken = user.userToken;
    }
    var options = {
      encryptFlag: true,
      url: '/customerManager/getCouponByStatus',
      data: {
        customerID: userId,
        userToken: userToken,
        couponStatus: status,
        count: 10,
        couponID: couponID || '',
        action: action || 'down',
        _appInfo: { "os": "wxApp", "verCode": '2.5.0.0', "verName": '2.5.0.0' }
      }
    }
    console.log(options);
    commonObj.requestData(options, function (res) {//token 15c0a14dbe700000
      console.log(res);
      wx.hideLoading();
      if (res.data.errorCode == -1002) {
        commonObj.loginExpired();
      } else if (res.statusCode == 200 && res.data.errorCode == 0 && res.data.data) {
        var data = commonObj.Decrypt(res.data.data, token);
        data = JSON.parse(data);
        console.log(data);

        if (action == 'up') {
          if (data && data.length > 0) {
            that.setData({
              noCouponShowFlag: false,
              lastCouponId: data[data.length - 1].couponID
            })
            if (status == 1) { //未使用
              if (that.data.lastPullDir == 'down') { that.setData({ noUseCouponList: [] }) }//上一次是下拉,清除数据
              var noUseCouponList = that.data.noUseCouponList;
              for (var i = 0; i < data.length; i++) {
                noUseCouponList.push(data[i]);
              }
              that.setData({
                noUseCouponList: noUseCouponList
              })
            } else if (status == 2) { //已使用
              if (that.data.lastPullDir == 'down') { that.setData({ usedCouponList: [] }) }//上一次是下拉,清除数据
              var usedCouponList = that.data.usedCouponList;
              for (var i = 0; i < data.length; i++) {
                usedCouponList.push(data[i]);
              }
              that.setData({
                usedCouponList: usedCouponList
              })
            } else if (status == 3) { //已过期
              if (that.data.lastPullDir == 'down') { that.setData({ expiredCouponList: [] }) }//上一次是下拉,清除数据
              var expiredCouponList = that.data.expiredCouponList;
              for (var i = 0; i < data.length; i++) {
                expiredCouponList.push(data[i]);
              }
              that.setData({
                expiredCouponList: expiredCouponList
              })
            }
          } else {
            if (status == 1 && that.data.noUseCouponList.length == 0) {
              that.setData({ noCouponShowFlag: true, noCouponText: '未使用' });
            } else if (status == 2 && that.data.usedCouponList.length == 0) {
              that.setData({ noCouponShowFlag: true, noCouponText: '已使用' });
            } else if (status == 3 && that.data.expiredCouponList.length == 0) {
              that.setData({ noCouponShowFlag: true, noCouponText: '已过期' });
            }
          }
        } else {
          if (data && data.length > 0) {
            that.setData({
              noCouponShowFlag: false,
              lastCouponId: data[data.length - 1].couponID
            });
            if (status == 1) {
              that.setData({ noUseCouponList: data })
            } else if (status == 2) {
              that.setData({ usedCouponList: data })
            } else if (status == 3) {
              that.setData({ expiredCouponList: data })
            }
          } else {
            if (status == 1 && that.data.noUseCouponList.length == 0) {
              that.setData({ noCouponShowFlag: true, noCouponText: '未使用' });
            } else if (status == 2 && that.data.usedCouponList.length == 0) {
              that.setData({ noCouponShowFlag: true, noCouponText: '已使用' });
            } else if (status == 3 && that.data.expiredCouponList.length == 0) {
              that.setData({ noCouponShowFlag: true, noCouponText: '已过期' });
            }
          }
        }
      }
    })
  },
  onPullDownRefresh: function () { //下拉刷新
    wx.stopPullDownRefresh();
    var status = this.data.couponStatus;
    this.setData({
      lastPullDir: 'down'
    });
    this.getCouponListByStatus(status, '', 'down');
  },
  onReachBottom: function () { //上拉刷新
    var status = this.data.couponStatus,
      couponId = this.data.lastCouponId;
    this.setData({
      lastPullDir: 'up'
    });
    this.getCouponListByStatus(status, couponId, 'up');
  },
  bindUseTap: function (e) {   // 绑定优惠券参数，点击试用，传参进优惠券详情页
    wx.reportAnalytics('coupon_use_btnclick');
    var that = this,
      couponType = e.currentTarget.dataset.coupontype,//2-门店专享,3-通用
      couponLimitValueStr = e.currentTarget.dataset.limitvaluestr,
      couponValue = e.currentTarget.dataset.couponvalue,
      couponName = e.currentTarget.dataset.couponname,
      couponCode = e.currentTarget.dataset.couponcode,
      couponWay = e.currentTarget.dataset.couponway;
    wx.navigateTo({
      url: '/userB/pages/barcode/index?couponType=' + couponType + '&couponValue=' + couponValue + '&couponLimitValueStr=' + couponLimitValueStr + '&couponName=' + couponName + '&couponCode=' + couponCode + '&couponWay=' + couponWay,
    })
  },
  onShareAppMessage: function () {
    return {
      title: '拼的是好吃，团的是实惠',
      path: '/pages/fightGroups/index',
      success: function () {
        wx.reportAnalytics('share_success');
      },
      fail: function () {
        wx.reportAnalytics('share_fail');
      }
    }
  }
})
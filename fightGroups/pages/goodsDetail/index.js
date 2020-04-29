// var cornermark_bg = require('../../../source/image-base64/cornermark_bg');
var bg_sandclock = require('../../../source/image-base64/bg_sandclock');
var bg_detail_priceinfo = require('../../../source/image-base64/detail_priceinfo');
var commonObj = require('../../../source/js/common').commonObj;
var app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    picUrl: commonObj.PAGODA_PIC_DOMAIN,
    // cornermark_bg: cornermark_bg.bg,
    bg_sandclock: bg_sandclock.bg,
    bg_detail_priceinfo: bg_detail_priceinfo.bg,
    indicatorDots: true,
    timeout: {},
    timeDate: {},
    endTimeDate: [],
    endTimeOut: {},
    ms: 9,
    countFlag: true,
    currentGroupShowFlag: true,
    moreGroupShowFlag: true, //拼团列表是否展示
    offStockFlag: false, //是否下架
    soldOutFlag: false,  //是否售罄
    tipsShow: false,
    picChange: '/source/images/icon_label_tick2.png',
    ct: 0 //倒计时方法中递归次数计次，实现排除本地时间影响的倒计时
  },
  onLoad: function (options) {
    var that = this;
    console.log(options);
    if (options && options.fightGroupsIndexObj) {
      var fightGroupsIndexObj = JSON.parse(options.fightGroupsIndexObj);
      that.setData({ goodsID: fightGroupsIndexObj.goodsID, activityID: fightGroupsIndexObj.activityID })
    } else if (options && options.PTorderDetailObj) {
      var PTorderDetailObj = JSON.parse(options.PTorderDetailObj);
      that.setData({ goodsID: PTorderDetailObj.goodsID, activityID: PTorderDetailObj.activityID })
    } else if (options && options.paySuccessObj) {
      var paySuccessObj = JSON.parse(options.paySuccessObj);
      that.setData({ goodsID: paySuccessObj.goodsID, activityID: paySuccessObj.activityID })
    } else if (options && options.bindCardObj) { //isBindCard登陆传过来的参数
      var bindCardObj = JSON.parse(options.bindCardObj);
      that.setData({ goodsID: bindCardObj.goodsID, activityID: bindCardObj.activityID })
    } else if (options && options.inviteFriendsObj) {
      var inviteFriendsObj = JSON.parse(options.inviteFriendsObj);
      that.setData({ goodsID: inviteFriendsObj.goodsID, activityID: inviteFriendsObj.activityID })
    } else if (options && options.twoDimenObj) { //管理台扫码进详情
      var twoDimenObj = JSON.parse(options.twoDimenObj);
      that.setData({ goodsID: twoDimenObj.goodsID, activityID: twoDimenObj.activityID })
      // that.setData({ goodsID: 13735, activityID: 118 })   
    }

    wx.showLoading({ title: '加载中' });
  },
  onShow: function () {
    var that = this;
    var isIphoneX = wx.getSystemInfoSync().model.indexOf('iPhone X') != -1 ? true : false;
    that.setData({
      isIphoneX: isIphoneX
    })
    var page = getCurrentPages();
    // console.log(page);
    if (that.data.showPayModal) {
      commonObj.showModal('确定要放弃支付吗？', '尚未完成支付，喜欢的果果可能会被抢空哦~', true, '继续支付', '暂时放弃', function (res) {
        if (res.confirm) {
          // 跳到确认订单
          var goodsDetailObj = { goodsID: (that.data.goodsDetailObj && that.data.goodsDetailObj.goodsID) || that.data.goodsID, activityID: that.data.activityID }
          wx.navigateTo({
            url: '/fightGroups/pages/PTorderDetail/index?goodsDetailObj=' + JSON.stringify(goodsDetailObj)
          })
        }
      })
      that.setData({
        showPayModal: ''
      })
    }
    console.log(that.data.goodsOrderID)
    if (that.data.goodsOrderID) {
      commonObj.showModal('温馨提醒', '您有一个未成团商品，邀请好友参团才能大大提高成团率哦~', true, '邀请好友', '关闭', function (res) {
        wx.reportAnalytics("paybacksharetipsbtn")  //支付后返回页tipsBtn v1.4
        if (res.confirm) {
          // 分享
          wx.navigateTo({
            url: '/pages/fightGroups/paySuccess/index?payOrderIDorGoodsOrderID=' + that.data.goodsOrderID
          })
        }
      })
      that.setData({
        showShareObj: ''
      })
    }

    this.setData({ countFlag: true, currentGroupShowFlag: false, offStockFlag: false, soldOutFlag: false }); //计时器打开
    if (!wx.getStorageSync('selfLiftStore') || !wx.getStorageSync('city')) { //以防分享进来的没有去定位
      app.getCityName(function () { that.getCityAndStoreInfo(that.data.goodsID, that.data.activityID) });
    } else {
      this.getGoodsDetail(this.data.goodsID, this.data.activityID)
    }
  },
  getCityAndStoreInfo: function (goodsID, activityID) {
    var that = this;
    var userCurrLoca = wx.getStorageSync('userCurrLoca');
    var options = {
      encryptFlag: false,
      url: '/api/v1/groupBuy/homepage',
      data: {
        cityName: userCurrLoca.cityName,
        lon: userCurrLoca.location.lng,
        lat: userCurrLoca.location.lat,
        storeID: '' || (wx.getStorageSync('selfLiftStore') && wx.getStorageSync('selfLiftStore').storeID)
      }
    }
    commonObj.requestData(options, function (res) {
      console.log(res)
      if (res.data.errorCode == 0) {
        var store = res.data.data.store;
        var city = res.data.data.city;
        if (city) {
          if (store != null) {
            wx.setStorageSync('city', { cityID: city.cityID, cityName: city.cityName });//保存城市信息
            wx.setStorageSync('selfLiftStore', store)
            that.getGoodsDetail(goodsID, activityID)
          } else {
            commonObj.showModal('提示', '您附近没有拼团门店', false, '我知道了', '', function (res) {
              wx.switchTab({
                url: '/pages/fightGroups/index/index',
              })
            })
          }
        } else {
          commonObj.showModal('提示', '该城市还未开通百果园服务', false, '我知道了', '', function (res) {
            wx.switchTab({
              url: '/pages/fightGroups/index/index',
            })
          })
        }
      } else {
        commonObj.showModal('提示', '系统繁忙，出现异常,请稍后重新请求。异常错误信息：' + res.data.errorMsg, false, '确认', '', function () {
          wx.switchTab({
            url: '/pages/fightGroups/index/index'
          })
        })
      }
    })
  },
  getGoodsDetail: function (goodsID, activityID) {  //v1.4
    var that = this;
    var user = wx.getStorageSync('user');
    var options = {
      encryptFlag: false,
      // url: '/groupGoods/queryGoodsDetail',
      url: '/api/v1/groupBuy/goods/detail',
      header: {
        "X-DEFINED-appinfo": JSON.stringify({
          "deviceID": "35EAAF0C-D590-4F40-8F73-73735FDC02E5",
          "os": "iOS 10.3.1",
          "model": "Simulator",
          "channel": "miniprogram",
          "verName": "2.5.1.0"
        }),
        "userToken": user.userToken
      },
      data: {
        activityID: activityID,
        goodsID: goodsID,
        cityID: wx.getStorageSync('city').cityID,
        storeID: wx.getStorageSync('selfLiftStore').storeID
      }
    }
    console.log(options);
    commonObj.requestData(options, function (res) {
      console.log("res");
      console.log(res);
      wx.hideLoading();
      if (res.data.errorCode == 0) {
        that.setData({
          currTime: res.data.systemTime        // 服务器当前时间
        })
        var goodsDetailObj = res.data.data;
        goodsDetailObj.groupPriceArr = String((goodsDetailObj.groupPrice / 100).toFixed(2)).split('.');
        goodsDetailObj.originalPrice = (goodsDetailObj.originalPrice / 100).toFixed(2);
        goodsDetailObj.groupPrice = (goodsDetailObj.groupPrice / 100).toFixed(2);
        that.setData({ goodsDetailObj: goodsDetailObj })
        console.log(that.data.goodsDetailObj.currentGroupList)

        console.log('endTime:' + goodsDetailObj.endTime)
        that.countActivityEndTime(that.data.goodsDetailObj.endTime);
        
        if (!goodsDetailObj.goodsID) { //果果下架
          that.setData({ offStockFlag: true })
          commonObj.showModal('提示', '果果停售啦，趁机试试别的口味喽~', false, '', '', function () {
            wx.switchTab({
              url: '/pages/fightGroups/index'
            })
          });
        } else if (goodsDetailObj.stockNum === 0) { //果果售罄
          that.setData({ soldOutFlag: true })
          commonObj.showModal('提示', '果果卖光了，给其他水果一个机会啦~', false, '', '', function () {
            wx.switchTab({
              url: '/pages/fightGroups/index'
            })
          });
        } else if (that.data.goodsDetailObj.currentGroupList) {
          if (that.data.goodsDetailObj.currentGroupList.length == 0) {
            console.log('moreGroupShowFlag')
            that.setData({ currentGroupShowFlag: false, moreGroupShowFlag: false })
            that.setData({ currentGroupList: that.data.goodsDetailObj.currentGroupList })
            return;
          }
          if (that.data.goodsDetailObj.currentGroupList.length >= 2) { //大于2个才显示
            that.setData({ showMoreFlag: true })
          } else if (that.data.goodsDetailObj.currentGroupList.length > 0) {
            that.setData({ showMoreFlag: false })
          }
          that.data.goodsDetailObj.currentGroupList.forEach(function (item, index) {
            that.countTime(item.expireTime, item.groupID);
          })
        }

        // that.countActivityEndTime(goodsDetailObj.endTime);
        // that.countActivityEndTime("2018-03-15 10:00:00");
        var enableJoin = goodsDetailObj.enableJoin === 'Y'
        that.setData({
          enableJoin: enableJoin
        })
      } else {
        commonObj.showModal('提示', '系统繁忙，出现异常,请稍后重新请求。异常错误信息：' + res.data.errorMsg, false, '确认', '', function () {
          wx.switchTab({
            url: '/pages/fightGroups/index/index'
          })
        })
      }
    }, '', function () {

      that.setData({
        isReady: true
      })
    })
  },
  countTime: function (expireTime, index) {
    var that = this;
    if (!that.data.countFlag) return;
    var expireTime = expireTime.replace(/-/g, '/');
    var leftTime = parseInt((parseInt(new Date(expireTime).getTime()) - parseInt(new Date().getTime())) / 1000);
    if (leftTime <= 0) {
      that.data.timeDate[index] = "00:00:00";
      that.setData({ timeDate: that.data.timeDate })
    } else {
      var hours = parseInt(leftTime / 3600);
      var minute = parseInt(parseInt(leftTime / 60) - hours * 60);
      var second = parseInt(leftTime % 60);
      var hour = hours < 10 ? ("0" + hours) : hours;
      var min = minute < 10 ? ("0" + minute) : minute;
      var sec = second < 10 ? ("0" + second) : second;
      that.data.timeout['timer' + index] = setTimeout(function () {
        that.countTime(expireTime, index);
      }, 1000);

      that.data.timeDate[index] = hour + ":" + min + ":" + sec;
      that.setData({ timeDate: that.data.timeDate })
    }
  },
  countActivityEndTime: function (endTime, duration) {
    var that = this;
    if (!that.data.countFlag) return;
    var endTime = endTime.replace(/-/g, '/');
    let currTime = duration ? (that.data.currTime - (-duration)) : that.data.currTime
    var leftTime = parseInt((parseInt(new Date(endTime).getTime()) - currTime) / 1000);
    if (leftTime <= 0) {
      that.data.endTimeDate = "00:00:00:00";
      that.setData({ endTimeDate: that.data.endTimeDate })
    } else {
      var days = parseInt(leftTime / (24 * 3600));
      var hours = parseInt(parseInt(leftTime / 3600));
      var hourShow = parseInt(parseInt(leftTime / 3600))
      var minute = parseInt(parseInt(leftTime / 60) - hours * 60);
      var second = parseInt(leftTime % 60);
      var day = days < 10 ? ("0" + days) : days;
      var hour = hours < 10 ? ("0" + hours) : hours;
      var min = minute < 10 ? ("0" + minute) : minute;
      var sec = second < 10 ? ("0" + second) : second;
      that.data.ms < 1 ? that.setData({ ms: 9 }) : that.data.ms--;
      that.data.endTimeout = setTimeout(function () {
        that.data.ct++
        that.countActivityEndTime(endTime, that.data.ct * 100);
      }, 100);
      that.data.endTimeDate = (day + ":" + hourShow + ":" + min + ":" + sec).split(":");
      that.setData({ endTimeDate: that.data.endTimeDate });
      that.setData({ ms: that.data.ms })
    }
  },
  // joinGroup: function () { //参团
  //   var that = this;
  //   that.preventEvent();
  //   if (!commonObj.checkLoginStatus('goodsDetail')) {
  //     commonObj.showModal('提示', '您还未登陆哦，请先登陆~', true, '立即登陆', '', function (res) {
  //       if (res.confirm) {
  //         commonObj.getUserSetting();
  //         wx.setStorageSync('urlInfo', 'fightGroups/goodsDetail'); //记录要跳转的页面
  //         app.globalData.activeFlag = false;
  //         app.getUserInfo(function(){commonObj.isBindCard('', { goodsID: that.data.goodsID })});
  //       } else if (res.cancel) {

  //       }
  //     })
  //     return;
  //   }
  //   wx.reportAnalytics('joingroup_detail');
  //   if (!that.data.goodsDetailObj.currentGroupList) return;
  //   that.setData({ currentGroupShowFlag: true })
  // },
  showGroup: function () {
    wx.reportAnalytics("seemorejoinbtn")   //查看更多凑团btn v1.4
    this.setData({ currentGroupShowFlag: true })
  },
  toIndex: function () {
    wx.reportAnalytics("backhomebtn")       //去首页btn v1.4
    wx.switchTab({
      url: '/pages/fightGroups/index'
    })
  },
  bindCloseTap: function () { //参团关闭
    this.setData({ currentGroupShowFlag: false })
  },
  openGroup: function () { //开团
    wx.reportAnalytics("creatgroupbtn")   //一键开团btn v1.4
    var that = this;
    that.preventEvent();
    if (!commonObj.checkLoginStatus('goodsDetail')) {
      commonObj.showModal('提示', '您还未登陆哦，请先登陆~', true, '立即登陆', '', function (res) {
        if (res.confirm) {
          wx.setStorageSync('urlInfo', 'fightGroups/pages/PTorderDetail'); //记录要跳转的页面
          app.globalData.activeFlag = false;
          app.getUserInfo(function () { commonObj.isBindCard('', { goodsID: that.data.goodsID, activityID: that.data.activityID }) });
        } else if (res.cancel) {

        }
      })
      return;
    }
    wx.reportAnalytics('opengroup_detail');
    var goodsDetailObj = { goodsID: (that.data.goodsDetailObj && that.data.goodsDetailObj.goodsID) || that.data.goodsID, activityID: that.data.activityID }
    wx.navigateTo({
      url: '/fightGroups/pages/PTorderDetail/index?goodsDetailObj=' + JSON.stringify(goodsDetailObj)
    })
  },
  bindCanTuan: function (e) {
    wx.reportAnalytics('cantuanbtn_click');
    var that = this;
    that.preventEvent();
    if (!commonObj.checkLoginStatus('goodsDetail')) {
      commonObj.showModal('提示', '您还未登陆哦，请先登陆~', true, '立即登陆', '', function (res) {
        if (res.confirm) {
          wx.setStorageSync('urlInfo', 'fightGroups/pages/goodsDetail'); //记录要跳转的页面
          app.globalData.activeFlag = false;
          app.getUserInfo(function () { commonObj.isBindCard('', { goodsID: that.data.goodsID, activityID: that.data.activityID }) });
        } else if (res.cancel) {

        }
      })
      return;
    }
    var groupId = e.currentTarget.dataset.groupid;
    var openerID = e.currentTarget.dataset.openerid;
    var goodsDetailObj = { goodsID: that.data.goodsDetailObj.goodsID, groupID: groupId, openerID: openerID, isJoin: true, activityID: that.data.activityID }
    console.log(JSON.stringify(goodsDetailObj));
    wx.navigateTo({
      url: '/fightGroups/pages/PTorderDetail/index?goodsDetailObj=' + JSON.stringify(goodsDetailObj)
    })
  },
  showTips: function () { //显示模板
    wx.reportAnalytics("goodsbrandclick")  //商品品牌信息点击 v1.4
    var animation = wx.createAnimation({
      duration: 200,
      timingFunction: "linear",
      delay: 0
    })
    this.animation = animation
    animation.translateY(800).step()
    this.setData({
      animationData: animation.export(),
      tipsShow: true
    })
    setTimeout(function () {
      animation.translateY(0).step()
      this.setData({
        animationData: animation.export()
      })
    }.bind(this), 200)
  },
  hideTips: function () { //隐藏模板
    var animation = wx.createAnimation({
      duration: 200,
      timingFunction: "linear",
      delay: 0
    })
    this.animation = animation
    animation.translateY(800).step()
    this.setData({
      animationData: animation.export(),
    })
    setTimeout(function () {
      animation.translateY(0).step()
      this.setData({
        animationData: animation.export(),
        tipsShow: false
      })
    }.bind(this), 200)
  },
  onHide: function () {
    this.setData({ countFlag: false }) //停止计时
  },
  onUnload: function () {
    this.setData({ countFlag: false }) //停止计时
  },
  onShareAppMessage: function () {
    wx.reportAnalytics("goodssharebtn") //商品详情分享btn v1.4
    var that = this;
    var fightGroupsIndexObj = { goodsID: that.data.goodsID, activityID: that.data.activityID }
    return {
      title: that.data.goodsDetailObj.groupShareTitle || '拼的是好吃，团的是实惠',
      path: '/fightGroups/pages/goodsDetail/index?fightGroupsIndexObj=' + JSON.stringify(fightGroupsIndexObj),
      imageUrl: that.data.picUrl + that.data.goodsDetailObj.groupSharePic || '/source/images/pintuanpeitu.png',
      success: function () {
        wx.reportAnalytics('share_success')
      },
      fail: function () {
        wx.reportAnalytics('share_fail')
      }
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
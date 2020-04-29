// fightGroups/pages/inviateFriend/index.js
var commonObj = require('../../../source/js/common').commonObj;
var QQMapWX = require('../../../source/js/qqmap-wx-jssdk.min.js');
var pintuanuser = require('../../../source/image-base64/pintuanuser');
var picUrl = commonObj.PAGODA_PIC_DOMAIN;
var bgKpi = require('../../../source/image-base64/bg_kpi');
var status = { 'PROCESS': '拼团中', 'SUCCESS': '拼团成功', 'FAILED': '拼团失败' }
var timeDown = null;
var app = getApp()
Page({
	/**
	 * 页面的初始数据
	 */
  data: {
    bg_pintuan: pintuanuser.bg,
    layh: '00',
    laym: '00',
    lays: '00',
    isOver: false,
    isFull: false,
    flag: false,
    tipsShow: false,
    picChange: '/source/images/icon_label_tick2.png'
  },

	/**
	 * 生命周期函数--监听页面加载
	 */
  onLoad: function (options) {
    let that = this;
    var obj;
    console.log(options)
    if (options && options.paySuccessObj){
      obj = JSON.parse(options.paySuccessObj);
    } else if (options && options.bindCardObj) {
      obj = JSON.parse(options.bindCardObj);
    } else if (options && options.myAllOrderObj) {
      obj = JSON.parse(options.myAllOrderObj);
    }

    console.log(obj)
    if (commonObj.checkLoginStatus('inviteFriends')) {
      var userID = wx.getStorageSync('user').userID;
      if (obj && (userID == obj.userId)) {
        var groupLobj = JSON.stringify({ goodsOrderID: obj.goodsOrderID, orderStatus: 'SUCCESS' })
        wx.redirectTo({
          url: '/fightGroups/pages/PTorderDetail/index?groupLeaderObj=' + groupLobj,
        })
      } else {
        wx.showLoading({
          title: '加载中...',
          mask: true
        })
        app.getCityName(function () { that.getHomePageInfo() })
        that.getOrderDetailInfo(obj.goodsOrderID, obj.userId, obj.userToken);
        that.setData({ obj: obj, flag: true })
      }
    } else {
      wx.setStorageSync('urlInfo', 'fightGroups/pages/inviteFriends'); //记录要跳转的页面
      app.globalData.activeFlag = false;
      app.getUserInfo(function () { commonObj.isBindCard('', obj) });
    }
    // that.getHomePageInfo();
    // 先判断有没有城市定位或者定位附近有无门店。若有就走正常流程，若无则点参加活动，开个新团等 按钮跳转首页的缺省页

    // that.getOrderDetailInfo(79902057703, 103306450, '32492EA49F2C7E8A42BC247721BA3074852DAE963211FE304355494B12DCB09D');
  },
	/**
	 * 生命周期函数--监听页面显示
	 */
  onShow: function () {
    var that = this;
    if(!that.data.flag){
      that.data.obj && that.getOrderDetailInfo(that.data.obj.goodsOrderID, that.data.obj.userId, that.data.obj.userToken);
    }

  },
  onHide: function () {
    this.setData({
      clearTimeDown: true,
      flag: false
    })
  },
  onUnload: function () {
    this.setData({
      clearTimeDown: true
    })
  },

  // goodsOrderID->订单id   userId->用户customerId
  getOrderDetailInfo: function (goodsOrderID, userID, userToken) {
    console.log('通过订单号获取开团信息和商品信息')
    let that = this;
    var options = {
      header: {
        'X-DEFINED-appinfo': JSON.stringify({
          "channel": "UAT\U6e20\U9053",   //渠道
          "model": "iPhone 6",
          "os": "iOS 10.1.1",
          "verName": "2.4.0.0",
          "deviceID": "35EAAF0C-D590-4F40-8F73-73735FDC02E5",
        }),
        "userToken": userToken
      },
      data: {
        customerID: userID,
        goodsOrderID: goodsOrderID       // 订单ID
      },
      url: '/api/v1/groupBuy/goodsOrderDetail'     // 查询商品订单详情(已支付)&投诉退款详情
     
    }
    console.log(options);
    commonObj.requestData(options, function (res) {
      console.log(res);
      if (res.data && res.data.errorCode == 0) {
        let data = res.data.data;
        let groupInfo = data.groupInfo;
        let saleInfo = data.goodsList[0];
        let groupMemberList = groupInfo.groupMemberList;  // 参团人，然后按参团顺序返回   
        if (groupInfo.status == 'SUCCESS') {   // 团已满
          wx.reportAnalytics('invitefriends_groupfull');
          that.setData({ isFull: true })
        } else if (groupInfo.status == 'FAILED') {    // 团结束
          wx.reportAnalytics('invitefriends_groupover');
          that.setData({ isOver: true })
        } else {
          wx.reportAnalytics('invitefriends_groupprocess');  // 团在进行中
        }

        let yuan = parseInt(saleInfo.groupPrice / 100)
        let fen = ((saleInfo.groupPrice / 100).toFixed(2) + '').slice(-2);
        saleInfo.originalPrice = (saleInfo.originalPrice / 100).toFixed(2);
        if (groupInfo.status == 'PROCESS') {
          that.countDown(groupInfo.expireTime);
        }
        var num = groupInfo.groupSize - groupInfo.currentCount;
        for (var x = 0; x < num; x++) {
          groupMemberList.push({});
        }
        let obj = {
          bgkpi: bgKpi.bg,
          goodsName: saleInfo.goodsName,
          subTitle: saleInfo.subTitle,
          spec: saleInfo.spec,
          price: [yuan, fen],
          oriPrice: saleInfo.originalPrice,
          pic: picUrl + saleInfo.headPic,                    // 商品图片url
          groupSize: groupInfo.groupSize,
          diff: groupInfo.groupSize - groupInfo.currentCount,
          show: true
        }
        that.setData({
          obj: obj,
          groupID: groupInfo.groupID,
          openerID: groupInfo.openerID,
          goodsID: saleInfo.goodsID,
          activityID: saleInfo.activityID,
          groupMemberList: groupMemberList
        })
      }
    }, '', function () {
      wx.hideLoading()
      that.setData({ isReady: true })
    })
  },

  // 倒计时 邀请好友-未成团
  countDown: function (expireTime) {        // 参数：过期时间，真假团单
    let that = this, eTime;
    let layTime = Math.round((new Date(expireTime.replace(/-/g, '/')).getTime() - new Date().getTime()) / 1000);         // 剩余时间秒数
    timeDown = setTimeout(function () {
      // console.log('大于0' + layTime)
      if (layTime < 0) {
        console.log('小于0' + layTime)
        clearInterval(timeDown)
        that.setData({
          layh: '00',
          laym: '00',
          lays: '00',
        })
        timeDown = null;
        that.setData({ isOver: true })
        return;
      }
      let h = parseInt(layTime / 3600);
      let m = parseInt(layTime / 60 - h * 60);
      let s = parseInt(layTime % 60);

      s = s < 10 ? '0' + s : s;
      m = m < 10 ? '0' + m : m;
      h = h < 10 ? '0' + h : h;
      that.setData({
        layh: h,
        laym: m,
        lays: s,
      })
      if (that.data.clearTimeDown) {
        return;
      } else {
        that.countDown(expireTime)
      }
    }, 1000)
  },

  // 链接跳转
  navigatePT: function () {
    this.preventEvent();
    let store = wx.getStorageSync('selfLiftStore');
    console.log('navigatePT')
    console.log(store)
    if (store) {
      wx.reportAnalytics('invitefriends_joingroupbtn');
      var obj = {
        groupID: this.data.groupID,
        openerID: this.data.openerID,
        goodsID: this.data.goodsID,
        activityID: this.data.activityID,
        isJoin: true,
      }
      if (commonObj.checkLoginStatus('PTorderDetail')) {
        wx.navigateTo({
          url: '/fightGroups/pages/PTorderDetail/index?inviteFriendsObj=' + JSON.stringify(obj),
        })
      } else {
        wx.setStorageSync('urlInfo', 'fightGroups/pages/PTorderDetail'); //记录要跳转的页面
        app.globalData.activeFlag = false;
        app.getUserInfo(function () { commonObj.isBindCard('', obj) });
      }
    } else {
      wx.reportAnalytics('invitefriends_citynostore');
      wx.switchTab({
        url: '/pages/fightGroups/index',
      })
    }
  },
  showTips: function () { //显示模板
    wx.reportAnalytics("join_groupbuyguidbtn")     //参团页拼团玩法btn v1.4
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
  naviagteFightGroup: function () {
    wx.reportAnalytics('invitefriends_opengroupbtn');
    wx.switchTab({
      url: '/pages/fightGroups/index',
    })
    this.preventEvent();
  },
  navigateGoodsDetail: function () {
    wx.reportAnalytics("join_groupgoodclick")    //参团页拼团商品click v1.4
    let obj = JSON.stringify({ goodsID: this.data.goodsID, activityID: this.data.activityID})   // 增加了一个商品详情
    wx.navigateTo({
      url: '/fightGroups/pages/goodsDetail/index?inviteFriendsObj=' + obj,
    })
  },
  getHomePageInfo: function () {        //获取拼团列表
    var that = this;
    var userCurrLoc = wx.getStorageSync('userCurrLoca');
    var selfLiftStore = wx.getStorageSync('selfLiftStore');
    var city = wx.getStorageSync('city');
    var options = {
      encryptFlag: false,
      url: '/api/v1/groupBuy/homepage',
      data: {
        cityName: city.cityName || userCurrLoc.cityName,
        lon: selfLiftStore.lon || userCurrLoc.location.lng,
        lat: selfLiftStore.lat || userCurrLoc.location.lat,
        storeID: '' || (wx.getStorageSync('selfLiftStore') && wx.getStorageSync('selfLiftStore').storeID)
      }
    }
    console.log(options);
    commonObj.requestData(options, function (res) {
      console.log(res)
      // wx.hideLoading();
      if (res.data.errorCode == 0) {
        var goodsList = res.data.data.goodsList;
        var store = res.data.data.store
        that.formatGroupPrice(goodsList);
        if (store != null) {
          wx.setStorageSync('selfLiftStore', store)
        }
        that.setData({ 
          isReady: true,
          isRecommend: goodsList.length > 0? true: false
          })
      }
    })
  },
  formatGroupPrice: function (goodsList) { //格式化拼团价格
    var that = this;
    for (var item in goodsList) {
      goodsList[item].groupPrice = String((goodsList[item].groupPrice / 100).toFixed(2)).split('.');
      goodsList[item].price = (goodsList[item].price / 100).toFixed(2);
    }
    that.setData({ goodsList: goodsList })
  },
  // 跳转商品详情  新增组件里的东西
  naviagteGoodsDetail: function (e) {
    console.log(e);
    var obj = JSON.stringify({
      goodsID: e.detail.goodsID,
      activityID: e.detail.activityID
    })
    wx.navigateTo({
      url: '/fightGroups/pages/goodsDetail/index?paySuccessObj=' + obj,
    })
  },
  backHomeBtn: function () {
    wx.switchTab({
      url: '/pages/fightGroups/index',
    })
  },
  // 蒙层
  preventEvent: function () {
    this.setData({ prevent: true });
    setTimeout(() => {
      this.setData({ prevent: false });
    }, 400)
  }, 
  recommandNavigate () {
    wx.reportAnalytics("join_recommendgoodclick")  //参团页推荐商品click v1.4	
  }
})
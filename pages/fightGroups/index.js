var cornermark_bg = require('../../source/image-base64/cornermark_bg');
var btn_pay_bg = require('../../source/image-base64/btn_pay_bg');
var common = require('../../source/js/common');
var coordtransform = require('../../utils/coordUtil');
require('../../utils/util');
var commonObj = common.commonObj;
var app = getApp();
Page({
  data: {
    picUrl: commonObj.PAGODA_PIC_DOMAIN,
    cornermark_bg: cornermark_bg.bg,
    btn_pay_bg: btn_pay_bg.bg,
    scrollTop: 0,
    callCount: 0,
    cityNoStore: false
  },
  onLoad: function (options) {
    wx.showLoading({ title: '加载中', mask: true })
  },
  onShow: function (options) {  //定位放在这里，以防用户未授权的情况再去授权，需要重新定位 
    var that = this;
    if (that.data.storeObj) {
      var cityName = that.data.storeObj.cityName;
      var req = {
        lng: that.data.storeObj.lon,
        lat: that.data.storeObj.lat
      }
      that.getGroupList(cityName, req)
    } else {
      wx.getSystemInfo({
        success: function (res) {
          var system = res.system;
          var version = res.version.split('.');
          var flag = parseInt(version[0]) <= 6 && parseInt(version[1]) <= 5 && parseInt(version[2]) < 8 ? true : false;
          if (flag) {
            commonObj.showModal('提示', '当前微信版本过低，请升级到最新微信版本后重试。', false)
            return;
          }
          app.getCityName(function(){that.getGroupList()});
        }
      });
    }
  },

  getGroupList:function(cityName,req){ //获取拼团列表
    var that = this;
    var userCurrLoc = wx.getStorageSync('userCurrLoca');
    var selLoc = {
      cityName: wx.getStorageSync('city').cityName,
      lat: wx.getStorageSync('selfLiftStore').lat,
      lon: wx.getStorageSync('selfLiftStore').lon
    }
    var options = {
      encryptFlag: false,
      // url: '/groupGoods/queryGoodsList',
      url: '/api/v1/groupBuy/homepage',
      data: {
        cityName: cityName || selLoc.cityName || userCurrLoc.cityName,
        lon: (req && req.lng) || selLoc.lon || userCurrLoc.location.lng,
        lat: (req && req.lat) || selLoc.lat ||  userCurrLoc.location.lat,
        storeID:  '' || (wx.getStorageSync('selfLiftStore') && wx.getStorageSync('selfLiftStore').storeID)
      }
    }
    console.log(options);
    commonObj.requestData(options, function (res) {
      console.log(res)
      wx.hideLoading();
      if (res.data.errorCode == 0) {
        console.log(res.data.data)
        var goodsList = res.data.data.goodsList;
        var store = res.data.data.store;
        var city = res.data.data.city;
        wx.setStorageSync('city', { cityID: city.cityID, cityName: city.cityName });//保存城市信息
        if (store){
          let ifpintuanstore = goodsList.length > 0 ? "haspintuanstore" : "nopintuanstore"
          wx.reportAnalytics(ifpintuanstore)  //定位有拼团门店v1.4
          if (store != null) {
            wx.setStorageSync('selfLiftStore', store)
          }
          that.formatGroupPrice(goodsList);
          that.setData({ store: store, isReady: true })
        }else{
          wx.reportAnalytics("noservicestore")  //定位城市无服务门店v1.4
          that.setData({
            cityNoStore: true,
            isReady: true
          })
          that.callNearStore();
        }    
      }
    })
  },
  formatGroupPrice: function (goodsList) { //格式化拼团价格
    var that = this;
    for (var item in goodsList) {
      goodsList[item].groupPrice = String((goodsList[item].groupPrice / 100).toFixed(2)).split('.');
      goodsList[item].price = (goodsList[item].price / 100).toFixed(2);
    }
    that.setData({ goodsList: goodsList || '' })
  },
  navigateToDetail: function (e) {  //详情页 + activityID v1.4
    this.preventEvent();
    wx.reportAnalytics('goodspic_click');
    var id = e.currentTarget.dataset.id;
    var activityID = e.currentTarget.dataset.activityid
    var fightGroupsIndexObj = { goodsID: id, activityID: activityID };
    this.recordsPintuan(activityID);
    wx.navigateTo({
      url: '/fightGroups/pages/goodsDetail/index?fightGroupsIndexObj=' + JSON.stringify(fightGroupsIndexObj)
    })
  },
  toDetailPage: function (e) { //开团点击 + activityID v1.4
    this.preventEvent();
    wx.reportAnalytics('opengroup_index_click');
    var id = e.currentTarget.dataset.id;
    var activityID = e.currentTarget.dataset.activityid
    var fightGroupsIndexObj = { goodsID: id, activityID: activityID };
    this.recordsPintuan(activityID);
    wx.navigateTo({
      url: '/fightGroups/pages/goodsDetail/index?fightGroupsIndexObj=' + JSON.stringify(fightGroupsIndexObj)
    })
  },
  toSelfLiftStore: function () { //自提门店
    this.preventEvent();
    wx.reportAnalytics('selfliftstore_click');
    wx.navigateTo({
      url: '/fightGroups/pages/selfExtractStore/index'
    })
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
  callNearStore: function () {  //周边召唤开店数量 v1.4
    let that = this;
    let userCurrLoca = wx.getStorageSync('userCurrLoca');
    var options = {
      data: {
        "lon": userCurrLoca.location.lng,
        "lat": userCurrLoca.location.lat
      },
      url: '/groupStore/callCount'
    }
    commonObj.requestData(options, function (res) {
      console.log(res);
      if (res.data.errorCode == 0) {
        let callCount = res.data.data;
        that.setData({
          callCount: callCount,
          isReady: true
        })
      }
    })
  },
  callBGY: function () {   // 召唤百果园 v1.4
    wx.reportAnalytics("callstore") //"我也来召唤"btnv1.4
    let that = this;
    let openId = wx.getStorageSync('wxSnsInfo').openid;
    let userCurrLoca = wx.getStorageSync('userCurrLoca');
    let cityId = wx.getStorageSync('city').cityID
    var options = {
      data: {
        "lon": userCurrLoca.location.lng,
        "lat": userCurrLoca.location.lat,
        "wxOpenID": openId,
        "cityID": cityId
      },
      url: '/groupStore/call'
    }
    console.log(options)
    commonObj.requestData(options, function (res) {
      console.log(res);
      if(res.data.errorCode == 0){
        // 弹窗，召唤门店成功
        // commonObj.showModal('提示', '召唤门店成功', false)
        wx.showToast({
          title: '已召唤成功！',
          icon: 'success'
        })
        that.callNearStore();
        that.setData({
          disable: true,
          isReady: true
        })
      }else if(res.data.errorCode == 30012){
        // 已在该点召唤过门店
        // commonObj.showModal('提示', '已在该点申请开店', false)
        wx.showToast({
          title: '大王，已召唤过了~',
          icon: 'none'
        })
        that.setData({
          disable: true,
          isReady: true
        })
      }
    })
  },
  navigateselfExtractStore: function (e) { // 跳转门店列表 v1.4
    if(e.currentTarget.dataset.type && e.currentTarget.dataset.type == "noGoods"){
      wx.reportAnalytics("changestorebtn") //"切换门店试试"btnv1.4
    }
    else{
      wx.reportAnalytics("changecityorstore") //顶部门店地址按钮v1.4
    }

    wx.navigateTo({
      url: '/fightGroups/pages/selfExtractStore/index',
    })
  },
  recordsPintuan: function (activityID) {     // 记录拼团活动浏览次数 v1.4
    let user = wx.getStorageSync('user')
    let openId = wx.getStorageSync('wxSnsInfo').openid
    var options = {
      header: {
        "X-DEFINED-appinfo": JSON.stringify({
          "deviceID": "35EAAF0C-D590-4F40-8F73-73735FDC02E5",
          "os": "iOS 10.3.1",
          "model": "Simulator",
          "channel": "miniprogram",
          "verName": "2.5.1.0"
        }),
        "userToken": user.userToken,
      },
      url: '/api/v1/groupBuy/statistics/recordBrowsingCount',
      data: {
        groupActivityId: activityID,
        wxOpenId: openId
      }
    }
    commonObj.requestData(options, function (res) {  
      console.log(res);
    })
  },
  // 蒙层
  preventEvent: function () {
    this.setData({ prevent: true });
    setTimeout(() => {
      this.setData({ prevent: false });
    }, 400)
  }
})
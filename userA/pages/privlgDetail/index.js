// pages/user/privlgDetail/index.js
var commonObj = require('../../../source/js/common').commonObj;
Page({
  data: {
    titleArr:['会员专享价','App瞬间退款','积分商城专区','充值返现','升级券包','生日特权','专享活动','专享券包'],
    imgArr: ['/source/images/icon-zhuanxiangjia.png', '/source/images/icon-tuikuan.png','/source/images/icon-jifen.png',
      '/source/images/icon-chongzhi.png', '/source/images/icon-coupon.png', '/source/images/icon-birthday.png', '/source/images/icon-sale.png','/source/images/icon-gift.png'],
    currentLegal:0,
    monthReceiveStatus:'' //月度礼包领取状态 0领取成功，1已领取，2不可领取
  },
  onLoad: function (options) {
    var that = this;
    if(options && options.privlgDetailObj){
      var privlgDetailObj = options.privlgDetailObj;
      var privlgDetailObj = JSON.parse(privlgDetailObj),
        currentLegal = parseInt(privlgDetailObj.currentLegal),
        currentLevelId = privlgDetailObj.currentLevelId,
        tapLevelId = privlgDetailObj.tapLevelId;
        
      console.log("currentLegal=" + currentLegal + ",currentLevelId=" + currentLevelId);
      that.setData({ currentLegal: currentLegal, currentLevelId: currentLevelId, tapLevelId: tapLevelId}) 
    }
    if (currentLegal == 7){
      that.queryMonthEquity();
    }
  },
  queryMonthEquity:function(){  // 请求专项券包领取情况
    var that = this;
    var user = wx.getStorageSync('user');
    var options = {
      encryptFlag:false,
      url: '/member/equity/queryMonthEquity',
      data:{
        head: {
          "sender": "W",
          "senderValue": "0014",
          "operator": user.phoneNumber
        },
        memberId: user.userID,
        memberNum: user.phoneNumber
        // memberId: '66564290',
        // memberNum: '15818791970'
      }
    }
    commonObj.requestData(options,function(res){
      console.log(res);
      if (res.data.resultCode == 0){
        that.setData({ monthReceiveStatus:res.data.status})
      }
    })
  },
  bindReceiveTap:function(){   // 领取升级券包
    var that = this;
    if (that.data.monthReceiveStatus == 0){ //去领取
      wx.reportAnalytics('vip_getthegiftbag');
      that.receiveMonthEquity();
    }else if(that.data.monthReceiveStatus == 2){ //升级券包
      wx.reportAnalytics('vip_upgradethegiftbag');
      wx.switchTab({
        url: '/pages/fightGroups/index'
      })
    }
  },
  receiveMonthEquity:function(){   // 领取月度专享活动礼包
    var that = this;
    var user = wx.getStorageSync('user');
    var options = {
      encryptFlag:false,
      url:'/member/equity/receiveMonthEquity',
      data:{
        head: {
          "sender": "W",
          "senderValue": "0014",
          "operator": user.phoneNumber
        },
        memberId: user.userID,
        memberNum: user.phoneNumber
      }
    }
    wx.showLoading({
      title: '加载中',
      mask:true
    })
    commonObj.requestData(options,function(res){
      if (res.data.resultCode == 0){
        if(res.data.status == 0){ //领取成功
          commonObj.showModal('提示','领取成功,快去看看我的优惠券吧~',false,'去看看','',function(){
            wx.redirectTo({
              url: '/userA/pages/coupon/index',
            })
          });
          that.setData({ monthReceiveStatus:1})
        }else if(res.data.status == 1){  
          commonObj.showModal('提示','已领取',false);
          that.setData({ monthReceiveStatus: 1 })
        }else{
          commonObj.showModal('提示', '您当前还不可领取哦~', false);
          that.setData({ monthReceiveStatus: 2 })
        }
      }
    },'',function(){ wx.hideLoading();})
  },
  toExchange:function(){
    wx.reportAnalytics('vip_exchange');
    commonObj.showModal('提示','关注百果园公众号-->会员中心-->积分兑换参与活动',false)
  },
  toIndex:function(){
    var that = this;
    wx.reportAnalytics('vip_upgradeenjoy');
    if (that.data.currentLevelId < that.data.tapLevelId){
      wx.switchTab({
        url: '/pages/fightGroups/index'
      })
    }
  },
  toSetting:function(){
    wx.reportAnalytics('vip_setting');
    wx.navigateTo({
      url: '/userB/pages/modifyUserInfo/index'
    })
  },
  toDeposit:function(){
    wx.reportAnalytics('vip_todeposit');
    wx.navigateTo({
      url: '/userA/pages/deposit/index'
    })
  }
})
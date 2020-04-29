var privlg_bg1 = require('../../../source/image-base64/login_bg1');
var privlg_bg2 = require('../../../source/image-base64/privlg_bg2');
var privlg_bg3 = require('../../../source/image-base64/privlg_bg3');
var privlg_bg4 = require('../../../source/image-base64/privlg_bg4');
var jf_bg0 = require('../../../source/image-base64/jf_bg0');
var jf_bg1 = require('../../../source/image-base64/jf_bg1');
var line_bg = require('../../../source/image-base64/line_bg');
var common = require('../../../source/js/common');
var commonObj = common.commonObj;
var app = getApp();
Page({
  data: {
    privlg_bg1: privlg_bg1.bg,
    privlg_bg2: privlg_bg2.bg,
    privlg_bg3: privlg_bg3.bg,
    privlg_bg4: privlg_bg4.bg,
    jf_bg0:jf_bg0.bg,
    jf_bg1:jf_bg1.bg,
    line_bg:line_bg.bg,
    currentLevelId:1,
    tapLevelId:1
    
  },
  onLoad: function (options) {
    wx.showLoading({ title: '加载中' });
  },
  onShow:function(){
    var that = this;
    var cityObj = wx.getStorageSync('city');
    if (!commonObj.checkLoginStatus('myPrivlg')) {
      commonObj.showModal('提示', '您还未登陆哦，请先登陆~', true, '立即登陆', '', function (res) {
        if (res.confirm) {
          wx.setStorageSync('urlInfo', 'userA/pages/myPrivlg'); //记录要跳转的页面
          app.globalData.activeFlag = false;
          app.getUserInfo(function () { commonObj.isBindCard() });
        } else if (res.cancel) {
          wx.switchTab({
            url: '/pages/index/index',
          })
        }
      })
    } else {
      that.getMemberInfo();
    } 
  },
  getMemberInfo:function(){  // 获取用户信息
    var that = this;
    var user = wx.getStorageSync('user');
    var options = {
      encryptFlag:false,
      url: '/member/queryMemberLevelSchedule',
      data:{
        head:{
          "sender": "W",
          "senderValue": "0014",
          "operator": user.phoneNumber
        },
        memberId:user.userID,
        memberNum:user.phoneNumber
      }
    }
    commonObj.requestData(options,function(res){
      wx.hideLoading();
      console.log(res);
      if(res.data.resultCode==0){
        var levelScheduleEntities = res.data.levelScheduleEntities;
        that.setData({
          currentLevelName: levelScheduleEntities.currentLevelName,
          currentLevelId: levelScheduleEntities.currentLevelId,
          tapLevelId: levelScheduleEntities.currentLevelId,
          currentGetIntegral: parseInt(levelScheduleEntities.currentGetIntegral),
          upgradeLevelNum: levelScheduleEntities.upgradeLevelNum,
          totalLevelNum: parseInt(levelScheduleEntities.upgradeLevelNum) + parseInt(levelScheduleEntities.currentGetIntegral),
          keepCurrentLevelNum: levelScheduleEntities.keepCurrentLevelNum
        });
        // that.getExpireTime();
        that.calcWidth(levelScheduleEntities);
      }else{
        commonObj.showModal('提示',res.errMsg,false);
      }
    })
  },
  calcWidth: function (levelScheduleEntities) { //计算baseline的宽度
    var that = this,
      currentGetIntegral = levelScheduleEntities.currentGetIntegral,
      currentLevelId = levelScheduleEntities.currentLevelId,
      rate, per;
    if (currentLevelId == 4) {
      if (parseInt(currentGetIntegral) >= 12000) {
        rate = 0;
        per = '0%';
      } else {
        rate = parseInt(100 - new Number(parseInt(currentGetIntegral) / 12000).toFixed(2) * 100);
        per = (100 - new Number(parseInt(currentGetIntegral) / 12000).toFixed(2) * 100) + '%';
      }
    } else {
      rate = parseInt(100 - new Number(parseInt(currentGetIntegral) / that.data.totalLevelNum).toFixed(2) * 100);
      per = (100 - new Number(parseInt(currentGetIntegral) / that.data.totalLevelNum).toFixed(2) * 100) + '%';
    }
    console.log(currentGetIntegral);
    console.log("per =" + per + ",rate =" + rate);
    that.setData({ per: per, rate: rate });
  },
  bindLevelTap: function (e) { //等级切换
    var that = this,
      id = e.currentTarget.dataset.id;
    console.log("id=" + id);
    that.setData({ tapLevelId: id })
  },
  toPrivlgDePage: function (e) {  // 进权益详情页
    var that = this;
    var eventAnalytics = ['vip_memberpricebtn', 'vip_apprefund', 'vip_integralmall', 'vip_cashback', 'vip_upgrade', 'vip_birthdayprivilege', 'vip_preferentialactivities','vip_monthlygiftbag']
    var currentLegal = e.currentTarget.dataset.legal;
    console.log("legal =" + currentLegal);
    var privlgDetailObj = { currentLegal: currentLegal, currentLevelId: that.data.currentLevelId, tapLevelId: that.data.tapLevelId }
    console.log(privlgDetailObj);
    wx.reportAnalytics(eventAnalytics[currentLegal]);
    wx.navigateTo({
      url: '/userA/pages/privlgDetail/index?privlgDetailObj=' + JSON.stringify(privlgDetailObj),
    })

  },
  toMemberLevel:function(){  // 查看果粒值明细
    wx.reportAnalytics('vip_guolizhi');
    wx.navigateTo({
      url: '/userA/pages/berryValue/index'
    })
  },
  navigateInfo:function(){   // 查看会员积分规则
    wx.reportAnalytics('myprivlg_navigateinfo');
    wx.navigateTo({
      url: '/h5/pages/memberRuleInfo/index'
    })
  }

})
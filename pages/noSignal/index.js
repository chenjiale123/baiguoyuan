var common = require('../../source/js/common');
var commonObj = common.commonObj;
Page({
  data:{},
  onLoad:function(options){

  },
  bindRefreshTap:function(){
    wx.showLoading({
      title: '加载中',
      mask: 'true'
    })
    var pages = getCurrentPages(),prePage;
    // console.log("Nosignal!")
    //prePage = pages[pages.length - 2].__route__;
    prePage = '/pages/index/index';
    commonObj.getNetworkStatus(function(isConnected){
      if(isConnected){ //网络连接上了,跳转回首页吧,也避免需要传参的页面出错
        wx.switchTab({
          url: '/pages/fightGroups/index'
        })
      }
    });
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
  }
})
var common = require('../../source/js/common');
var commonObj = common.commonObj;
Page({
  data:{
    remindShowFlag:false
  },
  onShow: function(){
      this.hasLocation();
  },
  bindLocTap:function(){
    this.setData({
      remindShowFlag:true
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
  },
  hasLocation: function() {
      this.setData({
          remindShowFlag: false
      });
      wx.getLocation({
          success: function(res) {
             wx.hideLoading();
             wx.switchTab({
               url: '/pages/fightGroups/index'
             })
          }
      })
  }
})
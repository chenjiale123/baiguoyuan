var bg = require('../../../source/image-base64/hb_bg');
var common = require('../../../source/js/common');
var commonObj = common.commonObj;
Page({
  data: {
    bg:bg.bg,
    word:''
  },
  onLoad: function (options) {
  },
  bindWordTap:function(e){
    var value = e.detail.value;
    var that = this;
    that.setData({
      word : value
    })
  },
  bindGetTap:function(){
    wx.reportAnalytics('get_hongbao_btn')
    var that = this;
    if(!that.data.word){
      commonObj.showModal('提示','请输入口令',false);
      return;
    }
    var user = wx.getStorageSync('user');
    var cityObj = wx.getStorageSync('city');
    var options = {
      encryptFlag : true,
      url: '/privilegeManager/submitPrivilegeActivity',
      data:{
        customerID : user.userID,
        cityID : cityObj.cityID,
        userToken: user.userToken,
        privilegeCode : that.data.word
      }
    };
    wx.showLoading({
      title: '加载中'
    })
    commonObj.requestData(options,function(res){
      wx.hideLoading();
      if (res.data.errorCode == -1002) {
          commonObj.loginExpired();
      } else if(res.data.errorCode == 0){
        wx.reportAnalytics('get_hongbao_success')
        console.log(JSON.parse(commonObj.Decrypt(res.data.data, wx.getStorageSync('token'))));
        wx.showToast({
          title: '领取成功,快快去使用吧',
          icon: 'success',
          duration: 2000
        });
        setTimeout(function(){
          wx.navigateTo({
            url: '/userA/pages/coupon/index'
          })
        },2000)
      }else{
        commonObj.showModal('提示', res.data.errorMsg,false);
      }

    })
  }


})
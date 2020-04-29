var common = require('../../../source/js/common');
var commonObj = common.commonObj;
Page({
  data: {
    phoneNumText:'',
    phoneNum:'',
    pwdBtnDisabled:true,
    newPwdShowFlag:true,
    againPwdShowFlag:true
  },
  onLoad: function (options) {
    var that = this;
    var user = wx.getStorageSync('user');
    if (user.phoneNumber) {
      that.setData({
        phoneNum: user.phoneNumber,
        phoneNumText: user.phoneNumber.substr(0, 3) + ' ' + user.phoneNumber.substr(3, 4) + ' ' + user.phoneNumber.substr(7)
      })
    }
  },
  bindNewPwdTap:function(e){
    var that = this;
    var value = e.detail.value;
    that.setData({
      newPwd:value
    })
    that.checkPwdBtnStatus();
  },
  bindAgainPwdTap:function(e){
    var that = this;
    var value = e.detail.value;
    that.setData({
      againPwd:value
    })
    that.checkPwdBtnStatus();
  },
  checkPwdBtnStatus:function(){
    var that = this;
    if (that.data.newPwd && that.data.newPwd.length == 6 && that.data.againPwd && that.data.againPwd.length == 6 ) {
      that.setData({
        pwdBtnDisabled:false
      })
    }else{
      that.setData({
        pwdBtnDisabled:true
      })
    }
  },
  bindPwdBtnTap:function(e){
    var that = this;
    var pwdBtnDisabled = e.target.dataset.pwdBtnDisabled;
    if(!pwdBtnDisabled){
      wx.reportAnalytics('modifypwd_btn')
      if (that.data.newPwd != that.data.againPwd){
        commonObj.showModal('提示','两次输入的密码不一致',false);
        return;
      }
      var options = {
        encryptFlag: true,
         url: '/member/modifyPasswordByPhoneNum',
        header:{
          'pagodaRequestKey': 'b0e3202f-0825-4a6d-9a60-b5a5e785d403'
        },
        data: {
          head:{
            'sender': 'W',
            'senderValue': '',
            'operator': that.data.phoneNum
          },
          phoneNum:that.data.phoneNum,
          newPassword:commonObj.Encrypt(that.data.newPwd,commonObj.pwd)
        }
      }
      wx.showLoading({
        title: '加载中'
      });
      commonObj.requestData(options,function(res){
        wx.hideLoading();
        if (res.data.errorCode == -1002) {
            commonObj.loginExpired();
        } else if (res.data.resultCode == 0){
          wx.reportAnalytics('modifypwd_success')
          wx.showToast({
            title: '密码重置成功',
            icon: 'success',
            duration: 1500
          })
          setTimeout(function(){
            wx.navigateBack({
              delta: 1
            })
          },1500);
        }else if(res.data.resultCode == 2002){
          commonObj.showModal('提示','密码过于简单,请重新设置',false);
        }else if(res.data.resultCode == 2029){
          commonObj.showModal('提示','新密码和旧密码相同',false);
        }else if(res.data.resultCode == 2003){
          commonObj.showModal('提示','此密码为禁用密码,请重新设置',false);
        }else if(res.data.resultCode == 2007){
          commonObj.showModal('提示', '当前账号状态异常，请联系客服 400-181-1212', false);
        }else{
          commonObj.showModal('提示','重置密码失败,请重新设置',false);
        }
      })
    }
  },
  newPwdShowNo:function(){
    wx.reportAnalytics('viewpwd_new')
    var that = this;
    that.setData({
      newPwdShowFlag: !that.data.newPwdShowFlag,
      pwdFocus:true
    })
  },
  againPwdShowNo:function(){
    wx.reportAnalytics('viewpwd_again')
    var that = this;
    that.setData({
      againPwdShowFlag: !that.data.againPwdShowFlag,
      againPwdFocus:true
    });
  }
})
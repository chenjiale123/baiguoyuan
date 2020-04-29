
var bg = require ('../../source/image-base64/login_bg');
var common = require('../../source/js/common');
var commonObj = common.commonObj;
// var targetPage;
var paramObj;
var app = getApp();
Page({
  data:{
    bg:bg.bg, //背景图
    vcodeBtnDisabled:true,//获取验证码是否可点击
    loginBtnDisabled:true,//登录按钮是否可点击
    closeShowFlag:false, //叉叉是否显示
    vcodeText:'获取验证码',
    phoneNum:'',
    vCode:''
  },
  onLoad: function (options) {
    // targetPage = options.urlInfo;
    paramObj = options && options.paramObj ? options.paramObj : '';
    wx.hideLoading();
    wx.setNavigationBarTitle({
      title: '登录'
    })
   var phoneNumber = wx.getStorageSync('phoneNumber');
   phoneNumber && this.setData({ phoneNum: phoneNumber, vcodeBtnDisabled:false});
  },
  bindCloseTap:function(){ //叉叉按钮事件处理
    this.setData({
      vcodeBtnDisabled:true,
      loginBtnDisabled:true,
      phoneNum:'',
      getfocus: true
    });
  },
  bindBlurHandler:function(){ //失去焦点,叉叉隐藏
    this.setData({
      closeShowFlag:false
    });
  },
  bindFocusHandler:function(){ //聚焦,叉叉显示
    this.setData({
      closeShowFlag:true
    })
  },
  bindPhoneTap:function(e){ //手机号验证,是否发送验证码
    var that = this,value;
    value = e.detail.value;
    if ((/^1[0-9]\d{9}$/).test(value) && value.length == 11) {
      this.setData({
        phoneNum:e.detail.value,
        vcodeBtnDisabled: false
      });
      if(that.data.vCode){that.setData({loginBtnDisabled:false})}
    } else {
      this.setData({
        vcodeBtnDisabled: true,
        loginBtnDisabled:true
      });
    }
  },
  sendCode:function(e){ //发送验证码
    var num = 60,that = this,timer;
    if (that.data.vcodeBtnDisabled) return;
    that.setData({
      vcodeBtnDisabled:true,
      vcodeText:num + 's'
    });
    timer = setInterval(function () {
      num--;
      that.setData({
        vcodeBtnDisabled:true,
        vcodeText:num + 's'
      });
      if (num == 0) {
        clearInterval(timer);
        that.setData({
          vcodeBtnDisabled: false,
          vcodeText:'获取验证码'
        });
      } 
    }, 1000);
    var options = {
      encryptFlag:false,
      url: '/miUserAuthService/getValiCode',
      data:{
        'smsType':4,
        'phoneNumber':that.data.phoneNum
      }
    }
    commonObj.requestData(options,function(res){
      if(res.data.errorCode == 0){
        wx.showToast({
          title: '发送验证码成功',
          duration:2000
        })
      }else if(res.data.errorCode == 6008){
        commonObj.showModal('提示',res.data.errorMsg,false);
      }
    });
    
  },
  bindCodeTap:function(e){ //验证码验证,是否开放登录
    var that = this,value;
    value = e.detail.value;
    that.setData({vCode:value});
    value && that.data.phoneNum ? this.setData({loginBtnDisabled:false}):this.setData({loginBtnDisabled:true})
  },
  bindTextTap:function(e){ //navigateTo 服务条款
    wx.navigateTo({
      url: '/pages/terms/index',
    })
  },
  bindLoginTap:function(e){
    var that = this,
        loginBtnDisabled = e.target.dataset.loginBtnDisabled,
        options = {
          encryptFlag:true,
          url:'/miUserAuthService/login',

          data:{
            'type':4,
            'loginName':that.data.phoneNum,
            'validateCode':that.data.vCode
          }
        }
		console.log(options)
    if(!loginBtnDisabled){
      wx.showLoading({title: '登录中'});
      commonObj.requestData(options, function (res) {
        console.log(res)
        wx.hideLoading();
        if (res.data.errorCode == 0) {
           var data = JSON.parse(commonObj.Decrypt(res.data.data, commonObj.pwd));
          var userId = data.userID;
          var token = commonObj.Decrypt(data.userToken, commonObj.pwd);//	103306748|15be1dcd75c|0,,中间的作为下次请求的密钥
          wx.setStorageSync('user', data)
          wx.setStorageSync('token', token.split('|')[1]);
          // var pages = getCurrentPages();
          // if(targetPage){
          //     if(targetPage == 'receiveHB'){
          //       wx.redirectTo({
          //         url: '/pages/' + targetPage + '/index',
          //       })
          //     }else{
          //       wx.redirectTo({
          //         url: '/pages/user/' + targetPage + '/index',
          //       })
          //     }
              
          // }else {
          //     if (pages.length > 1) {
          //         var prePage = pages[pages.length - 2].__route__
          //         wx.reLaunch({ url: '/' + prePage })
          //     } else {
          //         wx.reLaunch({ url: '/pages/index/index' });
          //     }

          // }
          commonObj.toTargetPage(paramObj || '');
          
        } else {
          commonObj.showModal('提示','登录失败', false);
        }

      })
    }
   
  }
})
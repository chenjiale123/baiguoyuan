var QQMapWX = require('../../source/js/qqmap-wx-jssdk.min.js');
var common = require('../../source/js/common');
var commonObj = common.commonObj;
var qqmapsdk;
Page({
  data:{
    historyBoxShowFlag:false,
    resultBoxShowFlag:false,
    noResultShowFlag:false,
    closeShowFlag:false,
    regionList:[],
    inputValue:'',
    cityName:'',
    cityId:'',
    historyData:[] //历史记录
  },
  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title: '搜索地址'
    });
    var cityObj = wx.getStorageSync('selCity');
    let user = wx.getStorageSync('user');
    let userId = user.userID;
    this.setData({
      historyData: wx.getStorageSync('historyData')[userId],
      cityName: cityObj.cityName,
      cityId : cityObj.cityID
    });
    this.setData({ historyBoxShowFlag: typeof (this.data.historyData) != 'undefined' && this.data.historyData.length > 0 ? true : false })
  },
  bindInputTap:function(e){ //展示地址联想
    var value = e.detail.value,
      that = this;
    that.setData({
      inputValue:value
    });
    qqmapsdk = new QQMapWX({
      key: commonObj.qqMapKey
    });
    qqmapsdk.getSuggestion({
      keyword: value,
      region:that.data.cityName,
      region_fix:1, //限定在当前城市
      success: function (res) {
        console.log(res.data);
        that.setData({
          regionList:res.data
        });
        !value ? that.setData({historyBoxShowFlag : true,resultBoxShowFlag:false,noResultShowFlag:false})
          :that.data.regionList.length == 0 ? 
          that.setData({historyBoxShowFlag:false,resultBoxShowFlag:false,noResultShowFlag:true})  
        : that.setData({historyBoxShowFlag:false,resultBoxShowFlag:true,noResultShowFlag:false})
      }
    })
  },
  bindCloseTap:function(){ //清空搜索地址
    this.setData({
      inputValue:'',
      historyBoxShowFlag:true,resultBoxShowFlag:false,noResultShowFlag:false
    });
  },
  bindFocusHandler:function(e){ //聚焦显示叉叉
    this.setData({
      closeShowFlag:true
    });
  },
  bindBlurHandler:function(e){ //失焦隐藏叉叉
    this.setData({
      closeShowFlag:false
    });
  },
  bindConfirm: function (e) {
    var value = e.detail.value;
    //保存历史搜索
  },
  bindBtnTap:function(){
    var that = this;
    let user = wx.getStorageSync('user');
    let userId = user.userID;
    commonObj.showModal('提示','您确定要清空搜索历史吗?',true,'确定','取消',function(res){
        if(res.confirm){
          var dataArr = wx.getStorageSync('historyData');
          dataArr[userId] = [];
          wx.setStorageSync('historyData', dataArr)
          that.setData({
            historyData: dataArr[userId],
            historyBoxShowFlag:false
            });
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
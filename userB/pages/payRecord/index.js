var common = require('../../../source/js/common');
var commonObj = common.commonObj;
Page({
  data: {
    orderClass:"A", //A为门店订单,B为app订单
    storeOrderFlag:false,//true代表有门店订单,false没订单
    appOrderFlag:false, //true代表有app订单,false没订单
    storeOrderList:[],
    appOrderList:[],
    lastStoreUpdate:'', //记录最后一个商品的购买时间
    lastAppUpdate:'',
    picUrl:commonObj.PAGODA_PIC_DOMAIN
    
  },
  onLoad: function (options) {
    var that = this;
    wx.showLoading({ title: '加载中' }); //第一次加载显示loading
    that.getListOrderForStore();//初始状态获取门店订单
  },
  bindOrderTap:function(e){
    var orderClass = e.currentTarget.dataset.status;
    var that = this;
    wx.showLoading({ title: '加载中' });
    if(orderClass == 'A'){
      wx.reportAnalytics('storeorder_tap')
      that.setData({orderClass:'A',storeOrderList:[]});
      that.getListOrderForStore();
    }else{
      wx.reportAnalytics('apporder_tap')
      that.setData({orderClass:'B',appOrderList:[],isAppFirst:false});
      that.getAppOrderList(-1,'down');
    } 
  },             
  getListOrderForStore:function(lastUpdate,action){ //获取门店订单列表
    var that = this;
    var user = wx.getStorageSync('user');
    var options = {
      encryptFlag:true,
      url: '/olineStoreManager/listStoreOrder',
      data:{
        userToken: user.userToken,
        customerID:user.userID,
        phoneNumber:user.phoneNumber,
        lastUpdate:lastUpdate || '',
        action:action || 'down',
        count:5,
        _appInfo: { "os": "wxApp", "verCode": '2.5.0', "verName": '2.5.0' }
      }
    }
    commonObj.requestData(options,function(res){
		
		console.log(res);
      wx.hideLoading();
      that.setData({loading:false});
      if (res.data.errorCode == -1002) {
          commonObj.loginExpired();
      } else if (res.data.errorCode == 0){
        var data = JSON.parse(commonObj.Decrypt(res.data.data, wx.getStorageSync('token'))); 
        if(data && data.length > 0){
          var storeOrderList = that.data.storeOrderList;
          for(var i =0;i<data.length;i++){
            storeOrderList.push(data[i]);
          }
          that.setData({ storeOrderList: storeOrderList, storeOrderFlag: true, lastStoreUpdate:data[data.length-1].tradeTime});
        }else{
          if(that.data.storeOrderList.length == 0){
            that.setData({ storeOrderFlag: false });
          }
        }
        
      }else{
        commonObj.showModal('提示', res.data.description,false);
      }
      
    });
  },
  getAppOrderList:function(lastUpdate,action){ //获取APP订单列表
    var that = this;
    var user = wx.getStorageSync('user');
    var options = {
      header:{
        "X-DEFINED-appinfo": JSON.stringify({
          "deviceID": "35EAAF0C-D590-4F40-8F73-73735FDC02E5",
          "os": "iOS 10.3.1",
          "model": "Simulator",
		      "channel": "miniprogram",
          "verName": "2.5.1.0"
        }),
        "x-defined-verinfo":"wx",
        "userToken": user.userToken 
      },
      url: `/api/v1/order/${user.userID}/1/${action}/5/L/${lastUpdate}` 
    }
    commonObj.requestNewData(options,function(res){
      // that.setData({ loading: false });
	  console.log(res)
      wx.hideLoading();
      if(res.data.errorCode == 0){
        var data = res.data.data;
        if (data && data.length > 0) {
          var appOrderList = that.data.appOrderList;
          for (var i = 0; i < data.length; i++) {
            appOrderList.push(data[i]);
          }
          var hash = {};
          appOrderList = appOrderList.reduce(function (item, next) { //去重&去掉待支付订单
            hash[next.goodsOrderID] ? '' : hash[next.goodsOrderID] = true && next.showOrderStatus !='4' && item.push(next);
            return item;
          }, []); 
          console.log("app订单");
          console.log(appOrderList);
          that.setData({ appOrderList: appOrderList, appOrderFlag: true, lastAppUpdate: data[data.length - 1].lastUpdate });
        } else {
          if (that.data.appOrderList.length == 0) {
            that.setData({ appOrderFlag: false });
          }
        }
      }else{
        commonObj.showModal('提示', res.data.description,false);
      }
    });
  },
  // onPullDownRefresh:function(){
  //   wx.stopPullDownRefresh();
  //   var that = this;
  //   if(that.data.orderClass == 'A'){
  //     that.setData({storeOrderList:[]});
  //     that.getListOrderForStore();
  //   }else{
  //     that.setData({appOrderList:[]});
  //     that.getAppOrderList();
  //   }
  // },
  onReachBottom:function(){
    var that = this;
    // if (that.data.loading) return;
    // that.setData({ loading: true });

    if (that.data.orderClass == 'A') {
      that.getListOrderForStore(that.data.lastStoreUpdate,'up');
    } else {
      that.getAppOrderList(that.data.lastAppUpdate,'up');
    }                                          
  },
  bindOwnerTap:function(e){
    if(this.data.orderClass=='A'){
      wx.reportAnalytics('callowner_btn_store')
    }else{
      wx.reportAnalytics('callowner_btn_app')
    }
    var phone = e.currentTarget.dataset.phone;
    wx.makePhoneCall({
      phoneNumber: phone
    })
  },
  bindRefundTap:function(){
    if(this.data.orderClass == 'A'){
      wx.reportAnalytics('refunbtn_store')
    }else{
      wx.reportAnalytics('refunbtn_app')
    }
    commonObj.showModal('提示','下载App执行瞬间退款',false);
  },
  tapOrderInfo: function() {
      wx.reportAnalytics('orderinfo')
  }
})
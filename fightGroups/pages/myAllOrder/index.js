// fightGroups/pages/myAllOrder/index.js
var commonObj = require('../../../source/js/common').commonObj;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    picUrl: commonObj.PAGODA_PIC_DOMAIN,
    orderStatus:1, //1全部，2待付款，6待成团，7待自提
    allOrderList:[], //全部订单列表
    noPayOrderList:[], //待付款订单列表
    noGroupOrderList:[], //待成团订单列表
    noLiftOrderList:[], //待自提订单列表
    // orderList:[],
    lastUpdate:'',
    lastPullDir:'',
    noOrderShowFlag:false,
    timeout:{},
    timeDate:{},
    countFlag:true,
    orderFlowState: { 'WAIT_PAY': '待付款', 'PAYED': '已付款', 'STOCKING': '备货中', 'SENDING': '配送中', 
      'WAIT_PICKUP': '待自提', 'CANCELED': '已取消', 'RECEIVED': '已收货', 'PICKED_UP': '已自提', 
      'COMPLAINED': '已投诉', 'REJECT': '已拒收', 'REVIEWING': '退款审核中', 'NOT_REFUND': '未退款', 
      'REFUNDED': '已退款', 'GROUPBUY_PROCESS':'待成团'}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    wx.showLoading({title: '加载中'});
    if(options && options.indexObj){
      var indexObj = JSON.parse(options.indexObj);
      var orderStatus = indexObj.orderStatus;
      that.setData({orderStatus:orderStatus});
    }
  },
  onShow:function(){
    this.setData({countFlag:true}); //计时器打开
             
    if (commonObj.checkLoginStatus()){
      this.setData({allOrderList:[]});
      this.getOrderListByStatus(this.data.orderStatus,'up','');
    }
  },
  bindOrderTap:function(e){
    var that = this;
    var orderStatus = e.currentTarget.dataset.status;
    var id = e.currentTarget.dataset.id;
    var eventAnalytics = ['myorder_waitpay', 'myorder_waitgroupsuc','myorder_waittake', 'myorder_allorder'];
    wx.reportAnalytics(eventAnalytics[id]);
    if(orderStatus == 1){
      that.setData({orderStatus:1,allOrderList:[]})
    }else if(orderStatus == 2){
      that.setData({orderStatus:2,noPayOrderList:[]})
    }else if(orderStatus == 6){
      that.setData({orderStatus:6,noGroupOrderList:[]})
    }else{
      that.setData({orderStatus:7,noLiftOrderList:[]})
    }
    wx.showLoading({ title: '加载中' });
    that.getOrderListByStatus(orderStatus,'up','');
  },
  getOrderListByStatus: function (orderStatus, action, lastUpdate){

    var that = this;
    var user = wx.getStorageSync('user');
    var options = {
      encryptFlag:false,
      url:'/api/v1/groupBuy/queryOrderListByStatus',
      header:{
        'X-DEFINED-appinfo': JSON.stringify({
          "channel": "miniprogram",   //渠道
          "model": "iPhone 6",
          "os": "iOS 10.1.1",
          "verName": "2.4.0.0",
          "deviceID": "35EAAF0C-D590-4F40-8F73-73735FDC02E5",
        }),
        'userToken':user.userToken
      },
      data:{
        type:'C',
        customerID: user.userID,
        orderStatus:orderStatus,
        lastUpdate:lastUpdate||-1,
        action:action || 'up'
      }
    }
    console.log(options.data);
    commonObj.requestData(options,function(res){
      wx.hideLoading();
      console.log(res);
      if (res.data.errorCode == 0){
        var data = res.data.data;
        if(res.data.data && data.length > 0){
          data.forEach(function (item, index) { //待付款和待成团计时、格式化价格
            item.goodsList[0].groupPrice = String((item.goodsList[0].groupPrice / 100).toFixed(2)).split('.');
            item.goodsList[0].originalPrice = (item.goodsList[0].originalPrice / 100).toFixed(2);
            if (item.orderFlowState == 'WAIT_PAY') { //待付款
              that.countTime(item.timeExpire, item.payOrderID)
            } else if (item.orderFlowState == 'GROUPBUY_PROCESS') { //待成团
              console.log("GROUPBUY_PROCESS!!!!!!");
              that.countTime(item.groupInfo.expireTime, item.payOrderID)
            }
          })
        }
        if(action == 'up'){
          if(res.data.data && data.length > 0){
            that.setData({

              noOrderShowFlag:false,
              lastUpdate:new Date(data[data.length-1].createTime).getTime()
            })
            if (orderStatus == 1){ //全部订单
              if (that.data.lastPullDir == 'down') {that.setData({allOrderList:[]})} //上一次是下拉，清除数据
              var allOrderList = that.data.allOrderList;
              for(var i = 0;i<data.length;i++){
                allOrderList.push(data[i]);
              }
              that.setData({ allOrderList:that.reduceOrder(allOrderList)});
            } else if (orderStatus == 2){ //待付款
              if(that.data.lastPullDir == 'down'){that.setData({noPayOrderList:[]})}
              var noPayOrderList = that.data.noPayOrderList;
              for(var i = 0;i<data.length;i++){
                noPayOrderList.push(data[i]);
              }
              that.setData({ noPayOrderList: that.reduceOrder(noPayOrderList)});
            } else if (orderStatus == 6){ //待成团
              if(that.data.lastPullDir == 'down'){that.setData({noGroupOrderList:[]})}
              var noGroupOrderList = that.data.noGroupOrderList;
              for(var i = 0;i<data.length;i++){
                noGroupOrderList.push(data[i]);
              }
              that.setData({ noGroupOrderList: that.reduceOrder(noGroupOrderList)});
            }else{ //待自提
              if (that.data.lastPullDir == 'down') { that.setData({ noLiftOrderList: [] }) }
              var noLiftOrderList = that.data.noLiftOrderList;
              for (var i = 0; i < data.length; i++) {
                noLiftOrderList.push(data[i]);
              }
              that.setData({ noLiftOrderList: that.reduceOrder(noLiftOrderList) });
            }
          }else{
            if (orderStatus == 1 && that.data.allOrderList.length == 0){
              that.setData({noOrderShowFlag: true})
            } else if (orderStatus == 2 && that.data.noPayOrderList.length == 0){
              that.setData({noOrderShowFlag: true})
            } else if (orderStatus == 6 && that.data.noGroupOrderList.length == 0){
              that.setData({noOrderShowFlag: true})
            } else if (orderStatus == 7 && that.data.noLiftOrderList.length == 0){
              that.setData({ noOrderShowFlag:true})
            }
          }
        }else{
          if(res.data.data && data.length > 0){
            that.setData({
              noOrderShowFlag:false,
              lastUpdate:new Date(data[data.length-1].createTime).getTime()
            })
            if (orderStatus == 1){
              that.setData({ allOrderList: that.reduceOrder(data)})
            } else if (orderStatus == 2){
              that.setData({ noPayOrderList: that.reduceOrder(data)})
            } else if (orderStatus == 6){
              that.setData({ noGroupOrderList: that.reduceOrder(data)})
            }else{
              that.setData({ noLiftOrderList: that.reduceOrder(data)})
            }
          }else{
            if (orderStatus == 1 && that.data.allOrderList.length == 0) {
              that.setData({ noOrderShowFlag: true })
            } else if (orderStatus == 2 && that.data.noPayOrderList.length == 0) {
              that.setData({ noOrderShowFlag: true })
            } else if (orderStatus == 6 && that.data.noGroupOrderList.length == 0) {
              that.setData({ noOrderShowFlag: true })
            } else if (orderStatus == 7 && that.data.noLiftOrderList.length == 0) {
              that.setData({ noOrderShowFlag: true })
            }
          }
        }
      }
    })
  },
  countTime: function (expireTime, index) {
    var that = this;
    var expireTime = expireTime.replace(/-/g, '/');
    var leftTime = parseInt((parseInt(new Date(expireTime).getTime()) - parseInt(new Date().getTime())) / 1000);
    if(!that.data.countFlag) return;
    if (leftTime <= 0) {
      that.data.timeDate[index] = "00:00:00";
      that.setData({ "timeDate": that.data.timeDate })
    } else {
      var hours = parseInt(leftTime / 3600);
      var minute = parseInt(parseInt(leftTime / 60) - hours * 60);
      var second = parseInt(leftTime % 60);
      var hour = hours < 10 ? ("0" + hours) : hours;
      var min = minute < 10 ? ("0" + minute) : minute;
      var sec = second < 10 ? ("0" + second) : second;
      that.data.timeout['timer' + index] = setTimeout(function () {
        that.countTime(expireTime, index);
      }, 1000);
      that.data.timeDate[index] = hour + ":" + min + ":" + sec;
      that.setData({ "timeDate": that.data.timeDate })
    }
  },
  toPTorderPage:function(e){ //去订单详情页
    console.log("toPTorderPage!!");
    this.preventEvent();
    var goodsOrderID = e.currentTarget.dataset.orderid;
    var payOrderID = e.currentTarget.dataset.payid;
    var payStatus = e.currentTarget.dataset.paystatus;
    
    var myAllOrderObj = { isAllOrder:true, goodsOrderID: goodsOrderID, payOrderID:payOrderID, payStatus:payStatus};
    wx.navigateTo({
      url: '/fightGroups/pages/PTorderDetail/index?myAllOrderObj='+JSON.stringify(myAllOrderObj)
    })
  },
  reduceOrder:function(orderList){ //去重
    var hash = {};
    var orderList = orderList;
    orderList = orderList.reduce(function (item, next) { //去重&去掉待支付订单
      hash[next.payOrderID] ? '' : hash[next.payOrderID] = true && item.push(next);
      return item;
    }, []);
    return orderList
  },
  onReachBottom:function(){
    console.log("onReachBottom");
    var orderStatus = this.data.orderStatus,
      lastUpdate = this.data.lastUpdate;
    console.log("orderStatus ="+orderStatus+",lastUpdate ="+lastUpdate);
    this.setData({
      lastPullDir: 'up'
    });
    this.getOrderListByStatus(orderStatus,'up',lastUpdate);
  },
  onHide:function(){
    this.setData({countFlag:false}) //停止计时
  },
  onUnload:function(){
    this.setData({countFlag:false}) //停止计时
  },
  stopNavigate:function(){ //此方法完全是用于阻止页面跳转

  },
  onShareAppMessage: function (res) {
    var that = this;
    let user = wx.getStorageSync('user')
    if(res.from == 'button'){
      console.log(res.target);
      var goodsID = res.target.dataset.goodsid;
      var groupSharePic = res.target.dataset.sharepic;
      var goodsShareTitle = res.target.dataset.goodstitle;
      var goodsOrderID = res.target.dataset.goodsorderid;
      console.log("goodsID =" + goodsID + ",goodsShareTitle=" + goodsShareTitle);
      var myAllOrderObj = { goodsOrderID: goodsOrderID, userId: user.userID, userToken: user.userToken}
      console.log(myAllOrderObj)
      return {
        title: goodsShareTitle || '拼的是好吃，团的是实惠',
        path: '/fightGroups/pages/inviteFriends/index?myAllOrderObj=' + JSON.stringify(myAllOrderObj),
        imageUrl: that.data.picUrl + groupSharePic || '/source/images/pintuanpeitu.png',
        success: function () {
          wx.reportAnalytics('share_success')
        },
        fail: function () {
          wx.reportAnalytics('share_fail')
        }
      }
    }else{
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
    }

  },
  // 蒙层
  preventEvent: function () {
    this.setData({ prevent: true });
    setTimeout(() => {
      this.setData({ prevent: false });
    }, 400)
  },

  // 重新购买 or 再次购买
  buyAgain: function (e) {
    var page = getCurrentPages();
    
    let goodsid = e.currentTarget.dataset.goodsid || ''
    let activityid = e.currentTarget.dataset.activityid || ''
    wx.reportAnalytics('groupinfo_buyagainbtn');
    let store = wx.getStorageSync('selfLiftStore');
    console.log(store);
    if (store) {
      // 此时 this.data.activityID 是undefined
      let obj = JSON.stringify({ goodsID: goodsid, activityID: activityid })
      wx.redirectTo({
        url: '/fightGroups/pages/goodsDetail/index?PTorderDetailObj=' + obj,
      })
    } else {
      commonObj.showModal('提示', '您附近没有自提门店，无法参与拼团购买活动', false, '我知道了', '', '')
    }

    this.preventEvent();
  }
})
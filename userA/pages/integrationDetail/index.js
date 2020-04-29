// 积分明细 index.js
var commonObj = require('../../../source/js/common').commonObj;
var bg_jifen = require('../../../source/image-base64/bg_jifen_top');
var modifyType = {
  'I': '消费累计', 'S': '积分消费', 'D': '积分支付', 'T': '积分兑换', 'O': '过期清除', 'P': '会员转号', 'C': '积分调整', 'A': '活动赠送', 'R': '会员退款', 'B': '积分退回', 'Y':'积分增加'}
var flag = 0;
var page = 1;
var app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    purchase: [],
    List: [],
    allInte: 0,
    lastData: '',
    myjifenbg: bg_jifen.bg,
    memberIRL: [],
    isReady: false,
    hasInte: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    var token = wx.getStorageSync("token");
    var user = wx.getStorageSync('user');
    if (!commonObj.checkLoginStatus('integrationDetail')) {
      commonObj.showModal('提示', '您还未登陆哦，请先登陆~', true, '立即登陆', '', function (res) {
        if (res.confirm) {
          wx.setStorageSync('urlInfo', 'userA/pages/integrationDetail'); //记录要跳转的页面
          app.globalData.activeFlag = false;
          app.getUserInfo(function () { commonObj.isBindCard() });
        } else if (res.cancel) {
          wx.switchTab({
            url: '/pages/index/index',
          })
        }
      })
    } else {
      wx.showLoading({
        title: '加载中',
        mask: true
      })
      var phoneNumber = user.phoneNumber;
      var userToken = user.userToken;
      var userId = user.userID;
      page = 1;
      that.getInteDetail(userId, phoneNumber, page);
      let expireT = that.pipeiTime();
      that.setData({ expireDate: expireT })
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },
  onReachBottom: function () {
    var that = this;
    var user = wx.getStorageSync('user');
    if (that.data.hasInte) {
      ++page;
      that.getInteDetail(user.userID, user.phoneNumber, page);
    }
  },

  //******************功能函数*******************/
  // 查询积分明细
  getInteDetail: function (memberId, phoneNumber, page) {
    let that = this;
    let params = {
      memberId: memberId,
      memberNum: phoneNumber,
      phoneNum: phoneNumber,
      "head": {
        "sender": "W",
        "senderValue": "0087",
        "operator": phoneNumber
      },
      page: {
        currentPage: page,
        pageSize: 10,
        totalSizeFlag: 'T'
      }
    };

    let options = {
      header: {
        'pagodaRequestKey': 'b0e3202f-0825-4a6d-9a60-b5a5e785d403'
      },
      url: '/record/queryIntegralAndRecordList',
      data: params
    }
    commonObj.requestData(options, function (res) {
      console.log(res);
      if (res.data.errorCode == 0) {
        var memberAcc = res.data.data.memberAccount;
        var memberIRList = res.data.data.memberIntegralListRecord;
        var memberlist = that.data.List;

        that.setData({ allInte: memberAcc.integralBalance })     // 绑定总积分数据   
        if (memberIRList.length > 0) {
          // var hash = {};
          // memberIRList = memberIRList.reduce(function (item, next) {                        //去重  
          //   hash[next.recordId] ? '' : hash[next.recordId] = true && item.push(next);
          //   return item;
          // }, []);
          for (let item in memberIRList) {
            var sum = memberIRList[item].countAfterModify - memberIRList[item].countBeforeModify;
            // 时间排序
            memberIRList.sort(function (a, b) {
              return b.modifyTime - a.modifyTime;
            })
            let mtype = memberIRList[item].modifyType;
            if (mtype == 'T' || mtype == 'S' || mtype == 'O' || mtype == 'R' || mtype == 'D') {
              memberIRList[item].symbol = false;
              if (mtype != 'R') {
                memberIRList[item].modifyValue = '-' + memberIRList[item].modifyValue;
              }
            } else if (mtype == 'I' || mtype == 'A' || mtype == 'B' || mtype == 'Y') {
              memberIRList[item].symbol = true;
              memberIRList[item].modifyValue = '+' + memberIRList[item].modifyValue;
            } else if (mtype == 'P' || mtype == 'C') {
              if (sum > 0) {
                memberIRList[item].symbol = true;
                memberIRList[item].modifyValue = '+' + memberIRList[item].modifyValue;
              } else {
                memberIRList[item].symbol = false;
                memberIRList[item].modifyValue = '-' + memberIRList[item].modifyValue;
              }
            }
            // 更改字符名称
            memberIRList[item].modifyType = modifyType[memberIRList[item].modifyType];
            // 时间格式化
            memberIRList[item].modifyTime = commonObj.formatTime(memberIRList[item].modifyTime);
            that.expireTime(memberIRList[item].expireTime, memberIRList[item].countAfterModify);
            // 将数据push进数组然后渲染
            memberlist.push(memberIRList[item]);
          }
          console.log(memberlist);
          that.setData({ List: memberlist, hasInte: true, allInte: memberAcc.integralBalance })
        }
      } else {
        that.setData({ hasInte: false, allInte: 0 });
      }
    }, '', function () {
      wx.hideLoading();
    })
  },
  // 配对检查是否有该月过期的积分  后期的需求会有这个接口，可删除
  expireTime: function (expiretime, inte) {
    var date = new Date().Format("yyyyMM");
    if (date === expiretime.substring(0, 6)) {
      // 匹配到第一个就结束。因为时间是降序的
      flag = flag + 1;
      if (flag === 1) {
        this.setData({ expireInteg: inte })
      }
    } else {
      this.setData({ expireInteg: 0, })
    }
  },
  // 到期日期计算
  pipeiTime: function () {
    var year = new Date().getFullYear();
    var mou = new Date().getMonth() + 1;
    if (mou == 1 || mou == 3 || mou == 5 || mou == 7 || mou == 8 || mou == 10 || mou == 12) {
      return year + '年' + mou + '月31日';
    } else if (mou == 2) {
      if ((year % 4 == 0) && (year % 100 != 0 || year % 400 == 0)) {
        return year + '年' + mou + '月29日';
      } else return year + '年' + mou + '月28日';
    } else {
      return year + '年' + mou + '月30日';
    }
  },
  //******************End*******************/
  navigateInfo: function () {
    wx.navigateTo({
      url: '/h5/pages/intergraRuleInfo/index'
    })
  }
})
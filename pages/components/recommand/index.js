// pages/component/index.js
var commonObj = require('../../../source/js/common').commonObj;
var picUrl = commonObj.PAGODA_PIC_DOMAIN;
Component({
  properties: {
    // 这里定义了innerText属性，属性值可以在组件使用时指定
    obj: {
      type: Object,
      value: '',
    }
  },
  data: {
    // 这里是一些组件内部数据
    someData: {},
    picUrl: picUrl,
  },
  methods: {
    // 这里是一个自定义方法
    customMethod: function () { },
    naviagteGoodsDetail: function (e) {
      console.log(e)
      var myEventDetail = { goodsID: e.currentTarget.dataset.goodsid, activityID: e.currentTarget.dataset.activityid } // detail对象，提供给事件监听函数
      var myEventOption = {} // 触发事件的选项
      this.triggerEvent('event', myEventDetail, myEventOption)
      console.log('2')
    },
    naviagteGoodsDetail2: function (e) {
      console.log(e)
      var myEventDetail = { goodsID: e.currentTarget.dataset.goodsid, activityID: e.currentTarget.dataset.activityid  } // detail对象，提供给事件监听函数
      var myEventOption = {} // 触发事件的选项
      this.triggerEvent('event', myEventDetail, myEventOption)
      console.log('3')
    }
  }
})
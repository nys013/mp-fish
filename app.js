//app.js
App({
  onLaunch: function () {
    
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        env: 'nys-fish',
        traceUser: true,
      })
    }

    this.globalData = {}
    this.userInfo = {}
    // 这里就静态类型了，但是实际可做后台管理项目，然后修改，向后台获取(后期考虑了一下，分类很鸡肋)
    // this.productTypes = ['日用品','化妆品','文具','交通工具','运动器材','电子产品','食品','其他']
    this.initSchool = {school:'西北农林科技大学',areas:['北校区','南校区']}
  }
})

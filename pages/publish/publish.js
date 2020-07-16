// miniprogram/pages/publish/publish.js
const app = getApp()
const db = wx.cloud.database()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    productName:'',
    price:"",
    productDesc:'',
    publishType:'sell',
    school:'',
    area:'',
    fileList:[],
    disabled:false
  },
  handleProductNameChange({detail}){this.setData({productName:detail})},
  handlePriceChange({detail}){this.setData({price:detail})},
  handleProductDescChange({detail}){this.setData({productDesc:detail})},
  // 学校选择
  handleSchoolPick(e){
    const {school,area} = e.detail
    this.setData({school,area})
  },
  // 发布类型
  handleRadioChange(e){
    console.log(e.target.dataset.type);
    this.setData({publishType:e.target.dataset.type})
  },
  // 图片
  headleAfterRead({detail}){
    const fileList = [...this.data.fileList]
    // 当multiple为true时，detail中的file不再是对象，而是数组，需要遍历
    detail.file.forEach(item => {
      fileList.push({
        url:item.path
      })
    })
    this.setData({fileList})
  },
  handlePicDelete({detail}){
    const {index} = detail
    const fileList = [...this.data.fileList]
    fileList.splice(index,1)
    this.setData({fileList})
  },

  // 提交
  async submit(){
    const {productName,productDesc,school,area,publishType,fileList} = this.data
    let price = this.data.price*1
    const {_openid,_id} = app.userInfo
    // 表单验证
    if (!productName) {
      wx.showToast({title:'商品名称不能为空' , icon:'none'})
      return
    }else if (!price || price<=0){
      wx.showToast({title:'商品价格必填且只能为大于0的数字' , icon:'none'})
      return
    }else if(!school){
      wx.showToast({title:'请选择学校' , icon:'none'})
      return
    }

    // 设置loading
    wx.showLoading({
      title: '发布中',
      mask:true
    })
    // 防止重复提交到数据库
    this.setData({disabled:true})

    // 上传图片到云存储
    let productPicList = []
    if (fileList.length) {
      const promiseArr = fileList.map(item => {
        return wx.cloud.uploadFile({
          cloudPath:'product/' + _openid + Date.now() + '.jpg',
          filePath:item.url
        })
      })
      const results = await Promise.all(promiseArr)
      productPicList = results.map(item => item.fileID)
    }

    // 更新数据到数据库
    db.collection('products').add({
      data:{
        productName,price,productDesc,school,area,publishType,userId:_id,productPicList,
        loveUserList:{},
        publishTime:Date.now(),
        status:'onSale',  //在售/已下架
        deleted:false,
      },
      success:(res)=>{
        wx.hideLoading()
        wx.showToast({
          title: '发布成功',
          mask:true,
          success:()=>{
            // 发布成功后清空表单数据，以便返回后可填新的表单
            this.setData({productName:'',price:"",productDesc:'',publishType:'sell',school:'',area:'',fileList:[],disabled:false})
            // 除此之外，通知子组件schoolPicker将其单例标志数据flag设为true
            const schoolPicker = this.selectComponent('.schoolPicker')
            schoolPicker.setData({flag:true})
            wx.navigateTo({
              url:'/pages/productDetail/productDetail?id=' + res._id
            })
          }
        })
      }
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if (!app.userInfo._id) {
      wx.showToast({
        title: '请先登录',
        icon:'none',
        mask:true,
        success:()=>{
          wx.switchTab({
            url: '/pages/personal/personal',
          })
        }
      })
    }else{
      const {school,area} = app.userInfo
      this.setData({school,area})
    }
  },
  onShow:function(){
    if (!this.data.school) {
      const {school,area} = app.userInfo
      this.setData({school,area})
    }
  }

})
// components/productList.js
const app = getApp()
const db = wx.cloud.database()
const _ = db.command

Component({
  // 取消样式隔离
  options: {
    styleIsolation: 'apply-shared'
  },
  /**
   * 组件的属性列表
   */
  properties: {
    type:String
  },

  /**
   * 组件的初始数据
   */
  data: {
    myId:'',
    productList:[],
    filterShow:false,
    publishType:'0',
    areaType:'0',
    priceSection:[],
    maxPrice:"",
    minPrice:"",
    dbFilter:{deleted:false},
    screeningFilter:{},
    productStatus:'0',
    loveObj:{},
    searchValue:'',
    searchFilter:[],
    areas:[]
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 页面跳转
    navigateToDetail(e){
      // 注意target和currentTarget区别，前者是触发事件的元素，后者是绑定事件的元素
      const url =  '/pages/productDetail/productDetail?id=' + e.currentTarget.dataset.productid
      wx.navigateTo({
        url,
      })
    },
    // 刷新
    handleReflesh(){
      wx.showLoading({
        title: '刷新中',
      })
      db.collection('products').where(this.data.dbFilter).orderBy('publishTime', 'desc').get().then(res => {
        wx.hideLoading()
        wx.showToast({
          title: '刷新成功',
        })
        const productList = res.data
        const loveObj  = {}
        if (this.data.type === 'loveProduct') {
          const {myId} = this.data
          productList.sort((a,b) => -a.loveUserList[myId] + b.loveUserList[myId])
          productList.forEach(item => loveObj[item._id] = true)
        }
        this.setData({productList,publishType:'0',areaType:'0',productStatus:'0',maxPrice:"",minPrice:"",
        searchValue:'',searchFilter:[],screeningFilter:{},loveObj } , ()=>{
          console.log(this.data.productStatus);
          
        })
      })
    },
    // 筛选关闭
    handleClose(){
      this.setData({filterShow:false})
    },
    // 筛选打开
    handleFilter(){
      this.setData({filterShow:true})
    },
    // 发布类型改变
    handlePublishTypeChange(e){
      this.setData({publishType:e.currentTarget.dataset.publishtype})
    },
    // 商品状态改变
    handleProductStatusChange(e){
      this.setData({productStatus:e.currentTarget.dataset.productstatus})
    },
    // 区域改变
    handleAreaTypeChange(e){
      this.setData({areaType:e.currentTarget.dataset.areatype})
    },
    // 最低价改变
    handleMinPriceChange(e){
      this.setData({minPrice:e.detail.value})
    },
    // 最高价改变
    handleMaxPriceChange(e){
      this.setData({maxPrice:e.detail.value})
    },
    // 筛选取消
    handleCancel(){
      this.setData({filterShow:false})
    },
    // 筛选确定
    handleComfirm(){
      wx.showLoading({title: '筛选中'})
      let {publishType,areaType,maxPrice,minPrice,productStatus,searchFilter} = this.data
      // 1.数据条件处理
      maxPrice = maxPrice*1 || 9999999
      minPrice = minPrice*1 || 0.00001
      if ((!(maxPrice*1) || !(minPrice*1))) {
        wx.showToast({title: '价格只能是数字',icon:'none'})
        return
      }else if(maxPrice<0 || minPrice<0){
        wx.showToast({title: '价格必须大于0',icon:'none'})
        return
      }
      const priceSection = [minPrice,maxPrice] 
      priceSection.sort(function(a, b){return a - b})
      console.log(priceSection);
  
      // 小程序中不能使用eval，但是云环境可以。与云环境区别在于，云函数时要
      if (publishType==='0') {
        publishType = _.or(_.eq('sell') , _.eq('buy'))
      }
      if(areaType === '0') {
        // 查看文档，_.or传参即可以多个参数的形式传，也可以一个参数，参数为数组的形式传
        const areasFilter = this.data.areas.map(item => _.eq(item) )
        areaType = _.or(areasFilter)
      }
      if(productStatus === '0') {
        productStatus = _.or(_.eq('onSale') , _.eq('soldOut'))
      }
      const screeningFilter = {
        publishType,area:areaType,status:productStatus,
        price:_.and(_.gte(priceSection[0]) , _.lte(priceSection[1]))
      }
      let allFilter = []
      if (searchFilter.length) {
        allFilter = [
          {
            ...this.data.dbFilter,
            ...screeningFilter
          },
          _.or(...this.data.searchFilter)
        ]
      }else{
        allFilter = [{...this.data.dbFilter,...screeningFilter}]
      }
      this.setData({screeningFilter})
      // 2.数据库查找
        db.collection('products').orderBy('publishTime', 'desc').where(
          _.and(allFilter)
        ).get().then(res => {
          wx.hideLoading()
          wx.showToast({title:'筛选成功'})
          const productList = res.data
          if (this.data.type === 'loveProduct') {
            const {myId} = this.data
            productList.sort((a,b) => -a.loveUserList[myId] + b.loveUserList[myId])
          }
          this.setData({productList,filterShow:false})
        })
      
    },
    // 搜索
    handleSearch({detail}){
      const searchFilter = [
        {productName:db.RegExp({  //使用数据库正则对象
          regexp:detail,
          options:'i'
        })},
        {productDesc:db.RegExp({  //使用数据库正则对象
          regexp:detail,
          options:'i'
        })},
      ]
      this.setData({searchValue:detail , searchFilter , screeningFilter:[] , })
      
      db.collection('products').where(
        //因为有跨字段查询，所以需要用到_.and
        _.and([
          {...this.data.dbFilter},
          _.or(...searchFilter)
        ])
      ).orderBy('publishTime' , 'desc').get().then(res => {
        const productList = res.data
        if (this.data.type === 'loveProduct') {
          const {myId} = this.data
          productList.sort((a,b) => -a.loveUserList[myId] + b.loveUserList[myId])
        }
        this.setData({productList})
      } , err => console.log(err))
    },
    // 下架
    handleSoldOut(e){
      wx.showModal({
        title:'下架商品',
        content:'下架后商品可重新上架',
        success:res => {
          if (res.confirm) {
            wx.showLoading({title:'下架中',mask:true})
            const id = e.currentTarget.dataset.productid
            db.collection('products').doc(id).update({
              data:{status:'soldOut'}
            }).then(() => {
              this.reloadData()
            })
          }
        }
      })
    },
    // 上架
    handleOnSale(e){
      wx.showModal({
        title:'上架商品',
        content:'上架后商品对外展现',
        success:res => {
          if (res.confirm) {
            wx.showLoading({title:'上架中',mask:true})
            const id = e.currentTarget.dataset.productid
            db.collection('products').doc(id).update({
              data:{status:'onSale'}
            }).then(() => {
              this.reloadData()
            })
          }
        }
      })
      
    },
    // 删除
    handleDelete(e){
      wx.showModal({
        title:'删除商品',
        content:'删除后不可恢复',
        success:res => {
          if (res.confirm) {
            wx.showLoading({title:'删除中',mask:true})
            const id = e.currentTarget.dataset.productid
            db.collection('products').doc(id).update({
              data:{deleted:true}
            }).then(() => {
              this.reloadData()
            })
          }
        }
      })
    },
    // 编辑
    handleEdit(e){
      const productId = e.currentTarget.dataset.productid
      wx.navigateTo({
        url: '/pages/productEdit/productEdit?id=' + productId,
      })
    },
    // 收藏
    handleLove(e){
      const loveObj = {...this.data.loveObj}
      const productId =  e.currentTarget.dataset.productid
      // 从userInfo中取，记得改
      const {myId} = this.data
      loveObj[e.currentTarget.dataset.productid] = true
      this.setData({loveObj} , () => {
        // 修改数据库，因为是修改别人的商品中的loveUserList，所以要加
        wx.cloud.callFunction({
          name:'update',
          data:{
            collection:'products',
            doc:productId,
            data:`{ "loveUserList.${myId}":${Date.now()} , loveUserLength:_.inc(1)}`
          }
        })
      })
    },
    // 取消收藏
    handleCancelLove(e){
      const loveObj = {...this.data.loveObj}
      const productId =  e.currentTarget.dataset.productid
      // 从userInfo中取，记得改
      const {myId} = this.data
      loveObj[productId] = false
      this.setData({loveObj} , () => {
        // 修改数据库
        wx.cloud.callFunction({
          name:'update',
          data:{
            collection:'products',
            doc:productId,
            data:`{ "loveUserList.${myId}":0 , loveUserLength:_.inc(-1)}`
          }
        })
      })
      
    },
    // 重新获取数据库(和刷新区别在于，不清楚筛选，仍然按当时筛选的情况再重获一次数据库。）
    reloadData(){
      const {searchFilter,dbFilter,screeningFilter,type} = this.data
      let allFilter = []
      if (searchFilter.length) {
        console.log('searchFilter.length',searchFilter.length);
        
        allFilter = [
          {...dbFilter,...screeningFilter},
          _.or(...searchFilter)
        ]
      }else{
        allFilter = [{...dbFilter,...screeningFilter}]
      }
      db.collection('products').where(
        _.and(allFilter)
      )
      .orderBy('publishTime', 'desc').get().then(res => {
        const productList = res.data
        if (type === 'loveProduct') {
          const {myId} = this.data
          productList.sort((a,b) => -a.loveUserList[myId] + b.loveUserList[myId])
        }
        this.setData({productList})
        wx.hideLoading()
      })
    }
  },

  lifetimes:{
    attached(){
      if (!app.userInfo._id) {
        wx.showToast({
          title: '请先登录',
          icon:'none',
          mask:true,
          success:()=>{
            wx.switchTab({url: '/pages/personal/personal'})
          }
        })
        return
      }
      // id要从userInfo拿，然后再setData
      const myId = app.userInfo._id
      let {school} = app.userInfo
      // 拿学校
      if (school) {
        db.collection('schools').where({name:school}).field({areas:true})
        .get().then(res => this.setData({areas:res.data[0].areas,myId}))
      }else{
        school = app.initSchool.school
        const areas = app.initSchool.areas
        this.setData({areas,myId})
      }
      if (this.data.type === 'myAllProduct') {
        this.setData({dbFilter:{...this.data.dbFilter , userId:myId , school}} , () => {
          db.collection('products').where(this.data.dbFilter).orderBy('publishTime', 'desc').get().then(res => {
            this.setData({productList:res.data})
          })
        })
      } else {
        this.setData({dbFilter:{...this.data.dbFilter , loveUserList:{[myId]:_.gt(0)} , school}},()=>{
          db.collection('products').where(this.data.dbFilter)
          // 既可以数据库排序，可以获取到数据后，我们排序后展示。后者对于代码量较为减少，但若是写成组件，用数据库的排序更合适
          .orderBy(`loveUserList.${myId}`, 'desc')
          .orderBy('publishTime', 'desc')
          .get().then(res => {
            const productList = res.data
            // 自己排序
            // productList.sort((a,b) => -a.loveUserList[myId] + b.loveUserList[myId])
            const loveObj  = {}
            productList.forEach(item => loveObj[item._id] = true)
            this.setData({productList,loveObj})
          })
        })
      }
    }
  },

  pageLifetimes:{
    show: function() {

    },
  }
})

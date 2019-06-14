class Dep{
    constructor(){
      this.listenFunc = []
    }
    addFunc(obj){
      this.listenFunc.push(obj);
      // console.log(this.listenFunc);
    }
    changeWatch(){
      this.listenFunc.forEach(item => {
        // console.log(item);
        // 每一次输入框的变化，调用发送值给页面中渲染的属性，所以绑定watcher 的this;
        item.sendVal();
      })
    }
}

Dep.target = null;
const dep = new Dep();

class Observer{
    constructor(data){
      if(!data || typeof data !== 'object'){
          return;
      }
        this.data = data;
        this.init();
    }
    init(){
        Object.keys(this.data).forEach(key =>{
            this.observer(this.data, key, this.data[key]);
        })
    }
    observer (obj, key, value) {
      // 通过递归实现给每个属性添加数据劫持
        new Observer(obj[key]);
      Object.defineProperty(obj, key,{
        // 添加劫持之后的属性获取方法
          get () {
            if(Dep.target){
              // 给 dep实例属性listenFunc 添加一个watcher实例;
              dep.addFunc(Dep.target);
            }
            return value;
          },
          // 添加劫持之后的属性设置方法
          set (newvalue) {
            if(value === newvalue){
              return;
            }
            value = newvalue;
             // 触发每一个listenFunc里面的watcher实例
             dep.changeWatch();
             // 为了兼容新值为一个对象，该对象的属性也得添加劫持
            new Observer(value);
          }
      })
  }
}

class Watcher{
    constructor(data,key,cbk){
      // console.log(data,key)
      // 每次watcher的时候，均会把当前实例赋值给Dep的target属性
      Dep.target = this;
      this.data = data;
      this.key = key;
      this.cbk = cbk;
      // 每一次实例都会调用该函数
      this.init();
    }
    init() {
      // 获取对应的 key值
      this.value = utils.getValue(this.data, this.key);
      Dep.target = null;
      return  this.value;
    }
    // 获取监听到的值发送数据
    sendVal(){
      let newVal = this.init();
      // console.log(newVal);
      // 调用回调函数
      this.cbk(newVal)
    }
}


const utils ={
  setValue (node, data, key) {
      // 遍历获取到他的属性
      node.value = this.getValue(data, key);
  },
  getValue (data, key) {
    // 如果属性{{new.content}}遍历获取属性值
      if(key.indexOf('.')>-1){
          let arr = key.split('.');
          for (let i=0;i< arr.length;i++){
              data = data[arr[i]];
          }
          return data;
      }else{
        return data[key];
      }
  },
  // 获取文本属性的值
  getcontentVal (node, data ,key) {
      node.textContent = this.getValue(data, key);
  },
  // input 值改变后触发它的值
  changeVal (data, key, newval) {
    if (key.indexOf('.') > -1) {
      let arr = key.split('.');
      for(let i = 0; i < arr.length - 1; i++) {
          data = data[arr[i]]
      }
      // console.log(data);
      data[arr[arr.length - 1]] = newval;
      // console.log(data);
    } else {
      data[key] = newval
    }
  }
}


class Mvvm{
  constructor({el,data}){
    this.el = el;
    this.data = data;
   
    // 初始化数据，遍历属性;
    this.init();
    // 初始化它的dom渲染到页面
    this.initDom();
  }
  init () {
    Object.keys(this.data).forEach(item => {
        this.observer(this,item,this.data[item])
    })
    // 给当前数据集合的每一个属性添加数据劫持;
    new Observer(this.data)
  }
  observer (obj, key, value) {
    // 给每一个属性添加set和get方法;
      Object.defineProperty(obj, key,{
          get () {
            return value;
          },
          set (newvalue) {
            value = newvalue;
          }
      })
  }
  initDom () {
      this.$el = document.getElementById(this.el);
      // 创建碎片流;
      let newFragment = this.createfragment();
      // 渲染编译 虚拟碎片流;
      this.compiler(newFragment);
      this.$el.appendChild(newFragment);
  }
  // 创建碎片流
  createfragment () {
      let newFragment = document.createDocumentFragment();
      let firstChild;
      while (firstChild = this.$el.firstChild) {
          newFragment.appendChild(firstChild)
      }
      return newFragment;
  }
  // 编译到页面中
  compiler (node) {
    // 判断碎片的nodeType的值，确定是什么类型的
    // console.dir(node); // 打印对象;
      if (node.nodeType === 1) {
        // 获取节点上的所有属性
        let attributes = node.attributes;
        Array.from(attributes).forEach(item=>{
          // 获取该标签的属性
          // console.dir(item);
          if(item.nodeName === 'v-modle'){
            // console.log(item);
            // console.log(node);
            // 如果input触发事件，修改获取的值;
            node.addEventListener('input',(e)=>{
              // 获取属性，添加属性值,传入的item.nodeValue;
              utils.changeVal(this.data, item.nodeValue,e.target.value);
            })
            // 没有触发事件，获取input 初始值;
              utils.setValue(node, this.data, item.nodeValue)
          }
        })
      } else if (node.nodeType === 3) {
          let contentVal = node.textContent.indexOf("{{") > -1 && 
          node.textContent.split('{{')[1].split('}}')[0];
          
          contentVal && utils.getcontentVal(node, this.data,contentVal);
         // 获取视图中要监听编译的数据，添加属性监听,放生input事件时，获取当前的值;
        //  console.log(this.data);
          contentVal && new Watcher(this.data,contentVal,(newval)=>{
              node.textContent = newval;
          })
      }

      // 递归调用保证每一集的文本都可以获取到
      if (node.childNodes  && node.childNodes.length > 0){
        node.childNodes.forEach(val =>{
            this.compiler(val);
        })
      }
  }
}
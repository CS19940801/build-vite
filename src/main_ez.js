// 基础功能展示

// import { log } from './log.js'
// log(`1main.js`);

import { createApp , ref , watchEffect } from 'vue'

console.log(createApp);
console.log(ref);

let count = ref(0)
watchEffect(()=>{
    console.log(count.value);
})
setInterval(()=>{
    count.value++
},1000)



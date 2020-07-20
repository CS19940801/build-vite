<template>
  <h1>{{count}}*2 = {{double}}</h1>
  <button @click="add">click</button>
</template>
<script>
import {ref , computed} from 'vue'
export default {
    setup(){
        const count = ref(1)
        function add (){
            count.value++
        }

        const double = computed(()=>count.value*2)

        return { count ,double ,add } 
    }
}
</script>
<style>
    h1{
        color: green;
    }
</style>
<style lang="scss" scoped>
    h1{
        color: yellow;
    }
</style>
const fs = require('fs')
const path = require('path')
const Koa = require('koa')
const complierSfc = require('@vue/compiler-sfc') // 解析单文件组件
const complierDom = require('@vue/compiler-dom') // dom解析组件

const app = new Koa()

function rewriteImport(content){
    
    //  from 'xx' || "xx"
    return content.replace(/from ['"]([^'"]+)['"]/g , function(s0,s1){

        // console.log(`s0:${s0},s1:${s1}`);
        // import a from './c.js'不用改写
        // 匹配分组 只改写从 node_module 找的
        if(s1[0] !== '.' && s1[0] !== '/') {
            return `from '/@modules/${s1}'`
        }
        return s0
    })
}
// koa基础
app.use(async ctx=>{
// 不能直接用static,因为我们要编译.vue
    const{request:{url,query}} = ctx

    // console.log(`ctx`,ctx);
    // console.log(`request`,ctx.request);
    // console.log(`query`, query.type);
    // console.log(`url`, url);

    if (url == '/') {
        let content = fs.readFileSync('./index.html','utf-8')
        
        content = content.replace("<script ",`
            <script>
                window.process = { env:{NODE_ENV:'dev'}}
            </script>
            <script `)

        ctx.type = "text/html"
        ctx.body = content
    } else if (url.endsWith('.js')){        
        console.log(`解析js`);
        const p = path.resolve(__dirname,url.slice(1))
        const content = fs.readFileSync(p,'utf-8')
        
        ctx.type = 'application/javascript'
        // import xx from 'vue' 改造成 import xx from '/@modules/vue'
        ctx.body = rewriteImport(content)
    } else if (url.startsWith('/@modules/')) {
        console.log(`解析node包`);
        const prefix = path.resolve(__dirname,'node_modules',url.replace('/@modules/',''))
        const module = require(prefix+'/package.json').module
        const p = path.resolve(prefix,module)
        const ret = fs.readFileSync(p,"utf-8")

        ctx.type = 'application/javascript'
        ctx.body = rewriteImport(ret)
    } else if (url.includes('.vue')) {        
        console.log(`解析vue`);
        // 解析单文件组件
        const p = path.resolve(__dirname,url.split('?')[0].slice(1))
        const { descriptor } = complierSfc.parse(fs.readFileSync(p,'utf-8'))
                
        if(!query.type){
            // 解析script
            ctx.type = 'application/javascript'
            ctx.body = `
${rewriteImport(descriptor.script.content).replace('export default', 'const __script = ')}
import "${url}?type=style"
import { render as __render } from "${url}?type=template"
__script.__hmrId = "${url}"
__script.__file = "${path.resolve(__dirname, url.slice(1))}" 
__script.render = __render
export default __script
            `
            // import { render as __render } from "${url}?type=template" //解析template用
            // __script.__hmrId = "/src/App.vue" // 热更新
            // __script.__file = "/Users/chenshuai/workspace/51shebao/code/vue3/vue-demo-vite/src/App.vue" // 文件绝对地址
        } else if (query.type == 'template') {
            // 解析template
            const template = descriptor.template
            const render = complierDom.compile(template.content,{mode:'module'}).code
            // template=>render才能执行

            ctx.type = 'application/javascript'
            ctx.body = rewriteImport(render)
        }else if (query.type == 'style') { 
            // @todo 解析style css
            const styles = descriptor.styles[0].content
            console.log(styles);
            const content = `
const css = '${styles.replace(/\n/g, '')}'
let link = document.createElement('style')
link.setAttribute('type','text/css')
document.head.appendChild(link)
link.innerHTML = css
export default css`
            
            ctx.type = 'application/javascript'
            ctx.body = content
        }
    } else if (url.endsWith('.css')) {
        // import css处理
        console.log(`解析css`);
        const p = path.resolve(__dirname, url.slice(1))
        const file = fs.readFileSync(p, 'utf-8')
        // cosnt css = '${file.replace(/\n/g,'').trim()}'
        const content = `
const css = '${file.replace(/\n/g,'')}'
let link = document.createElement('style')
link.setAttribute('type','text/css')
document.head.appendChild(link)
link.innerHTML = css
export default css   
    
    `

        ctx.type = 'application/javascript'
        ctx.body = content
    } else {
        // console.log(`废了`);
        ctx.body = '嘿嘿'
    }
})
// 收集错误
// app.on('error', (err, ctx) => {
//     log.error('server error', err)
//     // log.error('server error', err, ctx)
// });
// 启动服务
app.listen(3000,()=>{
    console.log(3000);
})
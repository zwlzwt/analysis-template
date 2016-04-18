(function(window){
    // 取得全局变量名那么百度自然是baidu,对外暴露接口，在node.js中采用commonjs规范输出不用baidu；
    var zwl = typeof module === 'undefined' ? (window.zwl = window.zwl || {}) : module.exports;


    zwl.templ = function (str, data) {
        var fn = (function() {
            if (!window.document) {
                return bt.compile(str);
            }
            var element = document.getElementById(str);
            if (element) {
                var html = /^(textarea|input)$/i.test(element.nodeName) ? element.value : element.innerHTML;
                return bt.compile(html);
            }else {
                return bt.compile(str);
            }
        })();

        var result = bt.isObject(data) ? fn(data) : fn;
        fn = null;
        return result;
        alert(result);

    // 这是另一种思路 如果是js中的语法不需要replace，反之replace后需要方到数组中
        function factory() {
            var reg=/<%[(^%>)+]?%>/g,
                regOut=/(^( )?(if|for|else|switch|case|break|{|}))(.*)?/g,
                code='var r=[];/n',
                cursor=0;
            var add = function(stream, js) {
                return (
                    js ? (code += stream.match(regOut) ? stream + '\n' : 'r.push(' + line + ');\n') : (code += line !== '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : '')
                );
            };
            while (compile = reg.exec(tpl)) {
                add(tpl.slice(cursor, compile.index))(compile[1], true);
                cursor = compile.index + compile[0].length;
            }
            add(tpl.substr(cursor, tpl.length - cursor));
            code += 'return r.join("");';
            console.log(code.replace(/[\r\t\n]/g, ''));
            return code;
        }


        var fn = !/\W/.test(str) ? cacheDate[str] = cacheDate[str] || zwltmpl(document.getElementById(str).innerHTML) : new Function(code.replace(/[\r\t\n]/g, '')).apply(data);

    };
    //取得类似于baidu.template的zwl下的方法zwl.templ
    var bt = zwl.templ;

    // 自定义的分隔符样式（以免在模版中和其他框架冲突，例如Angularjs）
    bt.leftDelimiter = bt.leftDelimiter || '<%';
    bt.rightDelimiter = bt.rightDelimiter || '%>';

    // 代替eval方法 本来想去替换eval但是问题是生成的script标签不确保data的传入所以会undefined，只能采用eval方法；
    bt.evalRep = function(str) {
        var script = document.createElement('script');
        script.type="text/javascript";
        script.text=str;
        document.body.appendChild(script);
    };

    //HTML转义
    bt.encodeHTML = function(source){
        return (
            source.toString()
            .replace(/&/g,'&amp;')
            .replace(/</g,'&lt;')
            .replace(/>/g,'&gt;')
            .replace(/\\/g,'&#92;')
            .replace(/"/g,'&quot;')
            .replace(/'/g,'&#39;')
        );
    };

    //转义影响正则的字符（有些正则表达式会被转义字符影响）
    bt.encodeReg = function (source) {
        return (
            source.toString().replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1')
        );
    };
    bt.encodeEventHTML = function(source) {
            return (
                source.toString()
                .replace(/&/g,'&amp;')
                .replace(/</g,'&lt;')
                .replace(/>/g,'&gt;')
                .replace(/"/g,'&quot;')
                .replace(/'/g,'&#39;')
                .replace(/\\\\/g,'\\')
                .replace(/\\\//g,'\/')
                .replace(/\\n/g,'\n')
                .replace(/\\r/g,'\r')
            );
    };

    bt.compile = function(str) {
        var funBody = "var templateArry=[];\nvar fn=(function(data){\nvar templateName='';\nfor(name in data){\ntemplateName+=('var '+name+'=data[\"'+name+'\"];');\n};\neval(templateName);\ntemplateArry.push('"+bt.analysisStr(str)+"');\ntemplateName=null;\n})(templateObject);\nfn = null;\nreturn templateArry.join('');\n";
        return (
            new Function("templateObject", funBody)
        );
    };

    // !!强制类型转换为bool类型
    bt.isObject = function (source) {
        return 'function' === typeof source || !!(source && 'object' === typeof source);
    };
    //解析模板字符串
    // bt.analysisStr = function(str) {
    //     // 转译模版左右标识
    //     var left = bt.leftDelimiter;
    //     var right = bt.rightDelimiter;
    //     var leftReg = bt.encodeReg(left);
    //     var rightReg = bt.encodeReg(right);
    //
    //     str =  String(str)
    //               // 去掉分隔符中的js注释
    //               .replace(/("+leftReg+"[^"+rightReg+"]*)\/\/.*\n/g, '$1')
    //               // 去掉换行符 \r回车符 \t制表符 \n换行符
    //               .replace(/[\r\t\n]/g,"")
    //               // 将HTML注释匹配掉
    //               .replace(/<!--.*?-->/g,"")
    //               .replace(/leftReg+"\\*.*?\\*"+rightReg/g, "")
    //               // HTML转义分隔符内部的斜杠和单引号等
    //               .replace(/leftReg+"(?:(?!"+rightReg+")[\s\S])*"+rightReg+"|((?:(?!"+leftReg+")[\s\S])+)/g, function (matchStr, $1) {
    //                   var str = "";
    //                   if ($1) {
    //                       str = $1.replace(/\\/g,"&#92;").replace(/'/g,'&#39;');
    //                       while (/<[^<]*?&#39;[^<]*?>/g.test(str)) {
    //                           str = str.replace(/(<[^<]*?)&#39;([^<]*?>)/g,'$1\r$2');
    //                       }
    //                   }else {
    //                       str = matchStr;
    //                   }
    //                   return str;
    //               });
    //     str = str
    //         //定义变量，如果没有分号，需要容错  <%var val='test'%>
    //         .replace(/("+leftReg+"[\\s]*?var[\\s]*?.*?[\\s]*?[^;])[\\s]*?"+rightReg/g, "$1"+right)
    //         //对变量后面的分号做容错(包括转义模式 如<%:h=value%>)  <%=value;%> 排除掉函数的情况 <%fun1();%> 排除定义变量情况  <%var val='test';%>
    //         .replace(/(("+leftReg+":?[hvu]?[\\s]*?=[\\s]*?[^;|"+rightReg+"]*?);[\\s]*?)/g, "$1"+right)
    //         //按照 <% 分割为一个个数组，再用 \t 和在一起，相当于将 <% 替换为 \t
    //         //将模板按照<%分为一段一段的，再在每段的结尾加入 \t,即用 \t 将每个模板片段前面分隔开
    //         .split(left).join("\t");
    //
    //     str = str
    //         //找到 \t=任意一个字符%> 替换为 ‘，任意字符,'
    //         //即替换简单变量  \t=data%> 替换为 ',data,'
    //         //默认HTML转义  也支持HTML转义写法<%:h=value%>
    //         .replace(/\\t=(.*?)"+rightReg/g, "',typeof($1) === 'undefined'?'':zwl.templ.encodeHTML($1),'" );
    //
    //     str = str
    //
    //         //支持HTML转义写法<%:h=value%>
    //         .replace(/\\t:h=(.*?)+rightReg/g,"',typeof($1) === 'undefined'?'':zwl.templ.encodeHTML($1),'")
    //
    //         //支持不转义写法 <%:=value%>和<%-value%>
    //
    //         .replace(/\t(?::=|-)(.*?)+rightReg/g,"',typeof($1)==='undefined'?'':$1,'")
    //
    //         //支持url转义 <%:u=value%>
    //         .replace(/\t:u=(.*?)+rightReg/g, "',typeof($1)==='undefined'?'':encodeURIComponent($1),'")
    //
    //         //支持UI 变量使用在HTML页面标签onclick等事件函数参数中  <%:v=value%>
    //         .replace(/\t:v=(.*?)+rightReg/g, "',typeof($1)==='undefined'?'':bt.encodeEventHTML($1),'")
    //
    //         //将字符串按照 \t 分成为数组，在用'); 将其合并，即替换掉结尾的 \t 为 ');
    //         //在if，for等语句前面加上 '); ，形成 ');if  ');for  的形式
    //         .split("\t").join("');")
    //
    //         //将 %> 替换为_template_fun_array.push('
    //         //即去掉结尾符，生成函数中的push方法
    //         //如：if(list.length=5){%><h2>',list[4],'</h2>');}
    //         //会被替换为 if(list.length=5){_template_fun_array.push('<h2>',list[4],'</h2>');}
    //         .split(right).join("templateArry.push('")
    //
    //         //将 \r 替换为 \
    //         .replace(/\n/g,"")
    //         .split("\r").join("\\'");
    //
    //     return str;
    // };

    bt.analysisStr = function(str){

        //取得分隔符
        var left = bt.leftDelimiter;
        var right = bt.rightDelimiter;

        //对分隔符进行转义，支持正则中的元字符，可以是HTML注释 <!  !>
        var leftReg = bt.encodeReg(left);
        var rightReg = bt.encodeReg(right);

        str = String(str)

            //去掉分隔符中js注释
            .replace(new RegExp("("+leftReg+"[^"+rightReg+"]*)//.*\n","g"), "$1")

            //去掉注释内容  <%* 这里可以任意的注释 *%>
            //默认支持HTML注释，将HTML注释匹配掉的原因是用户有可能用 <! !>来做分割符
            .replace(new RegExp("<!--.*?-->", "g"),"")
            .replace(new RegExp(leftReg+"\\*.*?\\*"+rightReg, "g"),"")

            //把所有换行去掉  \r回车符 \t制表符 \n换行符
            .replace(new RegExp("[\\r\\t\\n]","g"), "")

            //用来处理非分隔符内部的内容中含有 斜杠 \ 单引号 ‘ ，处理办法为HTML转义
            .replace(new RegExp(leftReg+"(?:(?!"+rightReg+")[\\s\\S])*"+rightReg+"|((?:(?!"+leftReg+")[\\s\\S])+)","g"),function (item, $1) {
                var str = '';
                if($1){

                    //将 斜杠 单引 HTML转义
                    str = $1.replace(/\\/g,"&#92;").replace(/'/g,'&#39;');
                    while(/<[^<]*?&#39;[^<]*?>/g.test(str)){

                        //将标签内的单引号转义为\r  结合最后一步，替换为\'
                        str = str.replace(/(<[^<]*?)&#39;([^<]*?>)/g,'$1\r$2')
                    }
                }else{
                    str = item;
                }
                return str ;
            });


        str = str
            //定义变量，如果没有分号，需要容错  <%var val='test'%>
            .replace(new RegExp("("+leftReg+"[\\s]*?var[\\s]*?.*?[\\s]*?[^;])[\\s]*?"+rightReg,"g"),"$1;"+right)

            //对变量后面的分号做容错(包括转义模式 如<%:h=value%>)  <%=value;%> 排除掉函数的情况 <%fun1();%> 排除定义变量情况  <%var val='test';%>
            .replace(new RegExp("("+leftReg+":?[hvu]?[\\s]*?=[\\s]*?[^;|"+rightReg+"]*?);[\\s]*?"+rightReg,"g"),"$1"+right)

            //按照 <% 分割为一个个数组，再用 \t 和在一起，相当于将 <% 替换为 \t
            //将模板按照<%分为一段一段的，再在每段的结尾加入 \t,即用 \t 将每个模板片段前面分隔开
            .split(left).join("\t");

        //支持用户配置默认是否自动转义
        if(bt.ESCAPE){
            str = str

                //找到 \t=任意一个字符%> 替换为 ‘，任意字符,'
                //即替换简单变量  \t=data%> 替换为 ',data,'
                //默认HTML转义  也支持HTML转义写法<%:h=value%>
                .replace(new RegExp("\\t=(.*?)"+rightReg,"g"),"',typeof($1) === 'undefined'?'':zwl.templ.encodeHTML($1),'");
        }else{
            str = str

                //默认不转义HTML转义
                .replace(new RegExp("\\t=(.*?)"+rightReg,"g"),"',typeof($1) === 'undefined'?'':$1,'");
        }

        str = str

            //支持HTML转义写法<%:h=value%>
            .replace(new RegExp("\\t:h=(.*?)"+rightReg,"g"),"',typeof($1) === 'undefined'?'':zwl.templ.encodeHTML($1),'")

            //支持不转义写法 <%:=value%>和<%-value%>
            .replace(new RegExp("\\t(?::=|-)(.*?)"+rightReg,"g"),"',typeof($1)==='undefined'?'':$1,'")

            //支持url转义 <%:u=value%>
            .replace(new RegExp("\\t:u=(.*?)"+rightReg,"g"),"',typeof($1)==='undefined'?'':encodeURIComponent($1),'")

            //支持UI 变量使用在HTML页面标签onclick等事件函数参数中  <%:v=value%>
            .replace(new RegExp("\\t:v=(.*?)"+rightReg,"g"),"',typeof($1)==='undefined'?'':zwl.templ.encodeEventHTML($1),'")

            //将字符串按照 \t 分成为数组，在用'); 将其合并，即替换掉结尾的 \t 为 ');
            //在if，for等语句前面加上 '); ，形成 ');if  ');for  的形式
            .split("\t").join("');")

            //将 %> 替换为_template_fun_array.push('
            //即去掉结尾符，生成函数中的push方法
            //如：if(list.length=5){%><h2>',list[4],'</h2>');}
            //会被替换为 if(list.length=5){_template_fun_array.push('<h2>',list[4],'</h2>');}
            .split(right).join("templateArry.push('")

            //将 \r 替换为 \
            .split("\r").join("\\'");

        return str;
    };
})(window);

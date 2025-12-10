// hook_okhttp_enhanced.js
Java.perform(function() {
    console.log("[*] 开始Hook OkHttp网络流量（增强版）...");
    
    // ==================== 1. Hook ResponseBody的source方法 ====================
    var ResponseBody = Java.use("okhttp3.ResponseBody");
    
    // Hook source() 方法来获取响应体内容
    ResponseBody.source.implementation = function() {
        var source = this.source();
        
        try {
            // 尝试读取响应体内容
            var contentType = this.contentType();
            if (contentType && contentType.toString().includes("application/json")) {
                // 创建一个缓冲区来复制内容
                var Buffer = Java.use("okio.Buffer");
                var buffer = Buffer.$new();
                
                // 将source复制到buffer中
                source.request(Number.MAX_VALUE);
                buffer.writeAll(source);
                
                // 将buffer的内容转回给source
                var newSource = buffer.clone();
                
                // 记录响应体内容
                var content = buffer.readUtf8();
                if (content && content.length > 0) {
                    console.log("\n📄 响应体JSON内容:");
                    try {
                        // 尝试美化输出JSON
                        var jsonObj = JSON.parse(content);
                        console.log(JSON.stringify(jsonObj, null, 2));
                    } catch(e) {
                        // 如果不是有效的JSON，直接输出
                        console.log(content.length > 500 ? content.substring(0, 500) + "..." : content);
                    }
                }
                
                // 返回新的source，确保不影响原流程
                return newSource;
            }
        } catch(e) {
            // 忽略错误，不影响正常流程
        }
        
        return source;
    };
    
    // ==================== 2. Hook RequestBody的writeTo方法 ====================
    var RequestBody = Java.use("okhttp3.RequestBody");
    
    RequestBody.writeTo.overload('okio.BufferedSink').implementation = function(sink) {
        try {
            // 创建一个缓冲区来捕获请求体内容
            var Buffer = Java.use("okio.Buffer");
            var buffer = Buffer.$new();
            
            // 先写入到我们的缓冲区
            this.writeTo(buffer);
            
            // 记录请求体内容
            var contentType = this.contentType();
            if (contentType && contentType.toString().includes("application/json")) {
                try {
                    var content = buffer.readUtf8();
                    if (content && content.length > 0) {
                        console.log("\n📝 请求体JSON内容:");
                        try {
                            var jsonObj = JSON.parse(content);
                            console.log(JSON.stringify(jsonObj, null, 2));
                        } catch(e) {
                            console.log(content.length > 500 ? content.substring(0, 500) + "..." : content);
                        }
                    }
                    
                    // 重置buffer位置，以便重新写入到原始sink
                    buffer = Buffer.$new();
                    this.writeTo(buffer);
                } catch(e) {
                    // 如果读取失败，继续正常流程
                }
            }
            
            // 将内容写入到原始sink
            sink.write(buffer, buffer.size());
        } catch(e) {
            // 如果出错，调用原始方法
            this.writeTo(sink);
        }
    };
    
    // ==================== 3. Hook OkHttpClient的newCall方法 ====================
    var OkHttpClient = Java.use("okhttp3.OkHttpClient");
    
    OkHttpClient.newCall.implementation = function(request) {
        try {
            var timestamp = new Date().toISOString();
            var url = request.url().toString();
            var method = request.method();
            var headers = request.headers();
            
            console.log("\n" + "═".repeat(60));
            console.log("📤 HTTP请求 [" + timestamp + "]");
            console.log("═".repeat(60));
            console.log("URL: " + url);
            console.log("方法: " + method);
            
            // 输出请求头
            if (headers.size() > 0) {
                console.log("\n请求头:");
                for (var i = 0; i < headers.size(); i++) {
                    var name = headers.name(i);
                    var value = headers.value(i);
                    console.log("  " + name + ": " + value);
                }
            }
            
            // 记录请求体（通过writeTo方法会捕获）
            var body = request.body();
            if (body != null) {
                var contentType = body.contentType();
                var contentLength = body.contentLength();
                console.log("\n请求体信息:");
                console.log("  类型: " + (contentType ? contentType.toString() : "未知"));
                console.log("  长度: " + (contentLength == -1 ? "未知" : contentLength + " 字节"));
            } else {
                console.log("\n请求体: null");
            }
            
            console.log("═".repeat(60));
        } catch(e) {
            console.log("[!] 记录请求时出错: " + e);
        }
        
        return this.newCall(request);
    };
    
    // ==================== 4. Hook Response的创建和拦截器 ====================
    try {
        // Hook拦截器链的proceed方法，这可以捕获响应
        var RealInterceptorChain = Java.use("okhttp3.internal.http.RealInterceptorChain");
        
        RealInterceptorChain.proceed.overload('okhttp3.Request').implementation = function(request) {
            try {
                // 记录请求
                var url = request.url().toString();
                console.log("\n[拦截器链] 处理请求: " + url);
            } catch(e) {
                // 忽略错误
            }
            
            var response = this.proceed(request);
            
            try {
                // 记录响应
                var timestamp = new Date().toISOString();
                var code = response.code();
                var message = response.message();
                var headers = response.headers();
                var body = response.body();
                
                console.log("\n" + "═".repeat(60));
                console.log("📥 HTTP响应 [" + timestamp + "]");
                console.log("═".repeat(60));
                console.log("URL: " + request.url().toString());
                console.log("状态码: " + code + " " + message);
                
                // 输出响应头
                if (headers.size() > 0) {
                    console.log("\n响应头:");
                    for (var i = 0; i < headers.size(); i++) {
                        var name = headers.name(i);
                        var value = headers.value(i);
                        console.log("  " + name + ": " + value);
                    }
                }
                
                // 响应体信息
                if (body != null) {
                    var contentType = body.contentType();
                    var contentLength = body.contentLength();
                    console.log("\n响应体信息:");
                    console.log("  类型: " + (contentType ? contentType.toString() : "未知"));
                    console.log("  长度: " + (contentLength == -1 ? "未知" : contentLength + " 字节"));
                } else {
                    console.log("\n响应体: null");
                }
                
                console.log("═".repeat(60));
            } catch(e) {
                console.log("[!] 记录响应时出错: " + e);
            }
            
            return response;
        };
        
        console.log("[+] RealInterceptorChain Hook安装成功");
    } catch(e) {
        console.log("[!] RealInterceptorChain Hook失败: " + e);
    }
    
    // ==================== 5. 替代方案：Hook具体的RequestBody类型 ====================
    try {
        // Hook FormBody（表单数据）
        var FormBody = Java.use("okhttp3.FormBody");
        
        FormBody.writeTo.implementation = function(sink) {
            try {
                var size = this.size();
                if (size > 0) {
                    console.log("\n📋 Form表单数据:");
                    for (var i = 0; i < size; i++) {
                        var name = this.encodedName(i);
                        var value = this.encodedValue(i);
                        console.log("  " + name + " = " + value);
                    }
                }
            } catch(e) {
                // 忽略错误
            }
            
            // 调用原始方法
            return this.writeTo(sink);
        };
        
        console.log("[+] FormBody Hook安装成功");
    } catch(e) {
        console.log("[!] FormBody Hook失败");
    }
    
    // ==================== 6. 更简单的方法：Hook toString方法 ====================
    try {
        // Hook Request的toString方法（有些库会实现toString来打印请求详情）
        var Request = Java.use("okhttp3.Request");
        
        Request.toString.implementation = function() {
            var original = this.toString();
            try {
                var url = this.url().toString();
                var method = this.method();
                var body = this.body();
                
                console.log("\n[Request.toString] " + method + " " + url);
                
                if (body != null) {
                    // 对于简单的RequestBody，尝试读取内容
                    try {
                        // 使用反射调用一些可能的方法
                        var bodyClass = body.$className;
                        console.log("  请求体类型: " + bodyClass);
                        
                        // 如果是FormBody
                        if (bodyClass.indexOf("FormBody") !== -1) {
                            var size = body.size();
                            for (var i = 0; i < size; i++) {
                                console.log("  参数: " + body.encodedName(i) + " = " + body.encodedValue(i));
                            }
                        }
                    } catch(e) {
                        // 忽略错误
                    }
                }
            } catch(e) {
                // 忽略错误
            }
            
            return original;
        };
    } catch(e) {
        console.log("[!] Request.toString Hook失败");
    }
    
    // ==================== 7. Hook常见的JSON库 ====================
    try {
        // 如果应用使用Gson或Moshi等JSON库，可以尝试Hook它们
        console.log("[*] 尝试Hook JSON库...");
        
        // 尝试Hook Gson
        var Gson = Java.use("com.google.gson.Gson");
        console.log("[+] 找到Gson类");
        
        // Hook Gson的toJson方法
        Gson.toJson.overload('java.lang.Object').implementation = function(obj) {
            var result = this.toJson(obj);
            console.log("\n🎨 Gson序列化JSON:");
            console.log(result.length > 500 ? result.substring(0, 500) + "..." : result);
            return result;
        };
    } catch(e) {
        // 忽略，不是所有应用都使用Gson
    }
    
    console.log("\n[+] OkHttp网络流量Hook安装完成（增强版）!");
    console.log("[*] 现在开始监控所有OkHttp网络请求和响应...");
    console.log("[*] 增强功能：");
    console.log("   1. 捕获JSON请求体内容");
    console.log("   2. 捕获JSON响应体内容");
    console.log("   3. 格式化输出JSON");
    console.log("   4. 捕获Form表单数据");
});
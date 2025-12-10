// hook_okhttp_fixed.js
Java.perform(function() {
    console.log("[*] 开始Hook OkHttp网络流量...");
    
    // ==================== 1. Hook Response对象 ====================
    var Response = Java.use("okhttp3.Response");
    
    Response.$init.overload(
        'okhttp3.Request', 
        'okhttp3.Protocol', 
        'java.lang.String', 
        'int', 
        'okhttp3.Handshake', 
        'okhttp3.Headers', 
        'okhttp3.ResponseBody', 
        'okhttp3.Response', 
        'okhttp3.Response', 
        'okhttp3.Response', 
        'long', 
        'long', 
        'okhttp3.internal.connection.Exchange'
    ).implementation = function(
        request, protocol, message, code, handshake, headers, 
        body, networkResponse, cacheResponse, priorResponse,
        sentRequestAtMillis, receivedResponseAtMillis, exchange
    ) {
        var result = this.$init(
            request, protocol, message, code, handshake, headers, 
            body, networkResponse, cacheResponse, priorResponse,
            sentRequestAtMillis, receivedResponseAtMillis, exchange
        );
        
        // 记录响应信息
        logResponse(this, request, code, message, headers, body);
        
        return result;
    };
    
    // ==================== 2. Hook Request对象 ====================
    var Request = Java.use("okhttp3.Request");
    
    Request.$init.overload(
        'okhttp3.HttpUrl', 
        'java.lang.String', 
        'okhttp3.Headers', 
        'okhttp3.RequestBody', 
        'java.util.Map'
    ).implementation = function(url, method, headers, body, tags) {
        var result = this.$init(url, method, headers, body, tags);
        
        // 在实际请求发送时记录，这里仅做备用记录
        // 主要记录会在newCall中完成
        try {
            var requestUrl = url.toString();
            if (requestUrl.includes("http")) {
                console.log("[Request创建] URL: " + requestUrl);
                console.log("方法: " + method);
                logRequestBodySafe(body, "[Request创建]");
            }
        } catch(e) {
            // 忽略错误
        }
        
        return result;
    };
    
    // ==================== 3. Hook OkHttpClient的newCall方法 ====================
    var OkHttpClient = Java.use("okhttp3.OkHttpClient");
    
    OkHttpClient.newCall.implementation = function(request) {
        logRequest(request);
        return this.newCall(request);
    };
    
    // ==================== 4. 工具函数 - 修复版本 ====================
    
    // 安全记录请求体内容（不修改原始请求）
    function logRequestBodySafe(body, context) {
        try {
            if (body == null) {
                console.log(context + " 请求体: null");
                return;
            }
            
            var contentType = body.contentType();
            var contentLength = body.contentLength();
            
            console.log(context + " 请求体类型: " + (contentType ? contentType.toString() : "未知"));
            console.log(context + " 请求体长度: " + contentLength + " 字节");
            
            // 只对小文本请求体尝试读取（安全方式）
            if (contentLength > 0 && contentLength < 10240) {
                try {
                    // 使用Buffer来复制请求体内容
                    var Buffer = Java.use("okio.Buffer");
                    var buffer = Buffer.$new();
                    
                    // 创建一个临时的RequestBody来读取内容
                    var tempBody = Java.use("okhttp3.RequestBody").create(contentType, body.contentType() ? body.bytes() : "");
                    
                    // 尝试获取字节内容（如果可用）
                    if (body.bytes) {
                        try {
                            var bytes = body.bytes();
                            console.log(context + " 请求体内容(hex前64字节): " + bytesToHex(bytes.slice(0, 64)));
                        } catch(e) {
                            console.log(context + " 请求体内容: [无法直接读取字节]");
                        }
                    }
                } catch(e) {
                    console.log(context + " 请求体内容: [读取失败]");
                }
            } else if (contentLength >= 10240) {
                console.log(context + " 请求体: [太大，跳过读取]");
            }
        } catch(e) {
            console.log(context + " 请求体: [解析失败]");
        }
    }
    
    // 安全记录响应体信息
    function logResponseBodyInfo(body, context) {
        try {
            if (body == null) {
                console.log(context + " 响应体: null");
                return;
            }
            
            var contentType = body.contentType();
            var contentLength = body.contentLength();
            
            console.log(context + " 响应体类型: " + (contentType ? contentType.toString() : "未知"));
            console.log(context + " 响应体长度: " + (contentLength == -1 ? "未知" : contentLength + " 字节"));
            
            // 尝试读取响应体内容预览
            try {
                var source = body.source();
                if (source) {
                    // 请求少量数据预览
                    source.request(512);
                    var buffer = source.buffer();
                    if (buffer) {
                        var preview = buffer.clone().readUtf8(256);
                        if (preview && preview.length > 0) {
                            console.log(context + " 响应体预览(前256字符): " + 
                                (preview.length > 250 ? preview.substring(0, 250) + "..." : preview));
                        }
                    }
                }
            } catch(e) {
                // 忽略预览读取失败
            }
        } catch(e) {
            console.log(context + " 响应体: [解析失败]");
        }
    }
    
    // 辅助函数：字节数组转十六进制字符串
    function bytesToHex(bytes) {
        if (!bytes) return "";
        var hexArray = [];
        for (var i = 0; i < bytes.length && i < 64; i++) {
            var hex = bytes[i].toString(16);
            if (hex.length == 1) {
                hex = '0' + hex;
            }
            hexArray.push(hex);
        }
        return hexArray.join(' ');
    }
    
    // 记录请求的详细信息
    function logRequest(request) {
        try {
            var timestamp = new Date().toISOString();
            var url = request.url().toString();
            var method = request.method();
            var headers = request.headers();
            var body = request.body();
            var isHttps = request.isHttps();
            
            console.log("\n" + "═".repeat(60));
            console.log("📤 HTTP请求 [" + timestamp + "]");
            console.log("═".repeat(60));
            console.log("URL: " + url);
            console.log("方法: " + method);
            console.log("HTTPS: " + isHttps);
            
            // 输出请求头
            if (headers.size() > 0) {
                console.log("\n请求头:");
                for (var i = 0; i < headers.size(); i++) {
                    var name = headers.name(i);
                    var value = headers.value(i);
                    console.log("  " + name + ": " + value);
                }
            }
            
            // 输出请求体信息
            logRequestBodySafe(body, "请求体");
            
            console.log("═".repeat(60));
        } catch(e) {
            console.log("[!] 记录请求时出错: " + e);
        }
    }
    
    // 记录响应的详细信息
    function logResponse(response, request, code, message, headers, body) {
        try {
            var timestamp = new Date().toISOString();
            var url = request.url().toString();
            var protocol = response.protocol().toString();
            var isSuccessful = response.isSuccessful();
            
            console.log("\n" + "═".repeat(60));
            console.log("📥 HTTP响应 [" + timestamp + "]");
            console.log("═".repeat(60));
            console.log("URL: " + url);
            console.log("协议: " + protocol);
            console.log("状态码: " + code + " " + message);
            console.log("成功: " + isSuccessful);
            
            // 输出响应头
            if (headers.size() > 0) {
                console.log("\n响应头:");
                for (var i = 0; i < headers.size(); i++) {
                    var name = headers.name(i);
                    var value = headers.value(i);
                    console.log("  " + name + ": " + value);
                }
            }
            
            // 输出响应体信息
            logResponseBodyInfo(body, "响应体");
            
            // 输出缓存相关信息
            var networkResponse = response.networkResponse();
            var cacheResponse = response.cacheResponse();
            if (networkResponse != null || cacheResponse != null) {
                console.log("\n缓存信息:");
                if (networkResponse != null) console.log("  来自网络");
                if (cacheResponse != null) console.log("  来自缓存");
            }
            
            console.log("═".repeat(60));
        } catch(e) {
            console.log("[!] 记录响应时出错: " + e);
        }
    }
    
    // ==================== 5. 可选的：Hook异步请求 ====================
    try {
        var RealCall = Java.use("okhttp3.RealCall");
        
        // Hook同步执行
        RealCall.execute.implementation = function() {
            console.log("\n[RealCall.execute] 开始同步请求");
            var request = this.request();
            console.log("请求URL: " + request.url().toString());
            return this.execute();
        };
        
        // Hook异步执行
        RealCall.enqueue.implementation = function(callback) {
            console.log("\n[RealCall.enqueue] 开始异步请求");
            var request = this.request();
            console.log("请求URL: " + request.url().toString());
            return this.enqueue(callback);
        };
        
        console.log("[+] RealCall Hook安装成功");
    } catch(e) {
        console.log("[!] RealCall Hook失败（可能版本不匹配）");
    }
    
    // ==================== 6. Hook特定的拦截器（可选） ====================
    try {
        // 可以尝试Hook常见的拦截器
        console.log("[*] 尝试Hook常用拦截器...");
        
        // 例如，Hook日志拦截器（如果应用使用了的话）
        var loggingInterceptor = Java.use("okhttp3.logging.HttpLoggingInterceptor");
        console.log("[+] 找到HttpLoggingInterceptor类");
    } catch(e) {
        // 忽略，不是所有应用都使用这个拦截器
    }
    
    console.log("\n[+] OkHttp网络流量Hook安装完成!");
    console.log("[*] 现在开始监控所有OkHttp网络请求和响应...");
    console.log("[*] 注意：请求体内容读取可能需要根据具体RequestBody类型调整");
});
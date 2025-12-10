console.log("[*] Starting SecureX509TrustManager Certificate Monitor...");

Java.perform(function() {
    
    // 目标类名 - 如果被混淆，需要调整
    var targetClassName = "com.huawei.secure.android.common.ssl.SecureX509TrustManager";
    
    try {
        var SecureX509TM = Java.use(targetClassName);
        var X509Certificate = Java.use("java.security.cert.X509Certificate");
        var SimpleDateFormat = Java.use("java.text.SimpleDateFormat");
        
        // 辅助函数：格式化日期
        function formatDate(date) {
            if (!date) return "N/A";
            try {
                var formatter = SimpleDateFormat.$new("yyyy-MM-dd HH:mm:ss");
                return formatter.format(date);
            } catch(e) {
                return date.toString();
            }
        }
        
        // 辅助函数：提取证书信息
        function getCertificateInfo(cert, index) {
            if (!cert) return {};
            
            var info = {
                index: index,
                subject: "N/A",
                issuer: "N/A",
                serial: "N/A",
                notBefore: "N/A",
                notAfter: "N/A",
                sigAlg: "N/A"
            };
            
            try {
                info.subject = cert.getSubjectDN().getName();
            } catch(e) {}
            
            try {
                info.issuer = cert.getIssuerDN().getName();
            } catch(e) {}
            
            try {
                info.serial = cert.getSerialNumber().toString(16);
            } catch(e) {}
            
            try {
                info.notBefore = formatDate(cert.getNotBefore());
            } catch(e) {}
            
            try {
                info.notAfter = formatDate(cert.getNotAfter());
            } catch(e) {}
            
            try {
                info.sigAlg = cert.getSigAlgName();
            } catch(e) {}
            
            return info;
        }
        
        // 辅助函数：打印证书链
        function printCertificateChain(chain, authType) {
            console.log("\n" + "=".repeat(80));
            console.log("[*] SecureX509TrustManager.checkServerTrusted() 被调用");
            console.log("[*] 时间: " + new Date().toLocaleString());
            console.log("[*] 认证类型: " + authType);
            console.log("[*] 证书链长度: " + chain.length);
            console.log("-".repeat(80));
            
            for (var i = 0; i < chain.length; i++) {
                var cert = chain[i];
                var info = getCertificateInfo(cert, i);
                
                console.log("\n[证书 #" + i + "]:");
                console.log("  ├─ 主题 (Subject): " + info.subject);
                console.log("  ├─ 签发者 (Issuer): " + info.issuer);
                console.log("  ├─ 序列号 (Serial): " + info.serial);
                console.log("  ├─ 签名算法: " + info.sigAlg);
                console.log("  ├─ 有效期从: " + info.notBefore);
                console.log("  └─ 有效期至: " + info.notAfter);
                
                // 额外：尝试获取SAN（主题备用名称）
                try {
                    var sanExt = cert.getSubjectAlternativeNames();
                    if (sanExt) {
                        console.log("  ├─ 主题备用名 (SAN): ");
                        var iter = sanExt.iterator();
                        var sanCount = 0;
                        while (iter.hasNext()) {
                            var san = iter.next();
                            console.log("  │   类型 " + san.get(0) + ": " + san.get(1));
                            sanCount++;
                            if (sanCount > 3) { // 限制输出数量
                                console.log("  │   ... 还有更多");
                                break;
                            }
                        }
                    }
                } catch(e) {}
            }
            
            // 打印调用栈（了解谁调用了验证）
            console.log("\n[*] 调用栈:");
            var stackTrace = Java.use("android.util.Log").getStackTraceString(
                Java.use("java.lang.Throwable").$new()
            );
            // 只显示前10行，避免过多输出
            var lines = stackTrace.split("\n");
            for (var j = 0; j < Math.min(lines.length, 12); j++) {
                if (lines[j].includes("secure.android.common.ssl")) {
                    console.log("  !> " + lines[j]);
                } else {
                    console.log("    " + lines[j]);
                }
            }
            
            console.log("=".repeat(80) + "\n");
        }
        
        // HOOK 主要的 checkServerTrusted 方法
        // 注意：根据源代码，这个方法有参数 (X509Certificate[], String)
        SecureX509TM.checkServerTrusted.overload('[Ljava.security.cert.X509Certificate;', 'java.lang.String').implementation = function(chain, authType) {
            console.log("\n[→] 进入 checkServerTrusted 验证流程");
            
            // 打印证书信息
            printCertificateChain(chain, authType);
            
            // 调用原方法继续验证（如果希望绕过，可以注释掉下面这行）
            console.log("[←] 继续执行原始验证逻辑...");
            return this.checkServerTrusted(chain, authType);
        };
        
        // 也HOOK checkClientTrusted 以防万一
        SecureX509TM.checkClientTrusted.overload('[Ljava.security.cert.X509Certificate;', 'java.lang.String').implementation = function(chain, authType) {
            console.log("\n[→] 进入 checkClientTrusted (客户端验证)");
            printCertificateChain(chain, authType);
            return this.checkClientTrusted(chain, authType);
        };
        
        // HOOK 构造函数，了解TrustManager如何初始化
        SecureX509TM.$init.overload('android.content.Context', 'boolean').implementation = function(context, loadSystemCA) {
            console.log("[*] SecureX509TrustManager 初始化中...");
            console.log("    - 上下文: " + context);
            console.log("    - 加载系统CA: " + loadSystemCA);
            
            // 调用原始构造函数
            var result = this.$init(context, loadSystemCA);
            
            // 初始化后，可以查看内部的TrustManager列表
            try {
                var trustManagerList = this.f1956a.value;
                if (trustManagerList) {
                    console.log("    - 内部TrustManager数量: " + trustManagerList.size());
                }
            } catch(e) {}
            
            return result;
        };
        
        console.log("[✓] SecureX509TrustManager Hook 成功!");
        console.log("[*] 等待证书验证事件...\n");
        
    } catch (error) {
        console.log("[!] Hook 失败: " + error.message);
        console.log("[!] 可能原因:");
        console.log("    1. 类名不正确或被混淆");
        console.log("    2. 应用尚未加载该类");
        console.log("    3. 方法签名不匹配");
        
        // 尝试搜索类
        console.log("\n[*] 尝试搜索包含 'secure' 的类...");
        var classes = Java.enumerateLoadedClassesSync();
        var foundClasses = [];
        for (var i = 0; i < classes.length; i++) {
            if (classes[i].toLowerCase().includes("secure") && classes[i].toLowerCase().includes("ssl")) {
                foundClasses.push(classes[i]);
            }
        }
        
        if (foundClasses.length > 0) {
            console.log("[*] 找到可能的相关类:");
            foundClasses.forEach(function(className) {
                console.log("    - " + className);
            });
        }
    }
});

// 保持脚本存活
setImmediate(function() {
    console.log("[*] 监控脚本已加载，等待事件...");
});
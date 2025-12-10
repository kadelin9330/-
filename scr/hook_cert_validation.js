// hook_lambda_invoke.js
Java.perform(function() {
    console.log("[*] 尝试Hook确定的匿名类: okhttp3.CertificatePinner$check$1");

    try {
        // 1. 使用你确定的类名
        var TargetLambdaClass = Java.use("okhttp3.CertificatePinner$check$1");

        // 2. Hook其invoke方法
        TargetLambdaClass.invoke.implementation = function() {
            console.log("\n[=== Lambda invoke() 被调用 ===]");
            
            // 关键：先调用原方法，获取其返回值 (即listInvoke)
            var resultList = this.invoke();
            
            console.log("[+] Lambda执行完毕，返回List<X509Certificate>。");
            console.log("[+] 列表大小: " + resultList.size());

            // 3. 详细打印返回的证书链信息
            if (resultList && resultList.size() > 0) {
                console.log("[+] 证书链详情:");
                var X509Certificate = Java.use("java.security.cert.X509Certificate");
                for (var i = 0; i < resultList.size(); i++) {
                    var cert = Java.cast(resultList.get(i), X509Certificate);
                    console.log("  [#" + i + "] " + cert.getSubjectDN().getName());
                    console.log("      颁发者: " + cert.getIssuerDN().getName());
                    // 计算并打印SHA-256指纹，这是证书绑定的核心比对值
                    try {
                        var md = Java.use('java.security.MessageDigest').getInstance("SHA-256");
                        var hashBytes = md.digest(cert.getEncoded());
                        var hashHex = Array.prototype.map.call(hashBytes, function(b) {
                            return ('0' + (b & 0xFF).toString(16)).slice(-2);
                        }).join(':').toUpperCase();
                        console.log("      指纹(SHA-256): " + hashHex);
                    } catch(e) {}
                    console.log(""); // 空行分隔
                }
            } else {
                console.log("[!] 返回的证书列表为空或无效。");
            }

            // 4. 将原返回值返回，保持程序正常流程
            return resultList;

            // ==================== 重要：绕过选项 ====================
            // 如果你在分析后，确定需要**绕过**此Lambda的证书处理逻辑，
            // 可以注释掉上面的 `return resultList;`，取消下面代码的注释。
            // 这样将返回一个空列表，可能导致后续绑定验证因无证书而“通过”（行为取决于具体代码）。
            /*
            console.log("[!] 已启用绕过模式：返回空列表。");
            return Java.use('java.util.ArrayList').$new();
            */
        };

        console.log("[✓] 成功Hook匿名类 okhttp3.CertificatePinner$check$1 的 invoke 方法。");

    } catch (e) {
        console.log("[!] Hook失败，可能的原因：");
        console.log("    1. 类尚未被加载。请在触发网络请求（证书验证）后再试。");
        console.log("    2. 类名在运行时可能有微小差异（极小概率）。");
        console.log("    错误详情: " + e);
    }

    console.log("\n[*] 脚本加载完成。请在App内触发HTTPS请求以观察输出。");
});
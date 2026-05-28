// 将 PEM 格式的公钥转换为 ArrayBuffer
function pemToArrayBuffer(pem: string) {
    // 去掉 PEM 头尾和空白字符
    const base64 = pem
        .replace('-----BEGIN PUBLIC KEY-----', '')
        .replace('-----END PUBLIC KEY-----', '')
        .replace(/\s/g, '')
    // Base64 解码为二进制字符串
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
}

// 将 ArrayBuffer 转换为 Base64 字符串
function arrayBufferToBase64(buffer: ArrayBuffer) {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    bytes.forEach((byte) => (binary += String.fromCharCode(byte)))
    return btoa(binary)
}

/**
 * 使用 RSA-OAEP 加密登录密码
 * @param {string} plainPassword - 明文密码
 * @param {string} publicKeyPem - PEM 格式的公钥字符串
 * @returns {Promise<string>} Base64 编码的密文
 */
export async function encryptLoginPassword(
    plainPassword: string | undefined,
    publicKeyPem: string,
) {
    console.log('publicKeyPem:', publicKeyPem)
    // 1. 将 PEM 公钥转成二进制 DER 格式
    const binaryDer = pemToArrayBuffer(publicKeyPem)

    // 2. 导入公钥 —— 关键参数
    const publicKey = await crypto.subtle.importKey(
        'spki', // 必须是 spki（SubjectPublicKeyInfo）
        binaryDer,
        {
            name: 'RSA-OAEP', // 算法名称
            hash: 'SHA-256', // 哈希算法，前后端必须一致
        },
        false, // 不需要导出
        ['encrypt'], // 仅用于加密
    )

    // 3. 将明文密码转为 UTF-8 编码的字节流
    const encodedPassword = new TextEncoder().encode(plainPassword)

    // 4. 执行 RSA-OAEP 加密
    const encrypted = await crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        publicKey,
        encodedPassword,
    )

    // 5. 将密文转为 Base64 字符串返回
    return arrayBufferToBase64(encrypted)
}

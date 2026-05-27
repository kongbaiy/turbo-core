// 将 PEM 转换为 ArrayBuffer
function pemToArrayBuffer(pem: string) {
    const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\n/g, '');
    const binary = atob(b64);
    const buffer = new ArrayBuffer(binary.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < binary.length; i++) {
        view[i] = binary.charCodeAt(i);
    }
    return buffer;
}

// 导入公钥
export async function importPublicKey(pem: string) {
    const keyBuffer = pemToArrayBuffer(pem);
    return await window.crypto.subtle.importKey(
        'spki',
        keyBuffer,
        {
            name: 'RSA-OAEP',
            hash: 'SHA-256'
        },
        true,
        ['encrypt']
    );
}

export async function encryptMessage(publicKey: CryptoKey, plaintext: string | undefined) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    const encrypted = await window.crypto.subtle.encrypt(
        {
            name: 'RSA-OAEP'
        },
        publicKey,
        data
    );

    // 返回 Base64 编码的密文（便于传输）
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

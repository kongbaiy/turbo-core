export interface PasswordPublicKey {
    algorithm: string
    publicKey: string
}

export async function encryptLoginPassword(
    plainPassword: string,
    publicKeyPem: string,
) {
    const binaryDer = pemToArrayBuffer(publicKeyPem)
    const publicKey = await crypto.subtle.importKey(
        'spki',
        binaryDer,
        {
            name: 'RSA-OAEP',
            hash: 'SHA-256',
        },
        false,
        ['encrypt'],
    )
    const encrypted = await crypto.subtle.encrypt(
        {
            name: 'RSA-OAEP',
        },
        publicKey,
        new TextEncoder().encode(plainPassword),
    )
    return arrayBufferToBase64(encrypted)
}

function pemToArrayBuffer(pem: string) {
    const base64 = pem
        .replace('-----BEGIN PUBLIC KEY-----', '')
        .replace('-----END PUBLIC KEY-----', '')
        .replace(/\s/g, '')
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    bytes.forEach((byte) => {
        binary += String.fromCharCode(byte)
    })
    return btoa(binary)
}

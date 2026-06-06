import type { ModalStaticFunctions } from 'antd/es/modal/confirm'
import type { MessageInstance } from 'antd/es/message/interface'
import type { NotificationInstance } from 'antd/es/notification/interface'

let modal: Omit<ModalStaticFunctions, 'warn'> | null = null;
let message: MessageInstance | null = null;
let notification: NotificationInstance | null = null;

export function initAntdGlobal(antdApp: any) {
    const { modal: modalInstance, message: messageInstance, notification: notificationInstance } = antdApp
    modal = modalInstance;
    message = messageInstance;
    notification = notificationInstance;
}

export function getModal() {
    if (!modal) throw new Error('Modal not initialized. Call initAntdGlobal in root component.');
    return modal;
}

export function getMessage() {
    if (!message) throw new Error('Message not initialized.');
    return message;
}

export function getNotification() {
    if (!notification) throw new Error('Notification not initialized.');
    return notification;
}
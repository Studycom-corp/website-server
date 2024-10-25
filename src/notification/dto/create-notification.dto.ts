export class CreateNotificationDto {
    target: string[]
    body: string
    source: string
    link?: string
    subject?: string
    layout: string
}

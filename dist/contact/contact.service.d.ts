import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { ContactDto } from './dto/contact.dto';
export declare class ContactService {
    private readonly mail;
    private readonly config;
    constructor(mail: MailService, config: ConfigService);
    private esc;
    send(dto: ContactDto): Promise<{
        success: boolean;
        message: string;
    }>;
}

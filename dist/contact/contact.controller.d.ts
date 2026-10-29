import { ContactService } from './contact.service';
import { ContactDto } from './dto/contact.dto';
export declare class ContactController {
    private readonly contactService;
    constructor(contactService: ContactService);
    send(dto: ContactDto): Promise<{
        success: boolean;
        message: string;
    }>;
}

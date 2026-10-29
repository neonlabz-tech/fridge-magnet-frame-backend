import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackService } from './feedback.service';
export declare class FeedbackController {
    private readonly feedbackService;
    constructor(feedbackService: FeedbackService);
    create(dto: CreateFeedbackDto): Promise<import("mongoose").Document<unknown, {}, import("./schemas/feedback.schema").FeedbackDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/feedback.schema").Feedback & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    findAll(): import("mongoose").Query<(import("mongoose").Document<unknown, {}, import("./schemas/feedback.schema").FeedbackDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/feedback.schema").Feedback & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[], import("mongoose").Document<unknown, {}, import("./schemas/feedback.schema").FeedbackDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/feedback.schema").Feedback & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }, {}, import("./schemas/feedback.schema").FeedbackDocument, "find", {}>;
}

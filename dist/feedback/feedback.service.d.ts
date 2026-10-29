import { Model } from 'mongoose';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { Feedback, FeedbackDocument } from './schemas/feedback.schema';
export declare class FeedbackService {
    private feedbackModel;
    constructor(feedbackModel: Model<FeedbackDocument>);
    create(dto: CreateFeedbackDto): Promise<import("mongoose").Document<unknown, {}, FeedbackDocument, {}, import("mongoose").DefaultSchemaOptions> & Feedback & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    findAll(): import("mongoose").Query<(import("mongoose").Document<unknown, {}, FeedbackDocument, {}, import("mongoose").DefaultSchemaOptions> & Feedback & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[], import("mongoose").Document<unknown, {}, FeedbackDocument, {}, import("mongoose").DefaultSchemaOptions> & Feedback & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }, {}, FeedbackDocument, "find", {}>;
}
